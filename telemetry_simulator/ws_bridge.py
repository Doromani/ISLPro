import asyncio
import os
import subprocess
import sys

import websockets

# Keep track of connected clients
clients = set()


def build_wokwi_env():
    token = os.environ.get("WOKWI_CLI_TOKEN") or os.environ.get("WOKWI_TOKEN")
    env = os.environ.copy()
    if token:
        env["WOKWI_CLI_TOKEN"] = token
    return env


def build_wokwi_command():
    return ["wokwi-cli", ".", "--timeout", "0"]


def normalize_line(line):
    return line.strip().replace("\r", "")


async def handler(websocket, *args):
    # Register client
    clients.add(websocket)
    print(f"[+] Client connected. Total clients: {len(clients)}")
    try:
        # Wait until connection is closed
        await websocket.wait_closed()
    finally:
        clients.remove(websocket)
        print(f"[-] Client disconnected. Total clients: {len(clients)}")

async def broadcast_line(line):
    if not line or not clients:
        return

    disconnected = set()
    for client in clients:
        try:
            await client.send(line)
        except websockets.ConnectionClosed:
            disconnected.add(client)

    for client in disconnected:
        clients.discard(client)


async def read_stdin_and_broadcast():
    loop = asyncio.get_event_loop()
    print("Waiting for Wokwi serial data on stdin (or paste it here)...")
    while True:
        line = await loop.run_in_executor(None, sys.stdin.readline)
        if not line:
            break

        await broadcast_line(normalize_line(line))


async def read_wokwi_stream(proc):
    loop = asyncio.get_event_loop()
    while True:
        line = await loop.run_in_executor(None, proc.stdout.readline)
        if not line:
            break

        await broadcast_line(normalize_line(line))

    return_code = await loop.run_in_executor(None, proc.poll)
    if return_code is not None:
        print(f"Wokwi process exited with code {return_code}")


async def main():
    await websockets.serve(handler, "localhost", 8765)
    print("WebSocket bridge started on ws://localhost:8765")

    cmd = build_wokwi_command()
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=build_wokwi_env(),
    )
    print("Starting Wokwi via:", " ".join(cmd))

    try:
        await read_wokwi_stream(proc)
    finally:
        if proc.poll() is None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nBridge stopped.")
