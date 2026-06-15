/* ============================================================
   GPS Tracking Map — map.js
   Leaflet.js + OpenStreetMap real-time position tracking
   ============================================================ */

const TrackingMap = (() => {
  let map = null;
  let marker = null;
  let trail = null;
  let launchMarker = null;
  let positions = [];
  let initialized = false;

  const DEFAULT_CENTER = [28.6139, 77.2090]; // Delhi, India
  const DEFAULT_ZOOM = 15;

  // Custom marker icon (cyan dot)
  function createIcon(color = '#00e5ff', size = 14) {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 0 12px ${color}, 0 0 24px ${color}40;
      "></div>`,
      iconSize: [size, size],
      iconAnchor: [size/2, size/2]
    });
  }

  function createLaunchIcon() {
    return L.divIcon({
      className: 'launch-marker',
      html: `<div style="
        width: 10px;
        height: 10px;
        background: #00ff88;
        border-radius: 50%;
        border: 2px solid rgba(0,255,136,0.5);
        box-shadow: 0 0 8px rgba(0,255,136,0.4);
      "></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5]
    });
  }

  function init(containerId = 'tracking-map') {
    const container = document.getElementById(containerId);
    if (!container || initialized) return;

    map = L.map(containerId, {
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      attributionControl: true
    });

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    // Launch site marker
    launchMarker = L.marker(DEFAULT_CENTER, { icon: createLaunchIcon() })
      .addTo(map)
      .bindPopup('<span style="font-family:Roboto Mono;font-size:11px;color:#333;">🚀 Launch Site</span>');

    // Current position marker
    marker = L.marker(DEFAULT_CENTER, { icon: createIcon() })
      .addTo(map);

    // Trajectory trail
    trail = L.polyline([], {
      color: '#00e5ff',
      weight: 2,
      opacity: 0.7,
      dashArray: '5, 5',
      smoothFactor: 1
    }).addTo(map);

    initialized = true;

    // Fix render issue with hidden containers
    setTimeout(() => map.invalidateSize(), 200);
  }

  function update(packet) {
    if (!initialized || !map) return;

    const lat = packet.gpsLat;
    const lon = packet.gpsLon;

    if (lat === 0 && lon === 0) return; // Invalid GPS
    if (packet.gpsSats === 0) return;   // No GPS fix

    const pos = [lat, lon];
    positions.push(pos);

    // Update marker position
    marker.setLatLng(pos);

    // Update trail
    trail.setLatLngs(positions);

    // Auto-center map
    map.panTo(pos, { animate: true, duration: 0.3 });

    // Update overlay info
    updateOverlay(packet);
  }

  function updateOverlay(packet) {
    const latEl = document.getElementById('map-lat');
    const lonEl = document.getElementById('map-lon');
    const altEl = document.getElementById('map-alt');
    const satsEl = document.getElementById('map-sats');

    if (latEl) latEl.textContent = packet.gpsLat.toFixed(6);
    if (lonEl) lonEl.textContent = packet.gpsLon.toFixed(6);
    if (altEl) altEl.textContent = packet.gpsAlt.toFixed(1);
    if (satsEl) satsEl.textContent = packet.gpsSats;
  }

  function reset() {
    positions = [];
    if (trail) trail.setLatLngs([]);
    if (marker) marker.setLatLng(DEFAULT_CENTER);
    if (map) map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }

  function invalidateSize() {
    if (map) setTimeout(() => map.invalidateSize(), 100);
  }

  function destroy() {
    if (map) {
      map.remove();
      map = null;
    }
    initialized = false;
  }

  return { init, update, reset, invalidateSize, destroy };
})();
