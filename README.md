# CanSat Ground Control Software (GCS)

A professional single-page Ground Control Software dashboard for a CanSat mission. The software monitors telemetry data in real time, visualizes mission parameters, displays GPS tracking, handles mission controls, and simulates aerospace mission operations.

## Live Website
Access the live website hosted on GitHub Pages: [https://doromani.github.io/ISLPro/](https://doromani.github.io/ISLPro/)

## Executive Summary
The **CanSat Ground Control Software (GCS)** is a comprehensive, web-based dashboard designed to monitor, control, and analyze telemetry data from a CanSat (a simulated satellite integrated within the volume and shape of a soft drink can) during its mission. Built with modern web technologies, it offers a zero-install, cross-platform solution for real-time mission operations, visualization, and post-flight analysis.

## Key Features

### 1. Real-Time Telemetry Processing
The GCS is capable of processing complex telemetry streams, maintaining separate data contexts for both the **Container** and the **Payload**. Tracked parameters include:
*   **Atmospheric Data:** Altitude, Pressure, Temperature
*   **Spatial Data:** GPS Latitude, Longitude, Altitude, and Satellite Count
*   **Dynamics:** Tilt (X/Y), Rotation Rate, Descent Rate
*   **System Health:** Battery Voltage, Mission Time, Packet Count, Software State

### 2. Mission Phase Tracking
The system automatically tracks and visually indicates the current flight phase based on telemetry data:
*   `PRE-LAUNCH` -> `ASCENT` -> `APOGEE` -> `SEPARATION` -> `DESCENT` -> `LANDED`

### 3. Flexible Data Acquisition Interfaces
To support various hardware setups and testing environments, the GCS implements multiple connection protocols:
*   **Web Serial API:** Direct, browser-to-hardware connection to serial radio receivers (e.g., XBee, LoRa modules) via USB, eliminating the need for middleware.
*   **WebSocket Bridge:** Allows connection to a local or remote Python backend (`telemetry_simulator/ws_bridge.py`), useful for routing data or integrating with external software.
*   **Internal Flight Simulator:** A built-in, physics-based telemetry simulator that models ascent, apogee, separation, parachute descent, and sensor noise. This allows teams to test the GCS UI and command logic without physical hardware.

### 4. Interactive Dashboard & Visualization
*   **Live Graphs:** Utilizes **Chart.js** to render real-time plots of Altitude, Pressure, Temperature, Descent Rate, and Battery Voltage.
*   **GPS Tracking:** Integrates **Leaflet.js** for real-time map plotting of the CanSat's coordinates.
*   **3D Orientation:** Employs **Three.js** to provide a live 3D visual representation of the CanSat's Roll, Pitch, and Yaw.
*   **Video Feed:** Interface for integrating live video streams from payload cameras.

### 5. Mission Control & Command Uplink
*   Payload Separation Command
*   Emergency Parachute Deployment
*   Redundant Activation Commands

### 6. Testing & Fault Injection
Designed with robustness in mind, the simulator includes "Fault Injection" capabilities. Operators can deliberately trigger errors such as **GPS Dropouts** or **Descent Rate Anomalies**.

### 7. Data Logging & Export
*   **CSV Export:** All incoming telemetry is buffered and can be exported as a standard CSV file for post-mission data review and judging.
*   **Graph Export:** Visual charts can be exported directly as PNG images for inclusion in Post-Flight Review (PFR) documents.

## WebSocket Workflow & Telemetry Logging
The application uses a WebSocket bridge (`ws_bridge`) to stream and log telemetry data:
1. The CanSat hardware transmits telemetry to a ground receiver (or simulated data is generated).
2. A local Python script (`ws_bridge.py`) reads this data and broadcasts it over a WebSocket server.
3. The GCS frontend connects to this WebSocket server to receive live telemetry packets.
4. As packets are received, they are parsed and logged into the in-memory data store for real-time visualization and CSV export.

## Configuration & Usage

### Evaluator's VS Code Setup
To run the GCS locally using VS Code:
1. Clone or download the repository to your local machine.
2. Open the project folder `cansat-gcs` in **Visual Studio Code**.
3. Install the **Live Server** extension by Ritwick Dey.
4. Right-click on `index.html` and select **"Open with Live Server"**.
5. The dashboard will open in your default browser (preferably Chrome or Edge for Web Serial API support).

### Alternative Setup (No IDE)
If you do not have VS Code or prefer a simpler method:
1. You can simply double-click the `index.html` file to open it in your web browser. *(Note: Some features like Web Serial API might be restricted when running directly from the `file://` protocol. Using a local server is recommended).*
2. Or use Python's built-in HTTP server:
   Open a terminal in the project directory and run:
   ```bash
   python -m http.server 8000
   ```
   Then navigate to `http://localhost:8000` in your web browser.

## Technology Stack
*   **Frontend Structure & Styling:** HTML5, CSS3 (Custom Variables, Flexbox/Grid layouts for responsive design).
*   **Core Logic:** Vanilla JavaScript (ES6+).
*   **Visualization Libraries:** Chart.js (Data Plotting), Leaflet.js (Mapping), Three.js (3D Rendering).
*   **Simulator Backend (Optional):** Python 3 (`websockets` library).
