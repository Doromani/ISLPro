# CanSat Ground Control Software (GCS) - Project Report

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
The user interface is designed for high-stress mission environments, prioritizing readability and situational awareness:
*   **Live Graphs:** Utilizes **Chart.js** to render real-time plots of Altitude, Pressure, Temperature, Descent Rate, and Battery Voltage.
*   **GPS Tracking:** Integrates **Leaflet.js** for real-time map plotting of the CanSat's coordinates.
*   **3D Orientation:** Employs **Three.js** to provide a live 3D visual representation of the CanSat's Roll, Pitch, and Yaw.
*   **Video Feed:** Interface for integrating live video streams from payload cameras.

### 5. Mission Control & Command Uplink
The dashboard includes an actionable command section allowing operators to send critical uplink commands to the CanSat:
*   Payload Separation Command
*   Emergency Parachute Deployment
*   Redundant Activation Commands

### 6. Testing & Fault Injection
Designed with robustness in mind, the simulator includes "Fault Injection" capabilities. Operators can deliberately trigger errors such as **GPS Dropouts** or **Descent Rate Anomalies** to train ground crews on emergency response and verify error-handling logic.

### 7. Data Logging & Export
*   **CSV Export:** All incoming telemetry is buffered and can be exported as a standard CSV file for post-mission data review and judging.
*   **Graph Export:** Visual charts can be exported directly as PNG images for inclusion in Post-Flight Review (PFR) documents.

## Technology Stack
*   **Frontend Structure & Styling:** HTML5, CSS3 (Custom Variables, Flexbox/Grid layouts for responsive design).
*   **Core Logic:** Vanilla JavaScript (ES6+).
*   **Visualization Libraries:** Chart.js (Data Plotting), Leaflet.js (Mapping), Three.js (3D Rendering).
*   **Simulator Backend (Optional):** Python 3 (`websockets` library).

## Conclusion
The CanSat GCS provides a robust, visually rich, and highly functional command center for CanSat teams. By leveraging modern browser APIs like Web Serial and WebSockets alongside powerful visualization libraries, it delivers professional-grade mission control capabilities while remaining accessible and easy to deploy.
