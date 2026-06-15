/* ============================================================
   Telemetry Simulator & Parser — telemetry.js
   Simulates realistic CanSat mission data with phase transitions
   ============================================================ */

const Telemetry = (() => {
  // Mission phases
  const PHASES = {
    PRE_LAUNCH: 'PRE-LAUNCH',
    ASCENT: 'ASCENT',
    APOGEE: 'APOGEE',
    SEPARATION: 'SEPARATION',
    DESCENT: 'DESCENT',
    LANDING: 'LANDING',
    LANDED: 'LANDED'
  };

  // Simulation state
  let state = {
    running: false,
    intervalId: null,
    updateRate: 1000,  // ms
    missionTime: 0,    // seconds since launch
    packetCount: 0,
    phase: PHASES.PRE_LAUNCH,
    listeners: [],

    // Container telemetry
    container: {
      teamId: 3042,
      altitude: 0,
      pressure: 1013.25,
      temperature: 25.0,
      voltage: 8.4,
      gpsLat: 28.6139,
      gpsLon: 77.2090,
      gpsAlt: 0,
      gpsSats: 12,
      tiltX: 0,
      tiltY: 0,
      rotationRate: 0,
      state: 'LAUNCH_PAD',
      mode: 'FLIGHT',
      cmdEcho: 'NONE'
    },

    // Payload telemetry
    payload: {
      altitude: 0,
      pressure: 1013.25,
      temperature: 25.5,
      voltage: 4.2,
      gpsLat: 28.6139,
      gpsLon: 77.2090,
      gpsAlt: 0,
      tiltX: 0,
      tiltY: 0,
      rotationRate: 0,
      separated: false,
      parachuteDeployed: false
    },

    // Derived values
    descentRate: 0,
    prevAltitude: 0,

    // Fault injection
    faults: {
      gpsDropout: false,
      descentRateFault: false,
      separationFault: false,
      emergencyParachute: false
    }
  };

  // --- Noise helper ---
  function noise(amplitude = 1) {
    return (Math.random() - 0.5) * 2 * amplitude;
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  // --- Phase transition logic ---
  function updatePhase() {
    const t = state.missionTime;
    const alt = state.container.altitude;

    switch (state.phase) {
      case PHASES.PRE_LAUNCH:
        if (t >= 3) {
          state.phase = PHASES.ASCENT;
          state.container.state = 'ASCENT';
        }
        break;
      case PHASES.ASCENT:
        if (alt >= 700) {
          state.phase = PHASES.APOGEE;
          state.container.state = 'APOGEE';
        }
        break;
      case PHASES.APOGEE:
        if (t > 78) {
          state.phase = PHASES.SEPARATION;
          state.container.state = 'SEPARATION';
          state.payload.separated = true;
        }
        break;
      case PHASES.SEPARATION:
        if (t > 82) {
          state.phase = PHASES.DESCENT;
          state.container.state = 'DESCENT';
          state.payload.parachuteDeployed = true;
        }
        break;
      case PHASES.DESCENT:
        if (alt <= 5) {
          state.phase = PHASES.LANDED;
          state.container.state = 'LANDED';
        }
        break;
    }
  }

  // --- Simulate sensor data for one tick ---
  function simulateTick() {
    const t = state.missionTime;
    state.prevAltitude = state.container.altitude;

    switch (state.phase) {
      case PHASES.PRE_LAUNCH:
        state.container.altitude = noise(0.3);
        state.container.pressure = 1013.25 + noise(0.1);
        state.container.temperature = 25 + noise(0.2);
        state.descentRate = 0;
        break;

      case PHASES.ASCENT: {
        // Ascent at ~10 m/s with some acceleration
        const ascentTime = t - 3;
        state.container.altitude = Math.min(750, 10 * ascentTime + 0.02 * ascentTime * ascentTime) + noise(1.5);
        state.container.pressure = 1013.25 * Math.exp(-state.container.altitude / 8500) + noise(0.5);
        state.container.temperature = 25 - state.container.altitude * 0.0065 + noise(0.3);
        state.descentRate = -(10 + 0.04 * ascentTime) + noise(0.5); // negative = ascending
        break;
      }

      case PHASES.APOGEE:
        state.container.altitude = 720 + noise(5);
        state.container.pressure = 1013.25 * Math.exp(-state.container.altitude / 8500) + noise(0.5);
        state.container.temperature = 25 - state.container.altitude * 0.0065 + noise(0.3);
        state.descentRate = noise(1);
        break;

      case PHASES.SEPARATION:
        state.container.altitude = Math.max(650, state.container.altitude - 3 + noise(2));
        state.container.pressure = 1013.25 * Math.exp(-state.container.altitude / 8500) + noise(0.5);
        state.container.temperature = 25 - state.container.altitude * 0.0065 + noise(0.3);
        state.descentRate = 3 + noise(1);
        break;

      case PHASES.DESCENT: {
        // Parachute descent at 8-10 m/s
        const rate = state.faults.descentRateFault ? 15 + noise(2) : 9 + noise(0.8);
        state.container.altitude = Math.max(0, state.container.altitude - rate * (state.updateRate / 1000));
        state.container.pressure = 1013.25 * Math.exp(-state.container.altitude / 8500) + noise(0.5);
        state.container.temperature = 25 - state.container.altitude * 0.0065 + noise(0.3);
        state.descentRate = rate;
        break;
      }

      case PHASES.LANDED:
        state.container.altitude = noise(0.2);
        state.container.pressure = 1013.25 + noise(0.1);
        state.container.temperature = 25 + noise(0.2);
        state.descentRate = 0;
        break;
    }

    // GPS simulation — drift slightly
    if (!state.faults.gpsDropout) {
      state.container.gpsLat += noise(0.00003);
      state.container.gpsLon += noise(0.00003);
      state.container.gpsAlt = Math.max(0, state.container.altitude);
      state.container.gpsSats = Math.floor(8 + Math.random() * 5);
    } else {
      state.container.gpsSats = 0;
    }

    // Voltage drain
    state.container.voltage = clamp(8.4 - t * 0.003 + noise(0.02), 6.0, 8.5);
    state.payload.voltage = clamp(4.2 - t * 0.001 + noise(0.01), 3.0, 4.3);

    // Orientation (roll, pitch, yaw)
    state.container.tiltX = clamp(state.container.tiltX + noise(3), -45, 45);
    state.container.tiltY = clamp(state.container.tiltY + noise(3), -45, 45);
    state.container.rotationRate = noise(15);

    // Copy relevant data to payload (when separated, diverge slightly)
    if (state.payload.separated) {
      state.payload.altitude = state.container.altitude + noise(5);
      state.payload.pressure = state.container.pressure + noise(1);
      state.payload.temperature = state.container.temperature + noise(0.5);
      state.payload.gpsLat = state.container.gpsLat + noise(0.00005);
      state.payload.gpsLon = state.container.gpsLon + noise(0.00005);
      state.payload.gpsAlt = state.container.gpsAlt + noise(2);
      state.payload.tiltX = clamp(state.payload.tiltX + noise(5), -90, 90);
      state.payload.tiltY = clamp(state.payload.tiltY + noise(5), -90, 90);
      state.payload.rotationRate = noise(25);
    } else {
      state.payload.altitude = state.container.altitude;
      state.payload.pressure = state.container.pressure;
      state.payload.temperature = state.container.temperature;
      state.payload.gpsLat = state.container.gpsLat;
      state.payload.gpsLon = state.container.gpsLon;
      state.payload.gpsAlt = state.container.gpsAlt;
      state.payload.tiltX = state.container.tiltX;
      state.payload.tiltY = state.container.tiltY;
      state.payload.rotationRate = state.container.rotationRate;
    }

    // Increment counters
    state.missionTime += state.updateRate / 1000;
    state.packetCount++;

    // Phase transitions
    updatePhase();
  }

  // --- Build telemetry packet object ---
  function buildPacket() {
    return {
      teamId: state.container.teamId,
      missionTime: state.missionTime.toFixed(1),
      packetCount: state.packetCount,
      mode: state.container.mode,
      state: state.container.state,
      phase: state.phase,

      // Container
      altitude: parseFloat(state.container.altitude.toFixed(2)),
      pressure: parseFloat(state.container.pressure.toFixed(2)),
      temperature: parseFloat(state.container.temperature.toFixed(2)),
      voltage: parseFloat(state.container.voltage.toFixed(2)),
      gpsLat: parseFloat(state.container.gpsLat.toFixed(6)),
      gpsLon: parseFloat(state.container.gpsLon.toFixed(6)),
      gpsAlt: parseFloat(state.container.gpsAlt.toFixed(2)),
      gpsSats: state.container.gpsSats,
      tiltX: parseFloat(state.container.tiltX.toFixed(2)),
      tiltY: parseFloat(state.container.tiltY.toFixed(2)),
      rotationRate: parseFloat(state.container.rotationRate.toFixed(2)),
      cmdEcho: state.container.cmdEcho,

      // Payload
      payloadAltitude: parseFloat(state.payload.altitude.toFixed(2)),
      payloadPressure: parseFloat(state.payload.pressure.toFixed(2)),
      payloadTemperature: parseFloat(state.payload.temperature.toFixed(2)),
      payloadVoltage: parseFloat(state.payload.voltage.toFixed(2)),
      payloadGpsLat: parseFloat(state.payload.gpsLat.toFixed(6)),
      payloadGpsLon: parseFloat(state.payload.gpsLon.toFixed(6)),
      payloadTiltX: parseFloat(state.payload.tiltX.toFixed(2)),
      payloadTiltY: parseFloat(state.payload.tiltY.toFixed(2)),
      payloadRotationRate: parseFloat(state.payload.rotationRate.toFixed(2)),
      payloadSeparated: state.payload.separated,
      payloadParachute: state.payload.parachuteDeployed,

      // Derived
      descentRate: parseFloat(state.descentRate.toFixed(2)),

      // Faults
      faults: { ...state.faults },

      // Timestamp
      timestamp: Date.now()
    };
  }

  // --- CSV string from packet ---
  function packetToCSV(pkt) {
    return [
      pkt.teamId, pkt.missionTime, pkt.packetCount, pkt.mode, pkt.state,
      pkt.altitude, pkt.pressure, pkt.temperature, pkt.voltage,
      pkt.gpsLat, pkt.gpsLon, pkt.gpsAlt, pkt.gpsSats,
      pkt.tiltX, pkt.tiltY, pkt.rotationRate,
      pkt.descentRate,
      pkt.payloadSeparated ? 1 : 0,
      pkt.payloadParachute ? 1 : 0,
      pkt.cmdEcho
    ].join(',');
  }

  function csvHeader() {
    return 'TEAM_ID,MISSION_TIME,PACKET_COUNT,MODE,STATE,ALTITUDE,PRESSURE,TEMPERATURE,VOLTAGE,GPS_LAT,GPS_LON,GPS_ALT,GPS_SATS,TILT_X,TILT_Y,ROTATION_RATE,DESCENT_RATE,PAYLOAD_SEPARATED,PARACHUTE_DEPLOYED,CMD_ECHO';
  }

  // --- Web Serial API ---
  let serialPort = null;
  let serialReader = null;
  let keepReading = false;
  let serialBuffer = '';

  async function connectSerial(baudRate = 115200) {
    if (!("serial" in navigator)) {
      alert("Web Serial API not supported in this browser. Please use Chrome or Edge.");
      return false;
    }
    try {
      serialPort = await navigator.serial.requestPort();
      await serialPort.open({ baudRate });
      keepReading = true;
      readSerialLoop();
      return true;
    } catch (err) {
      console.error("Failed to connect to serial port:", err);
      return false;
    }
  }

  async function readSerialLoop() {
    while (serialPort && serialPort.readable && keepReading) {
      serialReader = serialPort.readable.getReader();
      try {
        while (true) {
          const { value, done } = await serialReader.read();
          if (done) break;
          if (value) {
            const text = new TextDecoder().decode(value);
            serialBuffer += text;
            let lines = serialBuffer.split('\n');
            serialBuffer = lines.pop(); // keep incomplete line
            for (let line of lines) {
              line = line.trim();
              if (line) processSerialLine(line);
            }
          }
        }
      } catch (error) {
        console.error("Error reading serial data:", error);
      } finally {
        if (serialReader) {
          serialReader.releaseLock();
          serialReader = null;
        }
      }
    }
  }

  async function disconnectSerial() {
    keepReading = false;
    if (serialReader) {
      await serialReader.cancel();
      serialReader = null;
    }
    if (serialPort) {
      await serialPort.close();
      serialPort = null;
    }
  }

  function processSerialLine(line) {
    const parts = line.split(',');
    if (parts.length < 20) return; // Need at least 20 columns

    const pkt = {
      teamId: parts[0],
      missionTime: parseFloat(parts[1]).toFixed(1),
      packetCount: parseInt(parts[2]),
      mode: parts[3],
      state: parts[4],
      phase: parts[4], // Fallback if phase not separated
      altitude: parseFloat(parts[5]),
      pressure: parseFloat(parts[6]),
      temperature: parseFloat(parts[7]),
      voltage: parseFloat(parts[8]),
      gpsLat: parseFloat(parts[9]),
      gpsLon: parseFloat(parts[10]),
      gpsAlt: parseFloat(parts[11]),
      gpsSats: parseInt(parts[12]),
      tiltX: parseFloat(parts[13]),
      tiltY: parseFloat(parts[14]),
      rotationRate: parseFloat(parts[15]),
      descentRate: parseFloat(parts[16]),
      payloadSeparated: parts[17] === '1',
      payloadParachute: parts[18] === '1',
      cmdEcho: parts[19],

      // Derived payload matching container format typically
      payloadAltitude: parseFloat(parts[5]),
      payloadPressure: parseFloat(parts[6]),
      payloadTemperature: parseFloat(parts[7]),
      payloadVoltage: parseFloat(parts[8]),
      payloadGpsLat: parseFloat(parts[9]),
      payloadGpsLon: parseFloat(parts[10]),
      payloadTiltX: parseFloat(parts[13]),
      payloadTiltY: parseFloat(parts[14]),
      payloadRotationRate: parseFloat(parts[15]),

      faults: { ...state.faults },
      timestamp: Date.now()
    };

    state.packetCount = pkt.packetCount;
    state.missionTime = parseFloat(pkt.missionTime);
    state.phase = pkt.phase;

    state.listeners.forEach(cb => cb(pkt));
  }

  // --- WebSocket API ---
  let wsConnection = null;

  function connectWebSocket(url = 'ws://localhost:8765') {
    return new Promise((resolve, reject) => {
      wsConnection = new WebSocket(url);
      wsConnection.onopen = () => {
        console.log("WebSocket connected");
        resolve(true);
      };
      wsConnection.onmessage = (event) => {
        const lines = event.data.split('\n');
        for (let line of lines) {
          line = line.trim();
          if (line) processSerialLine(line);
        }
      };
      wsConnection.onerror = (error) => {
        console.error("WebSocket error:", error);
        resolve(false);
      };
      wsConnection.onclose = () => {
        console.log("WebSocket closed");
        wsConnection = null;
      };
    });
  }

  function disconnectWebSocket() {
    if (wsConnection) {
      wsConnection.close();
      wsConnection = null;
    }
  }

  // --- Public API ---
  return {
    PHASES,

    getState() { return state; },
    getPhase() { return state.phase; },

    onPacket(callback) {
      state.listeners.push(callback);
    },

    removeListener(callback) {
      state.listeners = state.listeners.filter(l => l !== callback);
    },

    start(rate = 1000) {
      if (state.running) return;
      state.running = true;
      state.updateRate = rate;
      state.intervalId = setInterval(() => {
        simulateTick();
        const pkt = buildPacket();
        state.listeners.forEach(cb => cb(pkt));
      }, rate);
    },

    stop() {
      if (!state.running) return;
      state.running = false;
      clearInterval(state.intervalId);
      state.intervalId = null;
    },

    isRunning() { return state.running; },

    connectSerial,
    disconnectSerial,
    connectWebSocket,
    disconnectWebSocket,

    reset() {
      this.stop();
      state.missionTime = 0;
      state.packetCount = 0;
      state.phase = PHASES.PRE_LAUNCH;
      state.container.altitude = 0;
      state.container.pressure = 1013.25;
      state.container.temperature = 25;
      state.container.voltage = 8.4;
      state.container.gpsLat = 28.6139;
      state.container.gpsLon = 77.2090;
      state.container.gpsAlt = 0;
      state.container.gpsSats = 12;
      state.container.tiltX = 0;
      state.container.tiltY = 0;
      state.container.rotationRate = 0;
      state.container.state = 'LAUNCH_PAD';
      state.container.cmdEcho = 'NONE';
      state.payload.separated = false;
      state.payload.parachuteDeployed = false;
      state.payload.altitude = 0;
      state.payload.voltage = 4.2;
      state.descentRate = 0;
      state.prevAltitude = 0;
      state.faults = {
        gpsDropout: false,
        descentRateFault: false,
        separationFault: false,
        emergencyParachute: false
      };
    },

    resetPacketCount() {
      state.packetCount = 0;
    },

    // Fault injection
    injectFault(faultName, value = true) {
      if (faultName in state.faults) {
        state.faults[faultName] = value;
      }
    },

    triggerSeparation() {
      state.payload.separated = true;
      state.container.cmdEcho = 'SEP_CMD';
      if (state.phase === PHASES.ASCENT || state.phase === PHASES.APOGEE) {
        state.phase = PHASES.SEPARATION;
        state.container.state = 'SEPARATION';
      }
    },

    triggerEmergencyParachute() {
      state.payload.parachuteDeployed = true;
      state.faults.emergencyParachute = true;
      state.container.cmdEcho = 'EPARACHUTE';
    },

    triggerRedundantActivation() {
      state.container.cmdEcho = 'REDUNDANT_ACT';
    },

    packetToCSV,
    csvHeader,
    buildPacket
  };
})();
