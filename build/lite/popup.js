/**
 * Deep-Live-Cam Chrome Extension - Popup Script
 */

// DOM Elements
const elements = {
  modelsStatus: document.getElementById('models-status'),
  deviceProfile: document.getElementById('device-profile'),
  memoryInfo: document.getElementById('memory-info'),
  qualitySelect: document.getElementById('quality-select'),
  resolutionSelect: document.getElementById('resolution-select'),
  fpsSelect: document.getElementById('fps-select'),
  faceEnhancerToggle: document.getElementById('face-enhancer-toggle'),
  cacheToggle: document.getElementById('cache-toggle'),
  downloadBtn: document.getElementById('download-btn'),
  downloadProgress: document.getElementById('download-progress'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  openAppBtn: document.getElementById('open-face-swap-btn'),
  openSettingsBtn: document.getElementById('open-settings-btn')
};

// Device profiles for display
const PROFILE_LABELS = {
  low: 'Low-end',
  medium: 'Medium',
  high: 'High Performance'
};

/**
 * Initialize popup
 */
async function init() {
  await Promise.all([
    checkModelsStatus(),
    loadDeviceInfo(),
    loadSettings()
  ]);
  setupEventListeners();
}

/**
 * Check if models are downloaded
 */
async function checkModelsStatus() {
  try {
    const downloaded = await chrome.runtime.sendMessage({ action: 'checkModels' });
    updateModelsStatus(downloaded);
  } catch (error) {
    console.error('Failed to check models:', error);
    updateModelsStatus(false, true);
  }
}

/**
 * Update models status display
 */
function updateModelsStatus(downloaded, error = false) {
  if (error) {
    elements.modelsStatus.textContent = 'Error';
    elements.modelsStatus.className = 'value error';
  } else if (downloaded) {
    elements.modelsStatus.textContent = 'Ready';
    elements.modelsStatus.className = 'value ready';
    elements.downloadBtn.textContent = 'Re-download Models';
  } else {
    elements.modelsStatus.textContent = 'Not downloaded';
    elements.modelsStatus.className = 'value';
    elements.downloadBtn.textContent = 'Download Models';
  }
}

/**
 * Load device information
 */
async function loadDeviceInfo() {
  try {
    const profile = await chrome.runtime.sendMessage({ action: 'getDeviceProfile' });
    elements.deviceProfile.textContent = PROFILE_LABELS[profile.profile] || 'Unknown';
    
    // Display memory info
    const memoryMB = profile.memory || navigator.deviceMemory || 2;
    elements.memoryInfo.textContent = `${memoryMB} GB`;
  } catch (error) {
    console.error('Failed to load device info:', error);
    elements.deviceProfile.textContent = 'Unknown';
    elements.memoryInfo.textContent = '-';
  }
}

/**
 * Load current settings
 */
async function loadSettings() {
  try {
    const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
    
    elements.qualitySelect.value = settings.quality || 'balanced';
    elements.resolutionSelect.value = settings.maxResolution || 720;
    elements.fpsSelect.value = settings.frameRate || 15;
    elements.faceEnhancerToggle.checked = settings.enableFaceEnhancer || false;
    elements.cacheToggle.checked = settings.enableCache !== false;
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

/**
 * Save settings
 */
async function saveSettings() {
  const settings = {
    quality: elements.qualitySelect.value,
    maxResolution: parseInt(elements.resolutionSelect.value),
    frameRate: parseInt(elements.fpsSelect.value),
    enableFaceEnhancer: elements.faceEnhancerToggle.checked,
    enableCache: elements.cacheToggle.checked
  };

  try {
    await chrome.runtime.sendMessage({ action: 'updateSettings', settings });
    showNotification('Settings saved');
  } catch (error) {
    console.error('Failed to save settings:', error);
    showNotification('Failed to save settings', true);
  }
}

/**
 * Download models with progress
 */
async function downloadModels() {
  elements.downloadBtn.disabled = true;
  elements.downloadBtn.textContent = 'Downloading...';
  elements.downloadProgress.classList.remove('hidden');

  try {
    await chrome.runtime.sendMessage({
      action: 'downloadModels',
      progressCallback: (loaded, total) => {
        const percent = Math.round((loaded / total) * 100);
        elements.progressFill.style.width = `${percent}%`;
        elements.progressText.textContent = `${percent}%`;
      }
    });

    updateModelsStatus(true);
    showNotification('Models downloaded successfully!');
  } catch (error) {
    console.error('Failed to download models:', error);
    showNotification('Failed to download models', true);
  } finally {
    elements.downloadBtn.disabled = false;
    elements.downloadProgress.classList.add('hidden');
    elements.progressFill.style.width = '0%';
  }
}

/**
 * Show notification
 */
function showNotification(message, isError = false) {
  // Simple notification - could be enhanced with toast UI
  const notification = document.createElement('div');
  notification.className = `notification ${isError ? 'error' : 'success'}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 16px;
    left: 16px;
    right: 16px;
    padding: 12px 16px;
    background: ${isError ? '#ea4335' : '#34a853'};
    color: white;
    border-radius: 8px;
    text-align: center;
    font-size: 13px;
    z-index: 1000;
    animation: slideUp 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Settings changes
  elements.qualitySelect.addEventListener('change', saveSettings);
  elements.resolutionSelect.addEventListener('change', saveSettings);
  elements.fpsSelect.addEventListener('change', saveSettings);
  elements.faceEnhancerToggle.addEventListener('change', saveSettings);
  elements.cacheToggle.addEventListener('change', saveSettings);

  // Download button
  elements.downloadBtn.addEventListener('click', downloadModels);

  // Open face swap app button
  elements.openAppBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('face-swap.html') });
    window.close();
  });

  // Open settings button (uses setup page as settings)
  elements.openSettingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('setup.html') });
    window.close();
  });
  
  // Open specific video chat site with face swap
  document.querySelectorAll('[data-site]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const site = btn.dataset.site;
      const sites = {
        omegle: 'https://omegle.com',
        ometv: 'https://ometv.com',
        chatrandom: 'https://chatrandom.com'
      };
      if (sites[site]) {
        await chrome.tabs.create({ url: chrome.runtime.getURL('face-swap.html') });
        setTimeout(() => {
          chrome.tabs.create({ url: sites[site] });
        }, 500);
      }
      window.close();
    });
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);

// Add slideUp animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
