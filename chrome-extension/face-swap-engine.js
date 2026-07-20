/**
 * Deep-Live-Cam Face Swap Engine
 * Uses TensorFlow.js and face-api.js for real-time face swapping
 */

// Face Swap Engine Class
class FaceSwapEngine {
  constructor() {
    this.modelsLoaded = false;
    this.faceDetector = null;
    this.faceMatcher = null;
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

  async loadModels(progressCallback) {
    if (this.modelsLoaded) return true;

    try {
      // Load face-api.js models from CDN
      const MODEL_URLS = {
        tinyFaceDetector: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/tiny_face_detector_model-weights_manifest.json',
        faceLandmark68TinyNet: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/face_landmark_68_tiny_model-weights_manifest.json',
        faceRecognitionNet: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/face_recognition_model-weights_manifest.json',
      };

      progressCallback('Loading face detection model...', 10);
      
      // Load tinyFaceDetector
      await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
      this.models.tinyFaceDetector = faceapi.nets.tinyFaceDetector;
      
      progressCallback('Loading face landmark model...', 40);
      
      // Load face landmark model
      await faceapi.nets.faceLandmark68TinyNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
      this.models.faceLandmark68TinyNet = faceapi.nets.faceLandmark68TinyNet;
      
      progressCallback('Loading face recognition model...', 70);
      
      // Load face recognition model
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model');
      this.models.faceRecognitionNet = faceapi.nets.faceRecognitionNet;
      
      this.modelsLoaded = true;
      this.isReady = true;
      
      progressCallback('Ready!', 100);
      return true;
    } catch (error) {
      console.error('Failed to load face swap models:', error);
      throw error;
    }
  }

  async setSourceFace(imageElement) {
    if (!this.modelsLoaded) {
      throw new Error('Models not loaded');
    }

    try {
      // Detect face in source image
      const detections = await faceapi.detectSingleFace(
        imageElement,
        new faceapi.TinyFaceDetectorOptions(this.options)
      ).withFaceLandmarks().withFaceDescriptor();

      if (!detections) {
        throw new Error('No face detected in source image');
      }

      this.sourceDescriptor = detections.descriptor;
      this.sourceLandmarks = detections.landmarks;
      this.sourceImage = imageElement;
      
      console.log('Source face set successfully');
      return true;
    } catch (error) {
      console.error('Failed to set source face:', error);
      throw error;
    }
  }

  async detectFaces(canvas) {
    if (!this.modelsLoaded) return [];

    try {
      const detections = await faceapi.detectAllFaces(
        canvas,
        new faceapi.TinyFaceDetectorOptions(this.options)
      ).withFaceLandmarks().withFaceDescriptor();

      return detections;
    } catch (error) {
      console.error('Face detection error:', error);
      return [];
    }
  }

  async swapFace(targetCanvas, sourceCanvas) {
    if (!this.isReady || !this.sourceDescriptor) {
      return targetCanvas;
    }

    try {
      const ctx = targetCanvas.getContext('2d');
      const width = targetCanvas.width;
      const height = targetCanvas.height;

      // Detect faces in target
      const detections = await this.detectFaces(targetCanvas);

      if (detections.length === 0) {
        return targetCanvas;
      }

      // For each detected face, replace with source face
      for (const detection of detections) {
        const box = detection.detection.box;
        
        // Calculate face dimensions and position
        const { x, y, width: w, height: h } = box;
        
        // Draw source face scaled to match target face
        const sourceAspect = this.sourceImage.width / this.sourceImage.height;
        const targetAspect = w / h;
        
        let drawWidth = w;
        let drawHeight = h;
        let drawX = x;
        let drawY = y;
        
        // Adjust to maintain aspect ratio
        if (sourceAspect > targetAspect) {
          drawHeight = w / sourceAspect;
          drawY = y + (h - drawHeight) / 2;
        } else {
          drawWidth = h * sourceAspect;
          drawX = x + (w - drawWidth) / 2;
        }

        // Draw the source face
        ctx.save();
        
        // Create circular clipping mask for smooth edges
        ctx.beginPath();
        ctx.ellipse(
          drawX + drawWidth / 2,
          drawY + drawHeight / 2,
          drawWidth / 2,
          drawHeight / 2,
          0, 0, Math.PI * 2
        );
        ctx.clip();

        // Draw source face
        ctx.drawImage(
          this.sourceImage,
          drawX, drawY, drawWidth, drawHeight
        );
        
        ctx.restore();

        // Optional: Add subtle blending at edges
        this.blendEdges(ctx, drawX, drawY, drawWidth, drawHeight, targetCanvas);
      }

      return targetCanvas;
    } catch (error) {
      console.error('Face swap error:', error);
      return targetCanvas;
    }
  }

  blendEdges(ctx, x, y, w, h, targetCanvas) {
    // Create a subtle gradient at edges for smoother blending
    const gradient = ctx.createRadialGradient(
      x + w/2, y + h/2, 0,
      x + w/2, y + h/2, Math.max(w, h) / 2
    );
    gradient.addColorStop(0.8, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.3)');

    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      x + w / 2,
      y + h / 2,
      w / 2,
      h / 2,
      0, 0, Math.PI * 2
    );
    ctx.clip();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  // Face morphing effect for more realistic swaps
  async swapFaceMorphed(targetCanvas) {
    if (!this.isReady || !this.sourceDescriptor) {
      return targetCanvas;
    }

    try {
      const ctx = targetCanvas.getContext('2d');
      const detections = await this.detectFaces(targetCanvas);

      for (const detection of detections) {
        const box = detection.detection.box;
        const landmarks = detection.landmarks;
        
        // Get face outline points
        const jaw = landmarks.getJawOutline();
        
        // Calculate average position and size
        const centerX = jaw.reduce((sum, p) => sum + p.x, 0) / jaw.length;
        const centerY = jaw.reduce((sum, p) => sum + p.y, 0) / jaw.length;
        
        // Draw source face with some transformation
        ctx.save();
        
        // Add some transparency for blending effect
        ctx.globalAlpha = 0.8;
        
        // Scale and position source face
        const scaleX = box.width / this.sourceImage.width;
        const scaleY = box.height / this.sourceImage.height;
        const scale = Math.max(scaleX, scaleY) * 1.1;
        
        ctx.translate(centerX, centerY);
        ctx.scale(scale, scale);
        ctx.translate(-this.sourceImage.width / 2, -this.sourceImage.height / 2);
        
        ctx.drawImage(this.sourceImage, 0, 0);
        ctx.restore();
      }

      return targetCanvas;
    } catch (error) {
      console.error('Morphed face swap error:', error);
      return targetCanvas;
    }
  }

  reset() {
    this.sourceDescriptor = null;
    this.sourceLandmarks = null;
    this.sourceImage = null;
  }

  getStatus() {
    return {
      loaded: this.modelsLoaded,
      ready: this.isReady,
      hasSource: !!this.sourceDescriptor
    };
  }
}

// Export for use in other scripts
window.FaceSwapEngine = FaceSwapEngine;
