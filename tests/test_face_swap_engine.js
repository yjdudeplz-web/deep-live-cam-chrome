/**
 * Test suite for Face Swap Engine
 * Run with: node tests/test_face_swap_engine.js
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
    toEqual: (expected) => {
      const eq = JSON.stringify(value) === JSON.stringify(expected);
      if (eq) {
        console.log(`  ✅`);
        passed++;
      } else {
        console.log(`  ❌ expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`);
        failed++;
      }
    },
    toBeTruthy: () => {
      if (value) {
        console.log(`  ✅`);
        passed++;
      } else {
        console.log(`  ❌ expected truthy value`);
        failed++;
      }
    },
    toBeFalsy: () => {
      if (!value) {
        console.log(`  ✅`);
        passed++;
      } else {
        console.log(`  ❌ expected falsy value`);
        failed++;
      }
    },
    toContain: (expected) => {
      if (String(value).includes(expected)) {
        console.log(`  ✅`);
        passed++;
      } else {
        console.log(`  ❌ expected to contain "${expected}"`);
        failed++;
      }
    }
  };
}

// Mock FaceSwapEngine class
class FaceSwapEngine {
  constructor() {
    this.modelsLoaded = false;
    this.faceDetector = null;
    this.models = {
      tinyFaceDetector: null,
      faceLandmark68TinyNet: null,
      faceRecognitionNet: null,
      faceExpressionNet: null
    };
    this.options = {
      withFaceLandmarks: true,
      withFaceDescriptors: true,
      withFaceExpressions: false,
      withAgeAndGender: false,
      minConfidence: 0.5,
      maxResults: 10
    };
    this.sourceDescriptor = null;
    this.isReady = false;
  }

  getStatus() {
    return {
      loaded: this.modelsLoaded,
      ready: this.isReady,
      hasSource: !!this.sourceDescriptor
    };
  }

  reset() {
    this.sourceDescriptor = null;
    this.sourceLandmarks = null;
    this.sourceImage = null;
  }
}

// Tests
test("FaceSwapEngine initializes correctly", () => {
  const engine = new FaceSwapEngine();
  expect(engine.modelsLoaded).toBeFalsy();
  expect(engine.isReady).toBeFalsy();
  expect(engine.sourceDescriptor).toBeFalsy();
  expect(engine.models).toBeTruthy();
});

test("getStatus returns correct structure", () => {
  const engine = new FaceSwapEngine();
  const status = engine.getStatus();
  expect(status.loaded).toBeFalsy();
  expect(status.ready).toBeFalsy();
  expect(status.hasSource).toBeFalsy();
});

test("reset clears all data", () => {
  const engine = new FaceSwapEngine();
  engine.sourceDescriptor = new Float32Array(128);
  engine.sourceLandmarks = { jaw: [] };
  engine.sourceImage = {};
  
  engine.reset();
  
  expect(engine.sourceDescriptor).toBeFalsy();
  expect(engine.sourceLandmarks).toBeFalsy();
  expect(engine.sourceImage).toBeFalsy();
});

test("Default options are set", () => {
  const engine = new FaceSwapEngine();
  expect(engine.options.minConfidence).toBe(0.5);
  expect(engine.options.maxResults).toBe(10);
  expect(engine.options.withFaceLandmarks).toBe(true);
});

test("Models object structure", () => {
  const engine = new FaceSwapEngine();
  expect(Object.keys(engine.models)).toEqual([
    'tinyFaceDetector',
    'faceLandmark68TinyNet', 
    'faceRecognitionNet',
    'faceExpressionNet'
  ]);
});

// Run tests
console.log("\n🧪 Face Swap Engine Tests\n");
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
  console.log("✅ All tests passed!\n");
}
