# ISLPro
ISL
# CanSat Ground Control Software (GCS) — Implementation Plan

A professional single-page Ground Control Software dashboard for a CanSat mission. The software monitors telemetry data in real time, visualizes mission parameters, displays GPS tracking, handles mission controls, and simulates aerospace mission operations.

## Source PDF
[cansat_and_cubesat_project.pdf](file:///C:/ISLProjects/cansat_and_cubesat_project.pdf)

---

## User Review Required

> [!IMPORTANT]
> **Technology choice**: The plan uses a single HTML file with vanilla JS and CDN libraries (Chart.js, Leaflet.js, Three.js). No build tools or frameworks. This keeps it simple and matches the assignment's suggested tools. Should I use a framework like Vite/React instead?

> [!IMPORTANT]
> **Simulated telemetry**: Since we don't have a physical microcontroller connected, telemetry data will be **simulated** via a JavaScript telemetry generator that mimics real CanSat packets. The Web Serial API integration will be stubbed but ready for real hardware.

> [!WARNING]
> **Web Serial API** requires HTTPS or localhost and a Chromium-based browser. It will not work in Firefox/Safari. The simulated telemetry mode will work everywhere.

---

## Proposed Changes

All files will be created in `c:\ISLProjects\cansat-gcs\`.

### Project Structure

```
cansat-gcs/
├── index.html          # Single-page dashboard (entry point)
├── css/
│   └── style.css       # Full aerospace-themed styling
├── js/
│   ├── app.js          # Main application controller
│   ├── telemetry.js    # Telemetry parser & simulator
│   ├── graphs.js       # Chart.js real-time graphs
│   ├── map.js          # Leaflet.js GPS tracking map
│   ├── orientation.js  # Three.js 3D orientation visualization
│   ├── video.js        # MediaDevices live video streaming
│   ├── errors.js       # 4-digit error code system
│   └── export.js       # CSV & graph export, data management
└── assets/
    └── (favicon, logo if needed)
```

---

### 1. Interface Layout — `index.html` + `css/style.css`

#### [NEW] [index.html](file:///C:/ISLProjects/cansat-gcs/index.html)
- Single-page dashboard with CSS Grid layout
- **Top bar**: Mission title, clock, connection status, control buttons
- **Left column**: Telemetry data panels (Container + Payload)
- **Center column**: Real-time graphs (Altitude, Pressure, Temperature, Descent Rate, Battery)
- **Right column**: GPS Map, Orientation 3D view, Video stream
- **Bottom bar**: Error code display, mission status, packet counter
- Dark aerospace theme with accent colors (cyan/green HUD style)

#### [NEW] [style.css](file:///C:/ISLProjects/cansat-gcs/css/style.css)
- **Color palette**: Deep navy/black background (#0a0e1a), cyan accents (#00e5ff), green status (#00ff88), red alerts (#ff3d3d), amber warnings (#ffb300)
- **Typography**: Google Font "Orbitron" for headers (space/tech feel), "Roboto Mono" for telemetry values
- CSS Grid for the main dashboard layout
- Glassmorphism panels with subtle borders and glow effects
- Smooth transitions and pulse animations for active indicators
- Responsive breakpoints for large screens (primary target: 1920×1080)

---

### 2. Top Control Bar — in `app.js`

#### [NEW] [app.js](file:///C:/ISLProjects/cansat-gcs/js/app.js)
- **Start Telemetry** / **Stop Telemetry** toggle buttons
- **Export CSV** button → triggers `export.js`
- **Export Graph** button → captures graph canvases as PNG
- **Sync PC Time** → syncs mission clock to system time
- **Reset Packet** → resets packet counter to 0
- Connection status indicator (Connected / Disconnected / Simulated)
- Real-time mission elapsed timer (MET)

---

### 3. Mission Control Panel — in `app.js`

- **Manual Separation** button with confirmation dialog
- **Emergency Parachute Deployment** button with warning modal and countdown
- **Redundant Activation** command
- Dynamic command execution status display (Sent → Acknowledged → Executed)
- Visual feedback: buttons glow/pulse when commands are in-flight
- Web Serial API stub for sending commands to real hardware

---

### 4. Telemetry Display — `telemetry.js`

#### [NEW] [telemetry.js](file:///C:/ISLProjects/cansat-gcs/js/telemetry.js)

**Telemetry Simulator** (generates realistic CanSat data):
- Simulates launch → ascent → apogee → descent → landing phases
- Fields: Team ID, Mission Time, Packet Count, Mode, State, Altitude, Pressure, Temperature, Voltage, GPS (Lat/Lon/Alt/Sats), Tilt X/Y, Rotation Rate, Payload state, CMD Echo
- Configurable update rate (1 Hz default)

**Telemetry Parser**:
- Parses CSV-formatted telemetry strings
- Separates Container and Payload telemetry
- Validates packet integrity

**Display**:
- Container telemetry panel with labeled fields
- Payload telemetry panel with labeled fields
- Values update with brief highlight animation on change
- Last packet timestamp display

---

### 5. Error Code System — `errors.js`

#### [NEW] [errors.js](file:///C:/ISLProjects/cansat-gcs/js/errors.js)

4-digit error code system:

| Digit | Condition              | 0 = Normal                  | 1 = Fault                        |
|-------|------------------------|-----------------------------|----------------------------------|
| 1     | Descent Rate           | Within 8–10 m/s             | Outside safe range               |
| 2     | GPS Availability       | GPS data available          | GPS data unavailable             |
| 3     | Payload Separation     | Separated successfully      | Separation failure               |
| 4     | Emergency Parachute    | Parachute inactive          | Emergency parachute activated    |

- Color-coded digit display: green (0) / red with pulse (1)
- Error history log with timestamps
- Audio alert on new fault condition (optional beep)

---

### 6. Real-Time Graphs — `graphs.js`

#### [NEW] [graphs.js](file:///C:/ISLProjects/cansat-gcs/js/graphs.js)

Using **Chart.js** (CDN):
- **Altitude vs Time** — line chart, cyan
- **Pressure vs Time** — line chart, amber
- **Temperature vs Time** — line chart, orange
- **Descent Rate vs Time** — line chart, green
- **Battery Voltage vs Time** — line chart, yellow

Features:
- Smooth real-time scrolling (rolling window of ~300 data points)
- Dark theme with grid lines matching dashboard aesthetic
- Tooltips on hover
- Auto-scaling Y-axis
- Each graph in its own panel with title and current value

---

### 7. Tracking Map — `map.js`

#### [NEW] [map.js](file:///C:/ISLProjects/cansat-gcs/js/map.js)

Using **Leaflet.js** (CDN) + **OpenStreetMap** tiles:
- Real-time marker showing current CanSat position
- Polyline trail showing mission trajectory/path history
- Custom marker icon styled to match dashboard theme
- Launch site marker
- Coordinate display overlay (Lat, Lon, Alt, Sats)
- Auto-center on latest position
- Zoom controls

---

### 8. Orientation Visualization — `orientation.js`

#### [NEW] [orientation.js](file:///C:/ISLProjects/cansat-gcs/js/orientation.js)

Using **Three.js** (CDN):
- 3D model of a simplified CanSat (cylinder + nose cone)
- Real-time rotation based on Roll, Pitch, Yaw telemetry
- Axes reference lines (X=red, Y=green, Z=blue)
- Numerical readout of Roll, Pitch, Yaw values
- Grid ground plane for spatial reference
- Smooth interpolated rotation (LERP)

---

### 9. Live Video Streaming — `video.js`

#### [NEW] [video.js](file:///C:/ISLProjects/cansat-gcs/js/video.js)

Using **MediaDevices API**:
- Camera selection dropdown (enumerates available devices)
- Start / Stop stream controls
- Stream status indicator (Live / Offline)
- Video element with dark border matching dashboard
- Fullscreen toggle
- Screenshot capture button

---

### 10. Data Management — `export.js`

#### [NEW] [export.js](file:///C:/ISLProjects/cansat-gcs/js/export.js)

- **CSV Export**: All telemetry packets logged in memory → export as `.csv` file
- **Graph Export**: Canvas-to-PNG for each graph → download as images
- **Packet Reset**: Clear packet counter and telemetry log
- **Telemetry Storage**: In-memory array of all received packets
- Uses Blob API + `URL.createObjectURL` for file downloads

---

### 11. Simulated Testing Strategy

Built into `telemetry.js`:
- Realistic mission phase simulation (pre-launch → ascent → apogee → separation → descent → landing)
- Configurable fault injection (GPS dropout, parachute activation, descent rate anomaly)
- Multiple scenario presets for testing all error code combinations
- Telemetry rate control (1–10 Hz)

---

## Architecture Diagram

```mermaid
graph TB
    subgraph "index.html - Single Page Dashboard"
        TopBar["Top Control Bar<br/>Start/Stop, Export, Sync, Reset"]
        MCP["Mission Control Panel<br/>Separation, Parachute, Redundant"]
        TelDisp["Telemetry Display<br/>Container + Payload"]
        Graphs["Real-Time Graphs<br/>Alt, Press, Temp, Rate, Batt"]
        Map["GPS Tracking Map<br/>Leaflet + OpenStreetMap"]
        Orient["3D Orientation<br/>Three.js Roll/Pitch/Yaw"]
        Video["Live Video<br/>MediaDevices API"]
        Errors["Error Code System<br/>4-digit fault monitor"]
    end

    subgraph "Data Layer"
        TelSim["Telemetry Simulator"]
        TelParse["Telemetry Parser"]
        DataStore["In-Memory Data Store"]
    end

    subgraph "External Libraries (CDN)"
        ChartJS["Chart.js"]
        LeafletJS["Leaflet.js"]
        ThreeJS["Three.js"]
    end

    TelSim --> TelParse
    TelParse --> DataStore
    DataStore --> TelDisp
    DataStore --> Graphs
    DataStore --> Map
    DataStore --> Orient
    DataStore --> Errors
    Graphs --> ChartJS
    Map --> LeafletJS
    Orient --> ThreeJS
```

---

## Verification Plan

### Manual Verification
1. Open `index.html` in Chrome/Edge
2. Click **Start Telemetry** — verify all panels update in real time
3. Verify all 5 graphs update smoothly with scrolling data
4. Verify GPS map shows moving marker with trail
5. Verify 3D orientation model rotates with telemetry
6. Verify error codes update correctly (inject faults via simulator)
7. Test mission controls (separation, parachute) — verify visual feedback
8. Test CSV export — verify downloaded file contains correct telemetry
9. Test graph export — verify PNG downloads
10. Test video stream — verify camera feed displays
11. Test on 1920×1080 resolution for optimal layout

### Automated Tests
- No automated test framework required (static HTML/JS project)
- Console logging for telemetry validation during development
