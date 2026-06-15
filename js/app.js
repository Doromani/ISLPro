/* ============================================================
   Main Application Controller — app.js
   Orchestrates all GCS modules and UI interactions
   ============================================================ */

const App = (() => {
  let missionStartTime = null;
  let clockInterval = null;
  let latestPacket = null;

  // --- Initialize all modules ---
  function init() {
    // Init modules
    Graphs.init();
    TrackingMap.init('tracking-map');
    Orientation.init('orientation-3d');
    VideoStream.init();

    // Register telemetry handler
    Telemetry.onPacket(handlePacket);

    // Setup event listeners
    bindControls();

    // Start clock
    startClock();

    // Update connection status
    updateConnectionStatus('disconnected');

    // Initialize error display
    updateErrorDisplay([0, 0, 0, 0]);

    // Error system listener
    ErrorSystem.onChange((code, digits, log) => {
      updateErrorDisplay(digits);
      updateErrorLog(log);
    });

    console.log('%c[CanSat GCS] Initialized', 'color: #00e5ff; font-weight: bold;');
  }

  // --- Handle incoming telemetry packet ---
  function handlePacket(packet) {
    latestPacket = packet;

    // Log packet
    DataManager.logPacket(packet);

    // Update all displays
    updateTelemetryDisplay(packet);
    Graphs.update(packet);
    TrackingMap.update(packet);
    Orientation.update(packet);
    ErrorSystem.evaluate(packet);

    // Update status bar
    updateStatusBar(packet);
  }

  // --- Update telemetry display panels ---
  function updateTelemetryDisplay(pkt) {
    const fields = {
      // Container
      'telem-team-id': pkt.teamId,
      'telem-mission-time': pkt.missionTime + ' s',
      'telem-packet-count': pkt.packetCount,
      'telem-mode': pkt.mode,
      'telem-state': pkt.state,
      'telem-altitude': pkt.altitude.toFixed(2) + ' m',
      'telem-pressure': pkt.pressure.toFixed(2) + ' hPa',
      'telem-temperature': pkt.temperature.toFixed(2) + ' °C',
      'telem-voltage': pkt.voltage.toFixed(2) + ' V',
      'telem-gps-lat': pkt.gpsLat.toFixed(6),
      'telem-gps-lon': pkt.gpsLon.toFixed(6),
      'telem-gps-alt': pkt.gpsAlt.toFixed(2) + ' m',
      'telem-gps-sats': pkt.gpsSats,
      'telem-tilt-x': pkt.tiltX.toFixed(2) + '°',
      'telem-tilt-y': pkt.tiltY.toFixed(2) + '°',
      'telem-rotation': pkt.rotationRate.toFixed(2) + ' °/s',
      'telem-descent-rate': pkt.descentRate.toFixed(2) + ' m/s',
      'telem-cmd-echo': pkt.cmdEcho,

      // Payload
      'telem-pl-altitude': pkt.payloadAltitude.toFixed(2) + ' m',
      'telem-pl-pressure': pkt.payloadPressure.toFixed(2) + ' hPa',
      'telem-pl-temperature': pkt.payloadTemperature.toFixed(2) + ' °C',
      'telem-pl-voltage': pkt.payloadVoltage.toFixed(2) + ' V',
      'telem-pl-tilt-x': pkt.payloadTiltX.toFixed(2) + '°',
      'telem-pl-tilt-y': pkt.payloadTiltY.toFixed(2) + '°',
      'telem-pl-rotation': pkt.payloadRotationRate.toFixed(2) + ' °/s',
      'telem-pl-separated': pkt.payloadSeparated ? 'YES' : 'NO',
      'telem-pl-parachute': pkt.payloadParachute ? 'DEPLOYED' : 'INACTIVE',
    };

    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) {
        const oldVal = el.textContent;
        el.textContent = value;
        // Flash animation on value change
        if (oldVal !== String(value)) {
          const item = el.closest('.telem-item');
          if (item) {
            item.classList.remove('highlight');
            void item.offsetWidth; // force reflow
            item.classList.add('highlight');
          }
        }
      }
    }
  }

  // --- Update status bar ---
  function updateStatusBar(pkt) {
    const packetCountEl = document.getElementById('status-packets');
    const phaseEl = document.getElementById('mission-phase');
    const rateEl = document.getElementById('status-rate');

    if (packetCountEl) packetCountEl.textContent = pkt.packetCount;
    if (rateEl) rateEl.textContent = '1 Hz';

    if (phaseEl) {
      phaseEl.textContent = pkt.phase;
      phaseEl.className = 'mission-phase';
      if (pkt.phase === 'PRE-LAUNCH') phaseEl.classList.add('pre-launch');
      else if (pkt.phase === 'ASCENT' || pkt.phase === 'APOGEE') phaseEl.classList.add('ascent');
      else if (pkt.phase === 'DESCENT' || pkt.phase === 'SEPARATION') phaseEl.classList.add('descent');
      else if (pkt.phase === 'LANDED') phaseEl.classList.add('landed');
    }
  }

  // --- Error display update ---
  function updateErrorDisplay(digits) {
    for (let i = 0; i < 4; i++) {
      const el = document.getElementById(`error-digit-${i}`);
      if (el) {
        el.textContent = digits[i];
        el.className = `error-digit ${digits[i] === 0 ? 'ok' : 'fault'}`;
      }
    }
  }

  function updateErrorLog(log) {
    const logEl = document.getElementById('error-log');
    if (!logEl) return;

    // Show last 20 entries
    const recent = log.slice(-20).reverse();
    logEl.innerHTML = recent.map(entry => {
      const timeStr = parseFloat(entry.time).toFixed(1) + 's';
      return `<div class="error-log-entry ${entry.type}">
        <span class="log-time">T+${timeStr}</span>
        <span class="log-msg">${entry.message}</span>
      </div>`;
    }).join('');
  }

  // --- Clock ---
  function startClock() {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);
  }

  function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour12: false });
    const clockEl = document.getElementById('mission-clock');
    if (clockEl) clockEl.textContent = timeStr;

    // MET (Mission Elapsed Time)
    if (missionStartTime) {
      const elapsed = Math.floor((now - missionStartTime) / 1000);
      const h = Math.floor(elapsed / 3600).toString().padStart(2, '0');
      const m = Math.floor((elapsed % 3600) / 60).toString().padStart(2, '0');
      const s = (elapsed % 60).toString().padStart(2, '0');
      const metEl = document.getElementById('met-clock');
      if (metEl) metEl.textContent = `${h}:${m}:${s}`;
    }
  }

  // --- Connection status ---
  function updateConnectionStatus(status) {
    const el = document.getElementById('connection-status');
    if (!el) return;
    el.className = `connection-status ${status}`;
    const dot = el.querySelector('.status-dot');
    const text = el.querySelector('.status-text');
    if (dot) dot.className = `status-dot ${status !== 'disconnected' ? 'pulse' : ''}`;
    if (text) {
      text.textContent = status === 'connected' ? 'CONNECTED'
        : status === 'simulated' ? 'SIMULATED'
        : 'DISCONNECTED';
    }
  }

  // --- Command status helper ---
  function showCommandStatus(message, type = 'active', duration = 3000) {
    const el = document.getElementById('command-status');
    if (!el) return;
    el.textContent = message;
    el.className = `command-status ${type}`;
    if (duration > 0) {
      setTimeout(() => {
        el.textContent = 'AWAITING COMMAND';
        el.className = 'command-status';
      }, duration);
    }
  }

  // --- Bind all controls ---
  function bindControls() {
    // Start Telemetry
    const startBtn = document.getElementById('btn-start-telemetry');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        Telemetry.start(1000);
        missionStartTime = new Date();
        updateConnectionStatus('simulated');
        startBtn.disabled = true;
        const stopBtn = document.getElementById('btn-stop-telemetry');
        if (stopBtn) stopBtn.disabled = false;
        showCommandStatus('TELEMETRY STREAMING', 'active', 0);
      });
    }

    // Serial Connect
    const serialBtn = document.getElementById('btn-serial-connect');
    if (serialBtn) {
      serialBtn.addEventListener('click', async () => {
        const success = await Telemetry.connectSerial();
        if (success) {
          missionStartTime = new Date();
          updateConnectionStatus('connected');
          serialBtn.disabled = true;
          const wsBtn = document.getElementById('btn-ws-connect');
          if (wsBtn) wsBtn.disabled = true;
          if (startBtn) startBtn.disabled = true;
          const stopBtn = document.getElementById('btn-stop-telemetry');
          if (stopBtn) stopBtn.disabled = false;
          showCommandStatus('SERIAL CONNECTED', 'active', 0);
        }
      });
    }

    // WebSocket Connect
    const wsBtn = document.getElementById('btn-ws-connect');
    if (wsBtn) {
      wsBtn.addEventListener('click', async () => {
        const success = await Telemetry.connectWebSocket('ws://localhost:8765');
        if (success) {
          missionStartTime = new Date();
          updateConnectionStatus('connected');
          wsBtn.disabled = true;
          if (serialBtn) serialBtn.disabled = true;
          if (startBtn) startBtn.disabled = true;
          const stopBtn = document.getElementById('btn-stop-telemetry');
          if (stopBtn) stopBtn.disabled = false;
          showCommandStatus('WEBSOCKET CONNECTED', 'active', 0);
        } else {
          showCommandStatus('WS CONNECTION FAILED', 'danger', 3000);
        }
      });
    }

    // Stop Telemetry
    const stopBtn = document.getElementById('btn-stop-telemetry');
    if (stopBtn) {
      stopBtn.disabled = true;
      stopBtn.addEventListener('click', () => {
        Telemetry.stop();
        Telemetry.disconnectSerial();
        Telemetry.disconnectWebSocket();
        updateConnectionStatus('disconnected');
        stopBtn.disabled = true;
        if (startBtn) startBtn.disabled = false;
        if (serialBtn) serialBtn.disabled = false;
        if (wsBtn) wsBtn.disabled = false;
        showCommandStatus('TELEMETRY STOPPED', 'success', 3000);
      });
    }

    // Export CSV
    const csvBtn = document.getElementById('btn-export-csv');
    if (csvBtn) {
      csvBtn.addEventListener('click', () => {
        DataManager.exportCSV();
        showCommandStatus('CSV EXPORTED', 'success');
      });
    }

    // Export Graphs
    const graphBtn = document.getElementById('btn-export-graph');
    if (graphBtn) {
      graphBtn.addEventListener('click', () => {
        DataManager.exportGraphs();
        showCommandStatus('GRAPHS EXPORTED', 'success');
      });
    }

    // Sync PC Time
    const syncBtn = document.getElementById('btn-sync-time');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        missionStartTime = new Date();
        showCommandStatus('TIME SYNCHRONIZED', 'success');
      });
    }

    // Reset Packet
    const resetBtn = document.getElementById('btn-reset-packet');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Telemetry.resetPacketCount();
        DataManager.clearLog();
        showCommandStatus('PACKETS RESET', 'success');
      });
    }

    // Manual Separation
    const sepBtn = document.getElementById('btn-separation');
    if (sepBtn) {
      sepBtn.addEventListener('click', () => {
        showModal(
          '⚠ CONFIRM SEPARATION',
          'Are you sure you want to trigger manual payload separation? This action cannot be undone.',
          'danger',
          () => {
            Telemetry.triggerSeparation();
            showCommandStatus('SEPARATION CMD → SENT → ACKNOWLEDGED → EXECUTED', 'success', 4000);
            animateCommandSequence('btn-separation');
          }
        );
      });
    }

    // Emergency Parachute
    const paraBtn = document.getElementById('btn-parachute');
    if (paraBtn) {
      paraBtn.addEventListener('click', () => {
        showModal(
          '🚨 EMERGENCY PARACHUTE',
          'CRITICAL: Deploy emergency parachute? This will activate the emergency landing system immediately.',
          'danger',
          () => {
            Telemetry.triggerEmergencyParachute();
            showCommandStatus('E-PARACHUTE → DEPLOYED', 'success', 4000);
            animateCommandSequence('btn-parachute');
          }
        );
      });
    }

    // Redundant Activation
    const redundantBtn = document.getElementById('btn-redundant');
    if (redundantBtn) {
      redundantBtn.addEventListener('click', () => {
        Telemetry.triggerRedundantActivation();
        showCommandStatus('REDUNDANT ACTIVATION → SENT', 'active', 3000);
        animateCommandSequence('btn-redundant');
      });
    }

    // Video controls
    const videoStartBtn = document.getElementById('btn-video-start');
    const videoStopBtn = document.getElementById('btn-video-stop');
    const videoScreenshotBtn = document.getElementById('btn-video-screenshot');
    const cameraSelect = document.getElementById('camera-select');

    if (videoStartBtn) {
      videoStartBtn.addEventListener('click', async () => {
        const deviceId = cameraSelect ? cameraSelect.value : null;
        await VideoStream.start(deviceId);
      });
    }

    if (videoStopBtn) {
      videoStopBtn.addEventListener('click', () => {
        VideoStream.stop();
      });
    }

    if (videoScreenshotBtn) {
      videoScreenshotBtn.addEventListener('click', () => {
        VideoStream.takeScreenshot();
      });
    }

    if (cameraSelect) {
      VideoStream.enumerateCameras();
    }

    // Fault injection buttons (dev tools)
    const faultBtns = document.querySelectorAll('[data-fault]');
    faultBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const fault = btn.dataset.fault;
        const current = Telemetry.getState().faults[fault];
        Telemetry.injectFault(fault, !current);
        btn.classList.toggle('active', !current);
        showCommandStatus(`FAULT ${!current ? 'INJECTED' : 'CLEARED'}: ${fault}`, !current ? 'active' : 'success');
      });
    });
  }

  // --- Modal ---
  function showModal(title, message, type, onConfirm) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm');
    const cancelBtn = document.getElementById('modal-cancel');

    if (!overlay) return;

    if (modalTitle) modalTitle.textContent = title;
    if (modalMessage) modalMessage.textContent = message;
    if (confirmBtn) {
      confirmBtn.className = `btn btn-${type}`;
      confirmBtn.onclick = () => {
        hideModal();
        onConfirm();
      };
    }
    if (cancelBtn) {
      cancelBtn.onclick = hideModal;
    }

    overlay.classList.add('active');
  }

  function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  }

  // --- Command animation ---
  function animateCommandSequence(btnId) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.4)';
    setTimeout(() => {
      btn.style.boxShadow = '';
    }, 2000);
  }

  // --- Public API ---
  return {
    init,
    showCommandStatus,
    updateConnectionStatus
  };
})();

// --- Boot ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
