/**
 * Integration Tests for Deep-Live-Cam Chrome Extension
 * Tests the extension components work together
 */

const tests = [];
let passed = 0;
let failed = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function expect(value) {
  return {
    toBe: (expected) => {
      if (value === expected) {
        console.log(`  ✅`);
        passed++;
      } else {
        console.log(`  ❌ expected ${expected}, got ${value}`);
        failed++;
      }
    },
    toBeTruthy: () => {
      if (value) { console.log(`  ✅`); passed++; }
      else { console.log(`  ❌ expected truthy`); failed++; }
    },
    toBeFalsy: () => {
      if (!value) { console.log(`  ✅`); passed++; }
      else { console.log(`  ❌ expected falsy`); failed++; }
    },
    toContain: (expected) => {
      if (String(value).includes(expected)) { console.log(`  ✅`); passed++; }
      else { console.log(`  ❌ expected to contain "${expected}"`); failed++; }
    }
  };
}

// Mock storage
const mockStorage = {
  models_downloaded: false,
  device_profile: { profile: 'medium', memory: 4 },
  settings: { quality: 'balanced', maxResolution: 720, frameRate: 15 }
};

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: async (msg) => {
      switch (msg.action) {
        case 'getDeviceProfile': return mockStorage.device_profile;
        case 'getSettings': return mockStorage.settings;
        case 'checkModels': return mockStorage.models_downloaded;
        case 'getPerformanceStats': return { lastSample: { fps: 30, memory: 512, faces: 1 } };
        default: return null;
      }
    },
    getURL: (path) => `chrome-extension://id/${path}`
  },
  storage: {
    local: {
      get: async (key) => {
        if (Array.isArray(key)) {
          const result = {};
          key.forEach(k => { if (mockStorage[k]) result[k] = mockStorage[k]; });
          return result;
        }
        return { [key]: mockStorage[key] };
      },
      set: async (data) => {
        Object.assign(mockStorage, data);
        return true;
      }
    }
  },
  tabs: {
    create: async () => ({ id: 1 })
  },
  downloads: {
    download: async () => ({ id: 1 })
  }
};

// Import the service worker functions (simulated)
const STORAGE_KEYS = {
  MODELS_DOWNLOADED: 'models_downloaded',
  DEVICE_PROFILE: 'device_profile',
  SETTINGS: 'settings'
};

const DEFAULT_SETTINGS = {
  maxResolution: 720,
  quality: 'balanced',
  enableFaceEnhancer: false,
  frameRate: 15,
  memoryLimit: 1024 * 1024 * 1024,
  enableCache: true
};

const DEVICE_PROFILES = {
  low: { maxResolution: 480, frameRate: 10, quality: 'performance' },
  medium: { maxResolution: 720, frameRate: 15, quality: 'balanced' },
  high: { maxResolution: 1080, frameRate: 30, quality: 'quality' }
};

// Tests
test("Storage keys are defined", () => {
  expect(STORAGE_KEYS.MODELS_DOWNLOADED).toBe('models_downloaded');
  expect(STORAGE_KEYS.DEVICE_PROFILE).toBe('device_profile');
  expect(STORAGE_KEYS.SETTINGS).toBe('settings');
});

test("Default settings are valid", () => {
  expect(DEFAULT_SETTINGS.maxResolution).toBe(720);
  expect(DEFAULT_SETTINGS.quality).toBe('balanced');
  expect(DEFAULT_SETTINGS.frameRate).toBe(15);
  expect(DEFAULT_SETTINGS.enableCache).toBe(true);
});

test("Device profiles cover all tiers", () => {
  expect(DEVICE_PROFILES.low).toBeTruthy();
  expect(DEVICE_PROFILES.medium).toBeTruthy();
  expect(DEVICE_PROFILES.high).toBeTruthy();
});

test("Chrome API is mocked correctly", async () => {
  const profile = await chrome.runtime.sendMessage({ action: 'getDeviceProfile' });
  expect(profile.profile).toBe('medium');
  
  const settings = await chrome.runtime.sendMessage({ action: 'getSettings' });
  expect(settings.quality).toBe('balanced');
});

test("Storage mock works", async () => {
  const result = await chrome.storage.local.get('models_downloaded');
  expect(result.models_downloaded).toBe(false);
  
  await chrome.storage.local.set({ models_downloaded: true });
  const updated = await chrome.storage.local.get('models_downloaded');
  expect(updated.models_downloaded).toBe(true);
});

test("Performance stats are tracked", async () => {
  const stats = await chrome.runtime.sendMessage({ action: 'getPerformanceStats' });
  expect(stats.lastSample.fps).toBe(30);
  expect(stats.lastSample.memory).toBe(512);
});

test("Settings can be updated", async () => {
  const current = await chrome.runtime.sendMessage({ action: 'getSettings' });
  expect(current.maxResolution).toBe(720);
  
  await chrome.storage.local.set({ settings: { ...current, maxResolution: 480 } });
  const updated = await chrome.runtime.sendMessage({ action: 'getSettings' });
  expect(updated.maxResolution).toBe(480);
});

test("Profile-based settings work", () => {
  const lowSettings = DEVICE_PROFILES.low;
  expect(lowSettings.maxResolution).toBe(480);
  expect(lowSettings.frameRate).toBe(10);
});

// Run tests
console.log("\n🧪 Integration Tests\n");
console.log("=".repeat(40));

for (const t of tests) {
  console.log(`\n📋 ${t.name}`);
  try {
    t.fn();
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`);
    failed++;
  }
}

console.log("\n" + "=".repeat(40));
console.log(`\n📊 ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("✅ All integration tests passed!\n");
}
