/**
 * Deep-Live-Cam Face Detection using face-api.js
 * Wrapper for face detection and landmark detection
 */

class FaceDetector {
  constructor() {
    this.modelsLoaded = false;
    this.ready = false;
    this.detector = null;
  }

  async loadModels(progressCallback) {
    if (this.modelsLoaded) return true;

    try {
      // Use a reliable CDN for face-api.js models
      const modelPath = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
      
      progressCallback('Loading face detection models...', 10);
      
      // Load all required models
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
      ]);

      this.modelsLoaded = true;
      this.ready = true;
      
      progressCallback('Models loaded!', 100);
      console.log('Face detection models loaded successfully');
      
      return true;
    } catch (error) {
      console.error('Failed to load face detection models:', error);
      throw error;
    }
  }

  async detectFace(input, options = {}) {
    if (!this.ready) {
      throw new Error('Models not loaded');
    }

    const defaults = {
      withLandmarks: true,
      withDescriptor: true,
      minConfidence: 0.5
    };

    const config = { ...defaults, ...options };

    try {
      const detection = await faceapi.detectSingleFace(
        input,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: config.minConfidence
        })
      ).withFaceLandmarks(config.withLandmarks).withFaceDescriptor(config.withDescriptor);

      return detection;
    } catch (error) {
      console.error('Face detection error:', error);
      return null;
    }
  }

  async detectAllFaces(input, options = {}) {
    if (!this.ready) {
      throw new Error('Models not loaded');
    }

    const defaults = {
      withLandmarks: true,
      withDescriptor: false,
      minConfidence: 0.5,
      maxFaces: 10
    };

    const config = { ...defaults, ...options };

    try {
      const detections = await faceapi.detectAllFaces(
        input,
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 320,
          scoreThreshold: config.minConfidence
        })
      ).withFaceLandmarks(config.withLandmarks);

      return detections.slice(0, config.maxFaces);
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  getFaceBox(landmarks, padding = 0.2) {
    // Get bounding box from landmarks
    const jawOutline = landmarks.getJawOutline();
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    for (const point of jawOutline) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }

    // Add padding
    const width = maxX - minX;
    const height = maxY - minY;
    const paddingX = width * padding;
    const paddingY = height * padding;

    return {
      x: Math.max(0, minX - paddingX),
      y: Math.max(0, minY - paddingY),
      width: width + paddingX * 2,
      height: height + paddingY * 2
    };
  }

  // Extract face region from image
  extractFace(imageData, box, targetSize = 128) {
    const { x, y, width, height } = box;
    
    // Create canvas for extracted face
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    // Calculate source dimensions
    const sourceWidth = imageData.width || imageData.videoWidth;
    const sourceHeight = imageData.height || imageData.videoHeight;

    // Scale to fit target size while maintaining aspect ratio
    const scale = Math.max(targetSize / width, targetSize / height);
    const scaledWidth = width * scale;
    const scaledHeight = height * scale;
    const offsetX = (targetSize - scaledWidth) / 2;
    const offsetY = (targetSize - scaledHeight) / 2;

    // Draw scaled face
    ctx.drawImage(
      imageData,
      x, y, width, height,
      offsetX, offsetY, scaledWidth, scaledHeight
    );

    return canvas;
  }

  // Calculate similarity between two face descriptors
  compareFaces(descriptor1, descriptor2) {
    if (!descriptor1 || !descriptor2) return 0;
    
    // Use Euclidean distance
    let sum = 0;
    for (let i = 0; i < descriptor1.length; i++) {
      sum += Math.pow(descriptor1[i] - descriptor2[i], 2);
    }
    const distance = Math.sqrt(sum);
    
    // Convert distance to similarity (0-1)
    return Math.max(0, 1 - distance / 2);
  }
}

// Face swap processor using canvas
class FaceSwapProcessor {
  constructor() {
    this.detector = new FaceDetector();
    this.sourceFace = null;
    this.sourceImage = null;
    this.swapEnabled = true;
  }

  async initialize(progressCallback) {
    await this.detector.loadModels(progressCallback);
  }

  setSourceImage(imageElement) {
    this.sourceImage = imageElement;
    this.sourceFace = null;
  }

  async setSourceFace() {
    if (!this.sourceImage) return null;

    const detection = await this.detector.detectFace(this.sourceImage, {
      withLandmarks: true,
      withDescriptor: true
    });

    if (detection) {
      this.sourceFace = detection;
      console.log('Source face detected:', detection.detection.box);
      return detection;
    }

    throw new Error('No face detected in source image');
  }

  async processFrame(videoElement, canvas) {
    if (!this.swapEnabled || !this.sourceFace) {
      // Just copy video to canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      return;
    }

    const ctx = canvas.getContext('2d');
    
    // Draw original video
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Detect faces in current frame
    const detections = await this.detector.detectAllFaces(videoElement);

    // For each detected face, apply source face
    for (const detection of detections) {
      const box = this.detector.getFaceBox(detection.landmarks);
      
      // Check if we should swap (match confidence)
      const similarity = this.detector.compareFaces(
        detection.descriptor,
        this.sourceFace.descriptor
      );

      // If high confidence match or we're swapping all faces
      if (similarity > 0.4 || this.swapAllFaces) {
        this.drawSwappedFace(ctx, box, similarity);
      }
    }
  }

  drawSwappedFace(ctx, targetBox, similarity = 1) {
    if (!this.sourceFace || !this.sourceImage) return;

    // Get source face dimensions from detection
    const sourceLandmarks = this.sourceFace.landmarks;
    const sourceBox = this.detector.getFaceBox(sourceLandmarks);
    
    // Calculate scaling
    const scaleX = targetBox.width / sourceBox.width;
    const scaleY = targetBox.height / sourceBox.height;
    const scale = Math.max(scaleX, scaleY) * 1.05; // Slightly larger to fill area

    // Calculate position to center
    const targetCenterX = targetBox.x + targetBox.width / 2;
    const targetCenterY = targetBox.y + targetBox.height / 2;
    
    // Calculate source draw dimensions
    const drawWidth = sourceBox.width * scale;
    const drawHeight = sourceBox.height * scale;
    
    // Calculate top-left corner
    const drawX = targetCenterX - drawWidth / 2;
    const drawY = targetCenterY - drawHeight / 2;

    // Save context
    ctx.save();

    // Create circular clip
    ctx.beginPath();
    const clipCenterX = targetBox.x + targetBox.width / 2;
    const clipCenterY = targetBox.y + targetBox.height / 2;
    const clipRadiusX = targetBox.width / 2 * 0.95;
    const clipRadiusY = targetBox.height / 2 * 0.95;
    ctx.ellipse(clipCenterX, clipCenterY, clipRadiusX, clipRadiusY, 0, 0, Math.PI * 2);
    ctx.clip();

    // Draw source face
    ctx.drawImage(
      this.sourceImage,
      sourceBox.x, sourceBox.y, sourceBox.width, sourceBox.height,
      drawX, drawY, drawWidth, drawHeight
    );

    ctx.restore();

    // Draw edge blend
    this.blendEdges(ctx, targetBox, similarity);
  }

  blendEdges(ctx, box, alpha) {
    // Create a subtle edge blend
    ctx.save();
    ctx.globalAlpha = (1 - alpha) * 0.3;
    
    const gradient = ctx.createRadialGradient(
      box.x + box.width / 2, box.y + box.height / 2, 0,
      box.x + box.width / 2, box.y + box.height / 2, Math.max(box.width, box.height) / 2
    );
    
    gradient.addColorStop(0.8, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.5)');
    
    ctx.beginPath();
    ctx.ellipse(
      box.x + box.width / 2,
      box.y + box.height / 2,
      box.width / 2 * 0.95,
      box.height / 2 * 0.95,
      0, 0, Math.PI * 2
    );
    
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
  }

  getStatus() {
    return {
      modelsReady: this.detector.ready,
      hasSourceFace: !!this.sourceFace
    };
  }
}

// Export
window.FaceDetector = FaceDetector;
window.FaceSwapProcessor = FaceSwapProcessor;
