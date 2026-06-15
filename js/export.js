/* ============================================================
   Data Management & Export — export.js
   CSV export, graph export, packet logging
   ============================================================ */

const DataManager = (() => {
  let packetLog = [];
  const MAX_LOG = 50000; // max packets to keep in memory

  function logPacket(packet) {
    packetLog.push(packet);
    if (packetLog.length > MAX_LOG) {
      packetLog.shift();
    }
  }

  function getLog() {
    return packetLog;
  }

  function clearLog() {
    packetLog = [];
  }

  function getPacketCount() {
    return packetLog.length;
  }

  // --- CSV Export ---
  function exportCSV() {
    if (packetLog.length === 0) {
      alert('No telemetry data to export.');
      return;
    }

    const header = Telemetry.csvHeader();
    const rows = packetLog.map(pkt => Telemetry.packetToCSV(pkt));
    const csv = header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `cansat_telemetry_${getTimestamp()}.csv`);
  }

  // --- Graph Export ---
  function exportGraphs() {
    const canvases = document.querySelectorAll('.graph-container canvas');
    if (canvases.length === 0) {
      alert('No graphs to export.');
      return;
    }

    canvases.forEach((canvas, i) => {
      const panel = canvas.closest('.graph-panel');
      const title = panel ? panel.querySelector('.panel-title') : null;
      const name = title ? title.textContent.trim().replace(/\s+/g, '_').toLowerCase() : `graph_${i}`;

      // Create a temp canvas with dark background
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const ctx = tempCanvas.getContext('2d');
      ctx.fillStyle = '#0b1022';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(canvas, 0, 0);

      tempCanvas.toBlob(blob => {
        downloadBlob(blob, `cansat_${name}_${getTimestamp()}.png`);
      }, 'image/png');
    });
  }

  // --- Export single graph ---
  function exportSingleGraph(canvas, name) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext('2d');
    ctx.fillStyle = '#0b1022';
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);

    tempCanvas.toBlob(blob => {
      downloadBlob(blob, `cansat_${name}_${getTimestamp()}.png`);
    }, 'image/png');
  }

  // --- Helpers ---
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function getTimestamp() {
    const d = new Date();
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function pad(n) {
    return n.toString().padStart(2, '0');
  }

  return {
    logPacket,
    getLog,
    clearLog,
    getPacketCount,
    exportCSV,
    exportGraphs,
    exportSingleGraph,
    downloadBlob,
    getTimestamp
  };
})();
