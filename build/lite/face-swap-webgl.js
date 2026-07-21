/**
 * Deep-Live-Cam WebGL Face Swap Renderer
 * High-performance face swapping using WebGL shaders
 */

class WebGLFaceSwapRenderer {
  constructor() {
    this.gl = null;
    this.program = null;
    this.texture = null;
    this.canvas = null;
    this.videoElement = null;
    this.sourceImage = null;
    this.isInitialized = false;
    this.animationId = null;
    
    // Face detection results
    this.currentFaces = [];
    this.sourceFaceData = null;
  }

  async initialize(canvas) {
    this.canvas = canvas;
    
    // Initialize WebGL
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true
    });
    
    if (!gl) {
      throw new Error('WebGL not supported');
    }
    
    this.gl = gl;
    
    // Create shaders
    const vertexShader = this.createShader(gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `);
    
    const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform sampler2D u_image;
      uniform sampler2D u_source;
      uniform vec2 u_resolution;
      uniform vec4 u_faceBox; // x, y, width, height
      uniform float u_faceDetected;
      uniform float u_mirror;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 coord = v_texCoord;
        
        // Mirror effect
        if (u_mirror > 0.5) {
          coord.x = 1.0 - coord.x;
        }
        
        vec4 color = texture2D(u_image, coord);
        
        // Blend source face if detected
        if (u_faceDetected > 0.5) {
          vec2 faceX = u_faceBox.xy / u_resolution;
          vec2 faceSize = u_faceBox.zw / u_resolution;
          
          // Check if current pixel is inside face region
          vec2 relativeCoord = (coord - faceX) / faceSize;
          
          if (relativeCoord.x >= 0.0 && relativeCoord.x <= 1.0 &&
              relativeCoord.y >= 0.0 && relativeCoord.y <= 1.0) {
            // Inside face region - sample from source
            vec2 sourceCoord = relativeCoord;
            
            // Apply elliptical mask for smoother edges
            vec2 center = vec2(0.5, 0.5);
            float dist = distance(relativeCoord, center) * 2.0;
            
            if (dist < 0.9) {
              vec4 sourceColor = texture2D(u_source, sourceCoord);
              
              // Smooth falloff at edges
              float alpha = smoothstep(0.7, 0.9, dist);
              color = mix(sourceColor, color, alpha);
            }
          }
        }
        
        gl_FragColor = color;
      }
    `);
    
    // Create program
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error('Shader program link failed');
    }
    
    this.program = program;
    
    // Set up geometry
    const positions = new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1, 1,   1, -1,   1, 1
    ]);
    
    const texCoords = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1
    ]);
    
    // Position buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Texture coordinate buffer
    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    
    const texCoordLoc = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(texCoordLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, 0);
    
    // Create textures
    this.videoTexture = gl.createTexture();
    this.sourceTexture = gl.createTexture();
    
    // Set up uniforms
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'u_image'), 0);
    gl.uniform1i(gl.getUniformLocation(program, 'u_source'), 1);
    
    this.isInitialized = true;
    console.log('WebGL Face Swap Renderer initialized');
  }

  createShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  setSourceImage(imageElement) {
    this.sourceImage = imageElement;
    this.updateSourceTexture();
  }

  updateSourceTexture() {
    if (!this.gl || !this.sourceImage) return;
    
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.sourceImage);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  setFaceBox(x, y, width, height, detected) {
    this.faceBox = { x, y, width, height, detected };
  }

  render(videoElement, mirror = true) {
    if (!this.isInitialized || !this.gl) return;

    const gl = this.gl;
    
    // Update video texture
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, videoElement);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Update source texture if changed
    if (this.sourceImage) {
      this.updateSourceTexture();
    }
    
    // Set viewport
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    // Use program
    gl.useProgram(this.program);
    
    // Bind textures
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
    
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture || this.videoTexture);
    
    // Set uniforms
    gl.uniform2f(gl.getUniformLocation(this.program, 'u_resolution'), this.canvas.width, this.canvas.height);
    gl.uniform1f(gl.getUniformLocation(this.program, 'u_mirror'), mirror ? 1.0 : 0.0);
    
    // Set face box (or default)
    if (this.faceBox) {
      gl.uniform4f(
        gl.getUniformLocation(this.program, 'u_faceBox'),
        this.faceBox.x,
        this.faceBox.y,
        this.faceBox.width,
        this.faceBox.height
      );
      gl.uniform1f(gl.getUniformLocation(this.program, 'u_faceDetected'), this.faceBox.detected ? 1.0 : 0.0);
    } else {
      gl.uniform4f(gl.getUniformLocation(this.program, 'u_faceBox'), 0, 0, 0, 0);
      gl.uniform1f(gl.getUniformLocation(this.program, 'u_faceDetected'), 0.0);
    }
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.gl) {
      this.gl.deleteTexture(this.videoTexture);
      this.gl.deleteTexture(this.sourceTexture);
      this.gl.deleteProgram(this.program);
    }
    this.isInitialized = false;
  }
}

// Export
window.WebGLFaceSwapRenderer = WebGLFaceSwapRenderer;
