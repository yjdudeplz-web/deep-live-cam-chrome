/**
 * Deep-Live-Cam Content Script
 * Injects into video chat sites to enable virtual camera usage
 */

let virtualCameraActive = false;
let virtualStreamId = null;

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'useVirtualCamera') {
    virtualStreamId = message.streamId;
    activateVirtualCamera();
    sendResponse({ success: true });
  } else if (message.action === 'deactivateVirtualCamera') {
    deactivateVirtualCamera();
    sendResponse({ success: true });
  }
  return true;
});

/**
 * Activate virtual camera by intercepting getUserMedia
 */
function activateVirtualCamera() {
  if (virtualCameraActive) return;
  
  console.log('[Deep-Live-Cam] Activating virtual camera...');
  
  // Store original getUserMedia
  const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  
  // Replace with virtual camera
  navigator.mediaDevices.getUserMedia = async function(constraints) {
    console.log('[Deep-Live-Cam] getUserMedia intercepted');
    
    // If we have a virtual stream ID, try to use it
    if (virtualStreamId) {
      try {
        // Use tab capture for the extension's face-swap page
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: 'tab',
              chromeMediaSourceId: virtualStreamId
            }
          }
        });
        console.log('[Deep-Live-Cam] Using virtual camera stream');
        return stream;
      } catch (e) {
        console.log('[Deep-Live-Cam] Tab capture failed:', e);
      }
    }
    
    // Fallback: try to find and use the extension's canvas stream
    try {
      // Look for Deep-Live-Cam preview canvas
      const previewCanvas = document.querySelector('canvas#preview-canvas, canvas[id*="preview"]');
      if (previewCanvas) {
        const stream = previewCanvas.captureStream(30);
        console.log('[Deep-Live-Cam] Using canvas capture stream');
        return stream;
      }
    } catch (e) {
      console.log('[Deep-Live-Cam] Canvas capture failed:', e);
    }
    
    // Fallback to real camera
    console.log('[Deep-Live-Cam] Falling back to real camera');
    return originalGetUserMedia(constraints);
  };
  
  virtualCameraActive = true;
  showDeepLiveCamIndicator();
  showPersistentIndicator();
}

/**
 * Deactivate virtual camera
 */
function deactivateVirtualCamera() {
  if (!virtualCameraActive) return;
  
  // Restore original getUserMedia would require storing it
  // For now, just remove indicators
  virtualCameraActive = false;
  virtualStreamId = null;
  removeIndicators();
}

/**
 * Show floating indicator
 */
function showDeepLiveCamIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'dlc-indicator';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 13px;
      font-weight: 600;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 4px 25px rgba(0,0,0,0.4);
      animation: dlc-entrance 0.5s ease;
    ">
      <span style="font-size: 20px;">🎭</span>
      <span>Deep-Live-Cam Active</span>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 14px;
        line-height: 1;
      ">×</button>
    </div>
    <style>
      @keyframes dlc-entrance {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes dlc-pulse {
        0%, 100% { box-shadow: 0 4px 25px rgba(0,0,0,0.4); }
        50% { box-shadow: 0 4px 35px rgba(102, 126, 234, 0.6); }
      }
    </style>
  `;
  
  document.body.appendChild(indicator);
}

/**
 * Show persistent indicator in corner
 */
function showPersistentIndicator() {
  const indicator = document.createElement('div');
  indicator.id = 'dlc-persistent';
  indicator.innerHTML = `
    <div style="
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(10px);
      color: white;
      padding: 8px 14px;
      border-radius: 20px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 11px;
      font-weight: 500;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      gap: 6px;
      border: 1px solid rgba(102, 126, 234, 0.5);
    ">
      <span style="font-size: 14px;">🎭</span>
      <span>Face Swap Active</span>
    </div>
  `;
  
  document.body.appendChild(indicator);
}

/**
 * Remove all indicators
 */
function removeIndicators() {
  const indicator = document.getElementById('dlc-indicator');
  if (indicator) indicator.remove();
  const persistent = document.getElementById('dlc-persistent');
  if (persistent) persistent.remove();
}

/**
 * Site-specific initialization
 */
(function() {
  // Check if we're on a supported site
  const hostname = window.location.hostname;
  const supportedSites = ['omegle.com', 'ometv.com', 'chatrandom.com', 'chaturbate.com', 'tinychat.com'];
  
  const isSupported = supportedSites.some(site => hostname.includes(site));
  
  if (isSupported) {
    console.log('[Deep-Live-Cam] Supported site detected:', hostname);
    
    // Wait for page to fully load
    const tryActivate = () => {
      // Check if we have a virtual stream waiting
      chrome.runtime.sendMessage({ action: 'getVirtualCameraStream' })
        .then(streamId => {
          if (streamId) {
            virtualStreamId = streamId;
            activateVirtualCamera();
          }
        })
        .catch(() => {});
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', tryActivate);
    } else {
      // Try immediately and again after a delay
      tryActivate();
      setTimeout(tryActivate, 3000);
    }
  }
})();

// Auto-activate if requested via URL parameter
if (new URLSearchParams(window.location.search).get('dlc') === '1') {
  activateVirtualCamera();
}
