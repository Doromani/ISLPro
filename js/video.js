/* ============================================================
   Live Video Streaming — video.js
   MediaDevices API camera integration
   ============================================================ */

const VideoStream = (() => {
  let stream = null;
  let videoElement = null;
  let isStreaming = false;

  function init() {
    videoElement = document.getElementById('video-feed');
  }

  async function enumerateCameras() {
    try {
      // Need to get permission first to see device labels
      const tempStream = await navigator.mediaDevices.getUserMedia({ video: true });
      tempStream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(d => d.kind === 'videoinput');

      const select = document.getElementById('camera-select');
      if (!select) return cameras;

      select.innerHTML = '';
      cameras.forEach((cam, i) => {
        const opt = document.createElement('option');
        opt.value = cam.deviceId;
        opt.textContent = cam.label || `Camera ${i + 1}`;
        select.appendChild(opt);
      });

      return cameras;
    } catch (err) {
      console.warn('Camera enumeration failed:', err);
      const select = document.getElementById('camera-select');
      if (select) {
        select.innerHTML = '<option value="">No cameras found</option>';
      }
      return [];
    }
  }

  async function start(deviceId = null) {
    if (isStreaming) await stop();

    try {
      const constraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { width: { ideal: 640 }, height: { ideal: 480 } }
      };

      stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }

      isStreaming = true;
      updateBadge(true);
      return true;
    } catch (err) {
      console.error('Failed to start video:', err);
      isStreaming = false;
      updateBadge(false);
      return false;
    }
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (videoElement) {
      videoElement.srcObject = null;
    }
    isStreaming = false;
    updateBadge(false);
  }

  function updateBadge(live) {
    const badge = document.getElementById('video-badge');
    if (!badge) return;
    if (live) {
      badge.className = 'video-badge live';
      badge.textContent = '● LIVE';
    } else {
      badge.className = 'video-badge offline';
      badge.textContent = 'OFFLINE';
    }
  }

  function takeScreenshot() {
    if (!videoElement || !isStreaming) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0);

    canvas.toBlob(blob => {
      DataManager.downloadBlob(blob, `cansat_screenshot_${DataManager.getTimestamp()}.png`);
    }, 'image/png');
  }

  function isActive() {
    return isStreaming;
  }

  function destroy() {
    stop();
  }

  return { init, enumerateCameras, start, stop, takeScreenshot, isActive, destroy };
})();
