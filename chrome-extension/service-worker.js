/**
 * Deep-Live-Cam Chrome Extension - Service Worker
 * Handles background tasks, model downloads, and communication
 */

// Model URLs - using Hugging Face mirrors for faster downloads
const MODEL_URLS = {
  inswapper: 'https://huggingface.co/hacksider/deep-live-cam/resolve/main/inswapper_128_fp16.onnx',
  gfpgan: 'https://huggingface.co/hacksider/deep-live-cam/resolve/main/GFPGANv1.4.onnx',
  buffalo_l: 'https://huggingface.co/ashleykleynhans/inswapper/resolve/main/buffalo_l.zip'
};

// Supported video chat sites
const SUPPORTED_SITES = [
  'omegle.com',
  'www.omegle.com',
  'ometv.com',
  'www.ometv.com',
  'chatrandom.com',
  'www.chatrandom.com',
  'chaturbate.com',
  'www.chaturbate.com'
];

// Storage keys
const STORAGE_KEYS = {
  MODELS_DOWNLOADED: 'models_downloaded',
  DEVICE_PROFILE: 'device_profile',
  SETTINGS: 'settings',
  LAST_UPDATE: 'last_update',
  VIRTUAL_CAMERA_STREAM: 'virtual_camera_stream'
};

// Default settings for low-end Chrome devices
const DEFAULT_SETTINGS = {
  maxResolution: 720, // 720p default for NAND/storage optimization
  quality: 'balanced', // balanced, performance, quality
  enableFaceEnhancer: false, // Disable by default on low-end
  frameRate: 15, // Reduced FPS for NAND
  memoryLimit: 1024 * 1024 * 1024, // 1GB default
  enableCache: true,
  compressionEnabled: true,
  autoDetectQuality: true
};

// Device capability profiles
const DEVICE_PROFILES = {
  low: {
    maxResolution: 480,
    frameRate: 10,
    quality: 'performance',
    enableFaceEnhancer: false,
    memoryLimit: 512 * 1024 * 1024,
    threads: 2
  },
  medium: {
    maxResolution: 720,
    frameRate: 15,
    quality: 'balanced',
    enableFaceEnhancer: false,
    memoryLimit: 1024 * 1024 * 1024,
    threads: 4
  },
  high: {
    maxResolution: 1080,
    frameRate: 30,
    quality: 'quality',
    enableFaceEnhancer: true,
    memoryLimit: 2048 * 1024 * 1024,
    threads: 6
  }
};

/**
 * Detect device capabilities
 */
async function detectDeviceCapabilities() {
  const capabilities = {
    memory: navigator.deviceMemory || 2,
    cores: navigator.hardwareConcurrency || 2,
    isLowEnd: false,
    profile: 'medium'
  };

  // Classify device
  if (capabilities.memory <= 2 && capabilities.cores <= 2) {
    capabilities.isLowEnd = true;
    capabilities.profile = 'low';
  } else if (capabilities.memory <= 4 && capabilities.cores <= 4) {
    capabilities.profile = 'medium';
  } else {
    capabilities.profile = 'high';
  }

  // Store detected profile
  await chrome.storage.local.set({
    [STORAGE_KEYS.DEVICE_PROFILE]: capabilities
  });

  return capabilities;
}

/**
 * Download a model file
 */
async function downloadModel(modelName, progressCallback) {
  const url = MODEL_URLS[modelName];
  if (!url) {
    throw new Error(`Unknown model: ${modelName}`);
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${modelName}`);
  }

  const contentLength = response.headers.get('content-length');
  const total = parseInt(contentLength, 10);
  let loaded = 0;

  const reader = response.body.getReader();
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    chunks.push(value);
    loaded += value.length;

    if (progressCallback && total) {
      progressCallback(loaded, total);
    }
  }

  // Combine chunks into single Uint8Array
  const blob = new Blob(chunks);
  
  // Store in extension storage or download folder
  const arrayBuffer = await blob.arrayBuffer();
  
  // Save to Downloads for persistence
  const filename = `${modelName}.onnx`;
  const downloadUrl = URL.createObjectURL(new Blob([arrayBuffer]));
  
  await chrome.downloads.download({
    url: downloadUrl,
    filename: `Deep-Live-Cam/models/${filename}`,
    saveAs: false
  });

  return filename;
}

/**
 * Check if models are downloaded
 */
async function checkModelsDownloaded() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.MODELS_DOWNLOADED);
  return result[STORAGE_KEYS.MODELS_DOWNLOADED] || false;
}

/**
 * Download all required models
 */
async function downloadAllModels(progressCallback) {
  const models = ['inswapper', 'gfpgan'];
  const results = {};
  const totalSize = 300 * 1024 * 1024; // Approximate total size

  for (const model of models) {
    try {
      await downloadModel(model, (loaded, total) => {
        if (progressCallback) {
          const overallProgress = models.indexOf(model) / models.length +
                                  (loaded / total) / models.length;
          progressCallback(overallProgress * 100, 100);
        }
      });
      results[model] = true;
    } catch (error) {
      console.error(`Failed to download ${model}:`, error);
      results[model] = false;
    }
  }

  const allDownloaded = Object.values(results).every(v => v);
  if (allDownloaded) {
    await chrome.storage.local.set({
      [STORAGE_KEYS.MODELS_DOWNLOADED]: true,
      [STORAGE_KEYS.LAST_UPDATE]: Date.now()
    });
  }

  return results;
}

/**
 * Get current settings
 */
async function getSettings() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
  return result[STORAGE_KEYS.SETTINGS] || DEFAULT_SETTINGS;
}

/**
 * Update settings
 */
async function updateSettings(newSettings) {
  const current = await getSettings();
  const updated = { ...current, ...newSettings };
  await chrome.storage.local.set({
    [STORAGE_KEYS.SETTINGS]: updated
  });
  return updated;
}

/**
 * Get device profile
 */
async function getDeviceProfile() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.DEVICE_PROFILE);
  if (result[STORAGE_KEYS.DEVICE_PROFILE]) {
    return result[STORAGE_KEYS.DEVICE_PROFILE];
  }
  return await detectDeviceCapabilities();
}

/**
 * Initialize extension
 */
async function initialize() {
  // Detect device capabilities
  const capabilities = await detectDeviceCapabilities();
  
  // Apply profile-based settings
  const profileSettings = DEVICE_PROFILES[capabilities.profile];
  await updateSettings(profileSettings);

  console.log('Deep-Live-Cam Chrome initialized', { capabilities, profileSettings });
}

// Message handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {
      case 'getCapabilities':
        sendResponse(await detectDeviceCapabilities());
        break;

      case 'getSettings':
        sendResponse(await getSettings());
        break;

      case 'updateSettings':
        sendResponse(await updateSettings(message.settings));
        break;

      case 'getDeviceProfile':
        sendResponse(await getDeviceProfile());
        break;

      case 'checkModels':
        sendResponse(await checkModelsDownloaded());
        break;

      case 'downloadModels':
        sendResponse(await downloadAllModels(message.progressCallback));
        break;

      case 'downloadModel':
        sendResponse(await downloadModel(message.model, message.progressCallback));
        break;

      case 'setVirtualCameraStream':
        await chrome.storage.local.set({
          [STORAGE_KEYS.VIRTUAL_CAMERA_STREAM]: message.streamId
        });
        sendResponse({ success: true });
        break;

      case 'getVirtualCameraStream':
        const result = await chrome.storage.local.get(STORAGE_KEYS.VIRTUAL_CAMERA_STREAM);
        sendResponse(result[STORAGE_KEYS.VIRTUAL_CAMERA_STREAM] || null);
        break;

      case 'clearVirtualCameraStream':
        await chrome.storage.local.remove(STORAGE_KEYS.VIRTUAL_CAMERA_STREAM);
        sendResponse({ success: true });
        break;

      case 'reportStats':
        // Store performance stats from face-swap page
        if (message.stats) {
          const currentStats = (await chrome.storage.local.get('performanceStats')).performanceStats || { samples: [] };
          currentStats.samples.push(message.stats);
          // Keep last 60 samples (5 min intervals x 60 = 5 hours)
          currentStats.samples = currentStats.samples.slice(-60);
          currentStats.lastSample = message.stats;
          await chrome.storage.local.set({ performanceStats: currentStats });
        }
        sendResponse({ received: true });
        break;

      case 'getHealthStatus':
        sendResponse(await backgroundTasks.healthCheck());
        break;
        
      case 'getPerformanceStats':
        const perfResult = await chrome.storage.local.get('performanceStats');
        sendResponse(perfResult.performanceStats || null);
        break;
        
      case 'runBackgroundTask':
        if (message.task && backgroundTasks[message.task]) {
          sendResponse(await backgroundTasks[message.task]());
        } else {
          sendResponse({ error: 'Unknown task' });
        }
        break;
        
      case 'ping':
        sendResponse({ pong: true, timestamp: Date.now() });
        break;

      default:
        sendResponse({ error: 'Unknown action' });
    }
  })();
  return true; // Keep message channel open for async response
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
  await initialize();
  
  // Open setup page
  chrome.tabs.create({
    url: chrome.runtime.getURL('setup.html')
  });
});

// Initialize on startup
chrome.runtime.onStartup.addListener(async () => {
  await initialize();
});

// Periodic cleanup
chrome.alarms.create('cleanup', { periodInMinutes: 30 });
chrome.alarms.create('healthCheck', { periodInMinutes: 5 });
chrome.alarms.create('performanceMonitor', { periodInMinutes: 5 });
chrome.alarms.create('modelSync', { periodInMinutes: 5 });

// Background task handlers
const backgroundTasks = {
  /**
   * Health check - verify extension is still functioning
   */
  async healthCheck() {
    console.log('[BG] Running health check...');
    
    // Check if storage is accessible
    try {
      await chrome.storage.local.get(['settings']);
      await chrome.storage.session.get(['test']);
      return { healthy: true, timestamp: Date.now() };
    } catch (error) {
      console.error('[BG] Health check failed:', error);
      return { healthy: false, error: error.message, timestamp: Date.now() };
    }
  },

  /**
   * Performance monitoring - track FPS, memory usage
   */
  async performanceMonitor() {
    console.log('[BG] Running performance monitor...');
    
    const stats = {
      timestamp: Date.now(),
      fps: [],
      frameCount: 0,
      errors: []
    };
    
    // Get stored performance data
    const result = await chrome.storage.local.get('performanceStats');
    const existingStats = result.performanceStats || { samples: [] };
    
    // Keep only last 60 samples (5 minutes at 5-min intervals = 1 hour)
    existingStats.samples = existingStats.samples.slice(-60);
    
    // Calculate averages
    if (existingStats.samples.length > 0) {
      const avgFps = existingStats.samples.reduce((sum, s) => sum + (s.fps || 0), 0) / existingStats.samples.length;
      const avgMemory = existingStats.samples.reduce((sum, s) => sum + (s.memory || 0), 0) / existingStats.samples.length;
      
      existingStats.averageFps = Math.round(avgFps);
      existingStats.averageMemory = Math.round(avgMemory);
      existingStats.lastUpdate = Date.now();
    }
    
    await chrome.storage.local.set({ performanceStats: existingStats });
    return existingStats;
  },

  /**
   * Cleanup old data and cache
   */
  async cleanup() {
    console.log('[BG] Running cleanup...');
    
    const now = Date.now();
    const ONE_HOUR = 60 * 60 * 1000;
    const ONE_DAY = 24 * ONE_HOUR;
    
    // Clean up old performance stats
    const result = await chrome.storage.local.get('performanceStats');
    if (result.performanceStats) {
      const cutoff = now - ONE_DAY;
      result.performanceStats.samples = result.performanceStats.samples.filter(
        s => s.timestamp > cutoff
      );
      await chrome.storage.local.set({ performanceStats: result.performanceStats });
    }
    
    // Clean up old temporary data
    await chrome.storage.local.remove('tempFrames').catch(() => {});
    await chrome.storage.local.remove('processingQueue').catch(() => {});
    
    // Clear URL cache
    if (caches) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes('temp') || name.includes('dlc-temp')) {
          await caches.delete(name);
        }
      }
    }
    
    return { cleaned: true, timestamp: now };
  },

  /**
   * Model sync - check for model updates
   */
  async modelSync() {
    console.log('[BG] Checking model status...');
    
    const result = await chrome.storage.local.get([
      STORAGE_KEYS.MODELS_DOWNLOADED,
      STORAGE_KEYS.LAST_UPDATE,
      'modelVersions'
    ]);
    
    const modelStatus = {
      downloaded: result[STORAGE_KEYS.MODELS_DOWNLOADED] || false,
      lastUpdate: result[STORAGE_KEYS.LAST_UPDATE] || null,
      versions: result.modelVersions || {},
      timestamp: Date.now()
    };
    
    // Check if models need redownload (corrupted/missing)
    if (modelStatus.downloaded) {
      // Could add integrity check here
      console.log('[BG] Models status:', modelStatus);
    }
    
    return modelStatus;
  },

  /**
   * Virtual camera keepalive - maintain stream
   */
  async virtualCameraKeepalive() {
    // Check if virtual camera is active
    const result = await chrome.storage.local.get(STORAGE_KEYS.VIRTUAL_CAMERA_STREAM);
    if (result[STORAGE_KEYS.VIRTUAL_CAMERA_STREAM]) {
      // Update last active timestamp
      await chrome.storage.local.set({
        lastVirtualCameraActivity: Date.now()
      });
      console.log('[BG] Virtual camera keepalive OK');
    }
    return { active: !!result[STORAGE_KEYS.VIRTUAL_CAMERA_STREAM] };
  }
};

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log(`[BG] Alarm triggered: ${alarm.name}`);
  
  switch (alarm.name) {
    case 'healthCheck':
      backgroundTasks.healthCheck().catch(console.error);
      break;
      
    case 'performanceMonitor':
      backgroundTasks.performanceMonitor().catch(console.error);
      break;
      
    case 'cleanup':
      backgroundTasks.cleanup().catch(console.error);
      break;
      
    case 'modelSync':
      backgroundTasks.modelSync().catch(console.error);
      break;
  }
});

// Note: Message handler is combined with main handler above (lines 244-331)

// Initialize background tasks on startup
async function initBackgroundTasks() {
  console.log('[BG] Initializing background tasks...');
  
  // Run initial health check
  await backgroundTasks.healthCheck();
  
  // Run initial cleanup
  await backgroundTasks.cleanup();
  
  console.log('[BG] Background tasks initialized');
}

// Initialize on service worker start
initBackgroundTasks();

console.log('Deep-Live-Cam Service Worker loaded with background tasks');
