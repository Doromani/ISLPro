/* ============================================================
   Real-Time Graphs — graphs.js
   Chart.js powered telemetry visualization
   ============================================================ */

const Graphs = (() => {
  const MAX_POINTS = 300;
  let charts = {};

  const GRAPH_CONFIG = {
    altitude: {
      label: 'Altitude',
      unit: 'm',
      color: '#00e5ff',
      bgColor: 'rgba(0, 229, 255, 0.08)',
      field: 'altitude',
      yMin: null,
      yMax: null
    },
    pressure: {
      label: 'Pressure',
      unit: 'hPa',
      color: '#ffb300',
      bgColor: 'rgba(255, 179, 0, 0.08)',
      field: 'pressure',
      yMin: null,
      yMax: null
    },
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#ff6d00',
      bgColor: 'rgba(255, 109, 0, 0.08)',
      field: 'temperature',
      yMin: null,
      yMax: null
    },
    descentRate: {
      label: 'Descent Rate',
      unit: 'm/s',
      color: '#00ff88',
      bgColor: 'rgba(0, 255, 136, 0.08)',
      field: 'descentRate',
      yMin: null,
      yMax: null
    },
    voltage: {
      label: 'Battery',
      unit: 'V',
      color: '#ffe100',
      bgColor: 'rgba(255, 225, 0, 0.08)',
      field: 'voltage',
      yMin: 6,
      yMax: 9
    }
  };

  function createChart(canvasId, config) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return null;

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: config.label,
          data: [],
          borderColor: config.color,
          backgroundColor: config.bgColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointHoverBackgroundColor: config.color,
          fill: true,
          tension: 0.3,
          clip: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 0
        },
        interaction: {
          mode: 'nearest',
          axis: 'x',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(11, 16, 34, 0.95)',
            titleColor: '#e8eaf6',
            bodyColor: config.color,
            borderColor: config.color,
            borderWidth: 1,
            titleFont: { family: 'Roboto Mono', size: 10 },
            bodyFont: { family: 'Roboto Mono', size: 12, weight: 'bold' },
            padding: 8,
            displayColors: false,
            callbacks: {
              label: (ctx) => `${ctx.parsed.y.toFixed(2)} ${config.unit}`
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: {
              color: 'rgba(0, 229, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(232, 234, 246, 0.3)',
              font: { family: 'Roboto Mono', size: 9 },
              maxTicksLimit: 6,
              maxRotation: 0
            }
          },
          y: {
            display: true,
            min: config.yMin,
            max: config.yMax,
            grid: {
              color: 'rgba(0, 229, 255, 0.05)',
              drawBorder: false
            },
            ticks: {
              color: 'rgba(232, 234, 246, 0.3)',
              font: { family: 'Roboto Mono', size: 9 },
              maxTicksLimit: 5
            }
          }
        }
      }
    });

    return chart;
  }

  function init() {
    for (const [key, config] of Object.entries(GRAPH_CONFIG)) {
      charts[key] = createChart(`chart-${key}`, config);
    }
  }

  function update(packet) {
    const timeLabel = parseFloat(packet.missionTime).toFixed(0) + 's';

    for (const [key, config] of Object.entries(GRAPH_CONFIG)) {
      const chart = charts[key];
      if (!chart) continue;

      const value = packet[config.field];
      chart.data.labels.push(timeLabel);
      chart.data.datasets[0].data.push(value);

      // Rolling window
      if (chart.data.labels.length > MAX_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
      }

      chart.update('none'); // no animation for performance

      // Update current value display
      const valueEl = document.getElementById(`value-${key}`);
      if (valueEl) {
        valueEl.textContent = `${value.toFixed(2)}`;
      }
    }
  }

  function reset() {
    for (const chart of Object.values(charts)) {
      if (!chart) continue;
      chart.data.labels = [];
      chart.data.datasets[0].data = [];
      chart.update();
    }
  }

  function getCharts() {
    return charts;
  }

  function destroy() {
    for (const chart of Object.values(charts)) {
      if (chart) chart.destroy();
    }
    charts = {};
  }

  return { init, update, reset, getCharts, destroy, GRAPH_CONFIG };
})();
