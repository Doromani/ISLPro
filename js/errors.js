/* ============================================================
   Error Code System — errors.js
   4-digit fault monitoring: Descent Rate, GPS, Separation, Parachute
   ============================================================ */

const ErrorSystem = (() => {
  let digits = [0, 0, 0, 0]; // [descent, gps, separation, parachute]
  let prevDigits = [0, 0, 0, 0];
  let errorLog = [];
  let listeners = [];

  const LABELS = [
    'DESCENT RATE',
    'GPS AVAIL',
    'SEPARATION',
    'E-PARACHUTE'
  ];

  const DESCRIPTIONS = {
    '1000': 'Descent rate fault detected',
    '0100': 'GPS data unavailable',
    '0010': 'Payload separation failure',
    '0001': 'Emergency parachute activated'
  };

  // Audio context for alert beep
  let audioCtx = null;

  function beep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 880;
      osc.type = 'square';
      gain.gain.value = 0.08;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.stop(audioCtx.currentTime + 0.2);
    } catch (e) { /* ignore audio errors */ }
  }

  function evaluate(packet) {
    prevDigits = [...digits];

    // Digit 1: Descent rate (safe = 8-10 m/s during descent)
    if (packet.phase === 'DESCENT' || packet.phase === 'SEPARATION') {
      digits[0] = (packet.descentRate < 8 || packet.descentRate > 10) ? 1 : 0;
    } else {
      digits[0] = 0;
    }

    // Digit 2: GPS availability
    digits[1] = (packet.gpsSats === 0) ? 1 : 0;

    // Digit 3: Payload separation (fault = not separated when expected)
    if (packet.phase === 'DESCENT' || packet.phase === 'LANDED') {
      digits[2] = packet.payloadSeparated ? 0 : 1;
    } else {
      digits[2] = 0;
    }

    // Digit 4: Emergency parachute
    digits[3] = packet.payloadParachute && packet.faults.emergencyParachute ? 1 : 0;

    // Check for changes and log
    for (let i = 0; i < 4; i++) {
      if (digits[i] !== prevDigits[i]) {
        const entry = {
          time: packet.missionTime,
          timestamp: Date.now(),
          digit: i,
          label: LABELS[i],
          value: digits[i],
          message: digits[i] === 1
            ? `⚠ FAULT: ${LABELS[i]}`
            : `✓ CLEARED: ${LABELS[i]}`,
          type: digits[i] === 1 ? 'fault' : 'cleared'
        };
        errorLog.push(entry);
        if (digits[i] === 1) beep();
      }
    }

    // Notify listeners
    listeners.forEach(cb => cb(getCode(), digits, errorLog));
  }

  function getCode() {
    return digits.join('');
  }

  function getDigits() {
    return [...digits];
  }

  function getLog() {
    return [...errorLog];
  }

  function clearLog() {
    errorLog = [];
  }

  function onChange(callback) {
    listeners.push(callback);
  }

  function removeListener(callback) {
    listeners = listeners.filter(l => l !== callback);
  }

  function reset() {
    digits = [0, 0, 0, 0];
    prevDigits = [0, 0, 0, 0];
    errorLog = [];
    listeners.forEach(cb => cb('0000', digits, errorLog));
  }

  return {
    evaluate,
    getCode,
    getDigits,
    getLog,
    clearLog,
    onChange,
    removeListener,
    reset,
    LABELS
  };
})();
