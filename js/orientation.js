/* ============================================================
   3D Orientation Visualization — orientation.js
   Three.js CanSat model with Roll, Pitch, Yaw rotation
   ============================================================ */

const Orientation = (() => {
  let scene, camera, renderer, cansat, gridHelper;
  let targetRotation = { x: 0, y: 0, z: 0 };
  let currentRotation = { x: 0, y: 0, z: 0 };
  let animFrameId = null;
  let initialized = false;

  function init(containerId = 'orientation-3d') {
    const container = document.getElementById(containerId);
    if (!container || initialized) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050810);
    scene.fog = new THREE.Fog(0x050810, 8, 20);

    // Camera
    camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(3, 2.5, 3);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x00e5ff, 0.8);
    dirLight.position.set(5, 5, 5);
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x00ff88, 0.4, 10);
    pointLight.position.set(-3, 3, -3);
    scene.add(pointLight);

    // Build CanSat model
    cansat = buildCanSatModel();
    scene.add(cansat);

    // Grid ground plane
    gridHelper = new THREE.GridHelper(8, 16, 0x00e5ff, 0x0a1428);
    gridHelper.position.y = -2;
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Axis reference lines
    const axisLength = 2;
    // X axis (red - Roll)
    const xGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(axisLength, 0, 0)
    ]);
    const xLine = new THREE.Line(xGeom, new THREE.LineBasicMaterial({ color: 0xff3d3d, opacity: 0.5, transparent: true }));

    // Y axis (green - Pitch)
    const yGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, axisLength, 0)
    ]);
    const yLine = new THREE.Line(yGeom, new THREE.LineBasicMaterial({ color: 0x00ff88, opacity: 0.5, transparent: true }));

    // Z axis (blue - Yaw)
    const zGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, axisLength)
    ]);
    const zLine = new THREE.Line(zGeom, new THREE.LineBasicMaterial({ color: 0x00e5ff, opacity: 0.5, transparent: true }));

    scene.add(xLine, yLine, zLine);

    initialized = true;
    animate();

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);
  }

  function buildCanSatModel() {
    const group = new THREE.Group();

    // Main body (cylinder)
    const bodyGeom = new THREE.CylinderGeometry(0.5, 0.5, 1.4, 24);
    const bodyMat = new THREE.MeshPhongMaterial({
      color: 0x1a2744,
      specular: 0x00e5ff,
      shininess: 60,
      emissive: 0x0a1428,
      emissiveIntensity: 0.3
    });
    const body = new THREE.Mesh(bodyGeom, bodyMat);
    group.add(body);

    // Wire frame overlay
    const wireGeom = new THREE.CylinderGeometry(0.52, 0.52, 1.42, 24);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.15
    });
    const wireFrame = new THREE.Mesh(wireGeom, wireMat);
    group.add(wireFrame);

    // Nose cone
    const noseGeom = new THREE.ConeGeometry(0.5, 0.6, 24);
    const noseMat = new THREE.MeshPhongMaterial({
      color: 0x00e5ff,
      specular: 0xffffff,
      shininess: 80,
      emissive: 0x003344,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.8
    });
    const nose = new THREE.Mesh(noseGeom, noseMat);
    nose.position.y = 1.0;
    group.add(nose);

    // Bottom plate
    const bottomGeom = new THREE.CylinderGeometry(0.52, 0.48, 0.08, 24);
    const bottomMat = new THREE.MeshPhongMaterial({
      color: 0x333a50,
      specular: 0x00e5ff,
      shininess: 40
    });
    const bottom = new THREE.Mesh(bottomGeom, bottomMat);
    bottom.position.y = -0.74;
    group.add(bottom);

    // Antenna
    const antennaGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
    const antennaMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
    const antenna = new THREE.Mesh(antennaGeom, antennaMat);
    antenna.position.set(0.3, 0.9, 0);
    antenna.rotation.z = 0.3;
    group.add(antenna);

    // Glow ring
    const ringGeom = new THREE.TorusGeometry(0.52, 0.02, 8, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.4
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0;
    group.add(ring);

    return group;
  }

  function animate() {
    animFrameId = requestAnimationFrame(animate);

    // LERP rotation for smooth interpolation
    const lerpFactor = 0.08;
    currentRotation.x += (targetRotation.x - currentRotation.x) * lerpFactor;
    currentRotation.y += (targetRotation.y - currentRotation.y) * lerpFactor;
    currentRotation.z += (targetRotation.z - currentRotation.z) * lerpFactor;

    if (cansat) {
      cansat.rotation.x = currentRotation.x;
      cansat.rotation.y = currentRotation.y;
      cansat.rotation.z = currentRotation.z;
    }

    renderer.render(scene, camera);
  }

  function update(packet) {
    if (!initialized) return;

    // Convert degrees to radians
    const degToRad = Math.PI / 180;
    targetRotation.x = packet.tiltY * degToRad;   // Pitch
    targetRotation.z = packet.tiltX * degToRad;   // Roll
    targetRotation.y = (packet.rotationRate * 2) * degToRad; // Yaw from rotation rate

    // Update value displays
    const rollEl = document.getElementById('orient-roll');
    const pitchEl = document.getElementById('orient-pitch');
    const yawEl = document.getElementById('orient-yaw');

    if (rollEl) rollEl.textContent = `${packet.tiltX.toFixed(1)}°`;
    if (pitchEl) pitchEl.textContent = `${packet.tiltY.toFixed(1)}°`;
    if (yawEl) yawEl.textContent = `${packet.rotationRate.toFixed(1)}°/s`;
  }

  function reset() {
    targetRotation = { x: 0, y: 0, z: 0 };
    currentRotation = { x: 0, y: 0, z: 0 };
    if (cansat) {
      cansat.rotation.set(0, 0, 0);
    }
  }

  function destroy() {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (renderer) renderer.dispose();
    initialized = false;
  }

  return { init, update, reset, destroy };
})();
