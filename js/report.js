/* ============================================================
   Mission Report Generator — report.js
   Generates comprehensive post-mission report automatically
   ============================================================ */

const ReportGenerator = (() => {
  let reportGenerated = false;

  // --- Compute statistics from telemetry log ---
  function computeStats(packets) {
    if (packets.length === 0) return null;

    const fields = ['altitude', 'pressure', 'temperature', 'descentRate', 'voltage'];
    const stats = {};

    fields.forEach(field => {
      const values = packets.map(p => p[field]).filter(v => v !== undefined && v !== null && !isNaN(v));
      if (values.length === 0) { stats[field] = { min: 0, max: 0, avg: 0 }; return; }
      stats[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length
      };
    });

    // Phase durations
    const phases = {};
    let prevPhase = null;
    let phaseStart = 0;
    packets.forEach(p => {
      const t = parseFloat(p.missionTime);
      if (p.phase !== prevPhase) {
        if (prevPhase) {
          if (!phases[prevPhase]) phases[prevPhase] = 0;
          phases[prevPhase] += t - phaseStart;
        }
        prevPhase = p.phase;
        phaseStart = t;
      }
    });
    if (prevPhase) {
      if (!phases[prevPhase]) phases[prevPhase] = 0;
      phases[prevPhase] += parseFloat(packets[packets.length - 1].missionTime) - phaseStart;
    }

    // Error summary
    const errorPackets = packets.filter(p => {
      const e = p.faults;
      return e && (e.gpsDropout || e.descentRateFault || e.separationFault || e.emergencyParachute);
    });

    // GPS bounds
    const lats = packets.map(p => p.gpsLat).filter(v => v && v !== 0);
    const lons = packets.map(p => p.gpsLon).filter(v => v && v !== 0);

    return {
      fields: stats,
      totalPackets: packets.length,
      missionDuration: parseFloat(packets[packets.length - 1].missionTime),
      phases,
      errorCount: errorPackets.length,
      errorLog: ErrorSystem.getLog(),
      gps: {
        latMin: lats.length ? Math.min(...lats) : 0,
        latMax: lats.length ? Math.max(...lats) : 0,
        lonMin: lons.length ? Math.min(...lons) : 0,
        lonMax: lons.length ? Math.max(...lons) : 0
      },
      separationTime: packets.find(p => p.payloadSeparated)?.missionTime || 'N/A',
      parachuteTime: packets.find(p => p.payloadParachute)?.missionTime || 'N/A',
      startTime: new Date(packets[0].timestamp),
      endTime: new Date(packets[packets.length - 1].timestamp)
    };
  }

  // --- Build HTML report ---
  function buildReport(stats) {
    const now = new Date();
    const fmtDate = d => d.toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    // Capture graph canvases
    const graphImages = [];
    const canvases = document.querySelectorAll('.graph-container canvas');
    canvases.forEach(canvas => {
      const panel = canvas.closest('.graph-panel');
      const title = panel ? panel.querySelector('.panel-title')?.textContent.trim() : 'Graph';
      try {
        const dataUrl = canvas.toDataURL('image/png');
        graphImages.push({ title, dataUrl });
      } catch (e) { /* skip */ }
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>CanSat Mission Report — ${fmtDate(now)}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500;700&family=Orbitron:wght@500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #0a0e1a;
    --bg2: #111833;
    --cyan: #00e5ff;
    --green: #00ff88;
    --red: #ff3d3d;
    --amber: #ffb300;
    --text: #e0e3f0;
    --muted: rgba(224,227,240,0.45);
    --border: rgba(0,229,255,0.12);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', sans-serif;
    background: var(--bg);
    color: var(--text);
    padding: 40px 20px;
    line-height: 1.6;
  }
  .report {
    max-width: 900px;
    margin: 0 auto;
  }
  .report-header {
    text-align: center;
    padding: 40px 20px 30px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 32px;
  }
  .report-header h1 {
    font-family: 'Orbitron', sans-serif;
    font-size: 1.6rem;
    letter-spacing: 4px;
    background: linear-gradient(135deg, var(--cyan), var(--green));
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }
  .report-header .subtitle {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.75rem;
    color: var(--muted);
    letter-spacing: 2px;
  }
  .report-header .timestamp {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.7rem;
    color: var(--cyan);
    margin-top: 6px;
  }

  .section {
    background: var(--bg2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }
  .section::before {
    content: '';
    position: absolute;
    top: 0; left: 10%; right: 10%; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent);
  }
  .section h2 {
    font-family: 'Orbitron', sans-serif;
    font-size: 0.8rem;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--cyan);
    margin-bottom: 16px;
    display: flex; align-items: center; gap: 8px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.78rem;
  }
  th {
    text-align: left;
    padding: 8px 12px;
    color: var(--muted);
    font-weight: 500;
    font-size: 0.65rem;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    border-bottom: 1px solid var(--border);
  }
  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    color: var(--text);
  }
  tr:hover td { background: rgba(0,229,255,0.03); }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }
  .stat-card {
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }
  .stat-card .stat-label {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.55rem;
    color: var(--muted);
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .stat-card .stat-value {
    font-family: 'Roboto Mono', monospace;
    font-size: 1.3rem;
    font-weight: 700;
  }
  .stat-card .stat-unit {
    font-size: 0.65rem;
    color: var(--muted);
    font-weight: 400;
  }
  .cyan { color: var(--cyan); }
  .green { color: var(--green); }
  .amber { color: var(--amber); }
  .red { color: var(--red); }

  .phase-bar {
    display: flex;
    gap: 2px;
    height: 28px;
    border-radius: 6px;
    overflow: hidden;
    margin-top: 12px;
  }
  .phase-segment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.55rem;
    letter-spacing: 0.5px;
    color: #fff;
    padding: 0 6px;
    white-space: nowrap;
    overflow: hidden;
  }

  .error-entry {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 10px;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.7rem;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .error-entry .e-time { color: var(--muted); min-width: 60px; }
  .error-entry.fault .e-msg { color: var(--red); }
  .error-entry.cleared .e-msg { color: var(--green); }

  .graph-img {
    width: 100%;
    border-radius: 6px;
    margin: 10px 0;
    border: 1px solid var(--border);
  }
  .graph-title {
    font-family: 'Roboto Mono', monospace;
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .footer {
    text-align: center;
    padding: 30px;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 1px;
  }

  .badge {
    display: inline-block;
    font-family: 'Roboto Mono', monospace;
    font-size: 0.6rem;
    padding: 2px 10px;
    border-radius: 12px;
    letter-spacing: 1px;
  }
  .badge-success { background: rgba(0,255,136,0.12); color: var(--green); border: 1px solid rgba(0,255,136,0.3); }
  .badge-warning { background: rgba(255,179,0,0.12); color: var(--amber); border: 1px solid rgba(255,179,0,0.3); }
  .badge-danger { background: rgba(255,61,61,0.12); color: var(--red); border: 1px solid rgba(255,61,61,0.3); }

  @media print {
    body { background: #fff; color: #222; }
    .section { border-color: #ddd; background: #f8f9fa; }
    .section::before { display: none; }
    h1, h2 { -webkit-text-fill-color: #0066cc; }
    td, th { color: #333; border-color: #ddd; }
    .stat-card { background: #f0f0f0; border-color: #ddd; }
    .stat-value { color: #0066cc !important; }
  }
</style>
</head>
<body>
<div class="report">

  <div class="report-header">
    <h1>🛰️ CANSAT MISSION REPORT</h1>
    <div class="subtitle">POST-MISSION ANALYSIS & TELEMETRY SUMMARY</div>
    <div class="timestamp">Generated: ${fmtDate(now)} | Team ID: 3042</div>
  </div>

  <!-- Mission Summary -->
  <div class="section">
    <h2>📋 Mission Summary</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value cyan">${stats.missionDuration.toFixed(1)}<span class="stat-unit"> s</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Packets</div>
        <div class="stat-value green">${stats.totalPackets}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Max Altitude</div>
        <div class="stat-value cyan">${stats.fields.altitude.max.toFixed(1)}<span class="stat-unit"> m</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Separation</div>
        <div class="stat-value amber">T+${stats.separationTime}<span class="stat-unit"> s</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Parachute Deploy</div>
        <div class="stat-value amber">T+${stats.parachuteTime}<span class="stat-unit"> s</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Error Events</div>
        <div class="stat-value ${stats.errorLog.filter(e => e.type === 'fault').length > 0 ? 'red' : 'green'}">${stats.errorLog.filter(e => e.type === 'fault').length}</div>
      </div>
    </div>

    <!-- Phase Timeline Bar -->
    <div style="margin-top:16px;">
      <div class="graph-title">MISSION PHASE TIMELINE</div>
      <div class="phase-bar">
        ${Object.entries(stats.phases).map(([phase, duration]) => {
          const pct = (duration / stats.missionDuration * 100).toFixed(1);
          const colors = {
            'PRE-LAUNCH': '#ffb300', 'ASCENT': '#00e5ff', 'APOGEE': '#b388ff',
            'SEPARATION': '#ff6d00', 'DESCENT': '#7c4dff', 'LANDED': '#00ff88'
          };
          return `<div class="phase-segment" style="flex:${pct};background:${colors[phase] || '#555'};" title="${phase}: ${duration.toFixed(1)}s (${pct}%)">${pct > 8 ? phase : ''}</div>`;
        }).join('')}
      </div>
    </div>
  </div>

  <!-- Telemetry Statistics -->
  <div class="section">
    <h2>📊 Telemetry Statistics</h2>
    <table>
      <thead>
        <tr><th>Parameter</th><th>Minimum</th><th>Maximum</th><th>Average</th><th>Status</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Altitude</td>
          <td>${stats.fields.altitude.min.toFixed(2)} m</td>
          <td>${stats.fields.altitude.max.toFixed(2)} m</td>
          <td>${stats.fields.altitude.avg.toFixed(2)} m</td>
          <td><span class="badge badge-success">NOMINAL</span></td>
        </tr>
        <tr>
          <td>Pressure</td>
          <td>${stats.fields.pressure.min.toFixed(2)} hPa</td>
          <td>${stats.fields.pressure.max.toFixed(2)} hPa</td>
          <td>${stats.fields.pressure.avg.toFixed(2)} hPa</td>
          <td><span class="badge badge-success">NOMINAL</span></td>
        </tr>
        <tr>
          <td>Temperature</td>
          <td>${stats.fields.temperature.min.toFixed(2)} °C</td>
          <td>${stats.fields.temperature.max.toFixed(2)} °C</td>
          <td>${stats.fields.temperature.avg.toFixed(2)} °C</td>
          <td><span class="badge badge-success">NOMINAL</span></td>
        </tr>
        <tr>
          <td>Descent Rate</td>
          <td>${stats.fields.descentRate.min.toFixed(2)} m/s</td>
          <td>${stats.fields.descentRate.max.toFixed(2)} m/s</td>
          <td>${stats.fields.descentRate.avg.toFixed(2)} m/s</td>
          <td><span class="badge ${Math.abs(stats.fields.descentRate.max) > 10 ? 'badge-warning' : 'badge-success'}">${Math.abs(stats.fields.descentRate.max) > 10 ? 'WARNING' : 'NOMINAL'}</span></td>
        </tr>
        <tr>
          <td>Battery Voltage</td>
          <td>${stats.fields.voltage.min.toFixed(2)} V</td>
          <td>${stats.fields.voltage.max.toFixed(2)} V</td>
          <td>${stats.fields.voltage.avg.toFixed(2)} V</td>
          <td><span class="badge ${stats.fields.voltage.min < 6.5 ? 'badge-warning' : 'badge-success'}">${stats.fields.voltage.min < 6.5 ? 'LOW' : 'NOMINAL'}</span></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- GPS Summary -->
  <div class="section">
    <h2>🗺️ GPS Coverage</h2>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Lat Range</div>
        <div class="stat-value cyan" style="font-size:0.9rem;">${stats.gps.latMin.toFixed(6)} — ${stats.gps.latMax.toFixed(6)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lon Range</div>
        <div class="stat-value cyan" style="font-size:0.9rem;">${stats.gps.lonMin.toFixed(6)} — ${stats.gps.lonMax.toFixed(6)}</div>
      </div>
    </div>
  </div>

  <!-- Phase Durations -->
  <div class="section">
    <h2>⏱️ Phase Durations</h2>
    <table>
      <thead><tr><th>Phase</th><th>Duration (s)</th><th>% of Mission</th></tr></thead>
      <tbody>
        ${Object.entries(stats.phases).map(([phase, dur]) =>
          `<tr><td>${phase}</td><td>${dur.toFixed(1)}</td><td>${(dur / stats.missionDuration * 100).toFixed(1)}%</td></tr>`
        ).join('')}
      </tbody>
    </table>
  </div>

  <!-- Error Log -->
  <div class="section">
    <h2>⚠️ Error & Fault Log</h2>
    ${stats.errorLog.length === 0
      ? '<p style="color:var(--green);font-family:Roboto Mono,monospace;font-size:0.8rem;">✓ No faults detected during mission.</p>'
      : stats.errorLog.map(e =>
          `<div class="error-entry ${e.type}">
            <span class="e-time">T+${parseFloat(e.time).toFixed(1)}s</span>
            <span class="e-msg">${e.message}</span>
          </div>`
        ).join('')
    }
    <div style="margin-top:12px;">
      <span class="badge ${stats.errorLog.filter(e=>e.type==='fault').length === 0 ? 'badge-success' : 'badge-danger'}">
        FINAL ERROR CODE: ${ErrorSystem.getCode()}
      </span>
    </div>
  </div>

  <!-- Graphs -->
  ${graphImages.length > 0 ? `
  <div class="section">
    <h2>📈 Telemetry Graphs</h2>
    ${graphImages.map(g => `
      <div class="graph-title">${g.title}</div>
      <img class="graph-img" src="${g.dataUrl}" alt="${g.title}">
    `).join('')}
  </div>
  ` : ''}

  <div class="footer">
    CANSAT GROUND CONTROL SOFTWARE v1.0 — MISSION REPORT<br>
    Mission Start: ${fmtDate(stats.startTime)} | Mission End: ${fmtDate(stats.endTime)}<br>
    Report auto-generated on landing detection
  </div>

</div>
</body>
</html>`;
  }

  // --- Generate and open report ---
  function generate() {
    const packets = DataManager.getLog();
    if (packets.length === 0) {
      console.warn('[Report] No telemetry data to generate report.');
      return;
    }

    const stats = computeStats(packets);
    if (!stats) return;

    const html = buildReport(stats);

    // Download as HTML file
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const filename = `CanSat_Mission_Report_${DataManager.getTimestamp()}.html`;
    DataManager.downloadBlob(blob, filename);

    // Also open in new tab
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');

    reportGenerated = true;
    showReportNotification();

    console.log('%c[Report] Mission report generated: ' + filename, 'color: #00ff88; font-weight: bold;');
  }

  // --- Show notification banner ---
  function showReportNotification() {
    const banner = document.createElement('div');
    banner.id = 'report-notification';
    banner.innerHTML = `
      <span>📄 MISSION REPORT GENERATED — File downloaded and opened in new tab</span>
      <button onclick="this.parentElement.remove()" style="background:none;border:1px solid rgba(0,255,136,0.3);color:#00ff88;padding:4px 12px;border-radius:4px;cursor:pointer;font-family:'Roboto Mono',monospace;font-size:0.65rem;letter-spacing:1px;">DISMISS</button>
    `;
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 2000;
      display: flex; align-items: center; justify-content: center; gap: 16px;
      padding: 12px 20px;
      background: linear-gradient(135deg, rgba(0,255,136,0.15), rgba(0,229,255,0.1));
      border-bottom: 1px solid rgba(0,255,136,0.3);
      backdrop-filter: blur(12px);
      font-family: 'Roboto Mono', monospace; font-size: 0.75rem; color: #00ff88;
      letter-spacing: 1px;
      animation: slideDown 0.4s ease;
    `;

    // Add slide-down animation
    if (!document.getElementById('report-anim-style')) {
      const style = document.createElement('style');
      style.id = 'report-anim-style';
      style.textContent = `@keyframes slideDown { from { transform: translateY(-100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`;
      document.head.appendChild(style);
    }

    document.body.appendChild(banner);

    // Auto-dismiss after 10 seconds
    setTimeout(() => { if (banner.parentElement) banner.remove(); }, 10000);
  }

  // --- Check if report already generated ---
  function isGenerated() { return reportGenerated; }

  // --- Reset for new mission ---
  function reset() { reportGenerated = false; }

  return { generate, isGenerated, reset, computeStats };
})();
