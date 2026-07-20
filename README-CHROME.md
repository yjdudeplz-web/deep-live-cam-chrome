# Deep-Live-Cam Chrome Edition

<p align="center">
  <img src="media/demo.gif" alt="Demo GIF" width="800">
</p>

<p align="center">
  <strong>Real-time face swap optimized for Chrome OS devices with NAND storage</strong>
</p>

## Features

### 🎯 Chrome OS Optimized
- **Memory Efficient**: Automatically adjusts to your device's RAM (2GB-8GB+)
- **NAND Storage Optimized**: Sequential I/O patterns, minimal random writes
- **Adaptive Quality**: Dynamically adjusts resolution/FPS based on performance
- **Low-End Device Support**: Works on budget Chromebooks with Celeron/MTK processors

### 🎭 Virtual Camera Mode (NEW!)
Use face swap on video chat sites like:
- **Omegle** - Text and video chat
- **OmeTV** - Random video chat
- **ChatRandom** - Random webcam chat
- **Chaturbate** - Live streaming

Just select a face, start face swap, and click the site button!

### 🚀 Performance Modes
| Mode | Resolution | FPS | Face Enhancer | Best For |
|------|------------|-----|---------------|----------|
| Performance | 480p | 10 | Off | Low-end devices, battery saving |
| Balanced | 720p | 15 | Off | Most users |
| Quality | 1080p | 30 | On | High-end Chromebooks |

### 📦 Installation

#### Option 1: Chrome Extension (Recommended)
1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the `chrome-extension` folder
5. Click the Deep-Live-Cam icon in your extensions bar
6. Download the AI models (~300MB)
7. Grant camera permissions when prompted

#### Option 2: Python (Linux/Crostini)
```bash
# Install dependencies
pip install -r requirements-chrome.txt

# Download models
mkdir -p models
wget -O models/inswapper_128_fp16.onnx \
  https://huggingface.co/hacksider/deep-live-cam/resolve/main/inswapper_128_fp16.onnx
wget -O models/GFPGANv1.4.onnx \
  https://huggingface.co/hacksider/deep-live-cam/resolve/main/GFPGANv1.4.onnx

# Run
python run.py
```

### 🔧 Device Profiles

The app automatically detects your device class:

| Profile | RAM | CPU | Settings |
|---------|-----|-----|----------|
| **Low-end** | 2GB | 2 cores | 480p, 10 FPS, no enhancer |
| **Medium** | 4GB | 4 cores | 720p, 15 FPS, no enhancer |
| **High** | 8GB+ | 6+ cores | 1080p, 30 FPS, with enhancer |

## Technical Details

### NAND Storage Optimization
- **Streaming I/O**: Sequential reads/writes to minimize NAND wear
- **Memory Caching**: Frames cached in RAM before writing
- **Compression**: Optional frame compression for reduced I/O
- **Batch Operations**: Multiple file operations grouped together

### Memory Management
```python
# Automatic memory limits based on available RAM
from modules.memory_optimize import optimize_for_chrome_os
optimize_for_chrome_os()  # Sets appropriate OMP_NUM_THREADS, etc.
```

### Adaptive Quality
```python
from modules.adaptive_quality import initialize_for_chrome_os
settings = initialize_for_chrome_os()
# Automatically detects device and applies optimal settings
```

## Usage

### Chrome Extension - Virtual Camera Mode
1. Open the face-swap.html page (click the extension icon → "Open App")
2. Select a source face image (or use quick presets like 🎭 Robot, 👸 Princess)
3. Click "Start Face Swap"
4. **Troll Mode**: Click on Omegle/OmeTV/ChatRandom buttons
5. Allow camera access when prompted
6. Your swapped face will appear in the video chat!

### Command Line
```bash
# With automatic quality detection
python run.py

# Performance mode
python run.py --execution-provider cpu --max-memory 1

# High quality mode
python run.py --execution-provider cpu --max-memory 4
```

## File Structure

```
deep-live-cam/
├── chrome-extension/          # Chrome Extension files
│   ├── manifest.json          # Extension manifest
│   ├── service-worker.js      # Background service worker
│   ├── popup.html/css/js      # Extension popup UI
│   ├── index.html             # Main PWA page
│   ├── face-swap.html         # Face swap interface
│   └── icons/                 # Extension icons
├── modules/
│   ├── memory_optimize.py     # Memory management
│   ├── nand_optimize.py       # NAND storage optimizations
│   ├── model_compress.py      # Model compression utils
│   └── adaptive_quality.py    # Adaptive quality settings
├── requirements-chrome.txt    # Chrome-specific dependencies
└── README-CHROME.md          # This file
```

## Troubleshooting

### Virtual Camera Not Working on Video Chat Sites
If the face swap doesn't appear on video chat sites:
1. Make sure face swap is running (green "LIVE" indicator)
2. When prompted for camera on the chat site, allow access
3. The site may require you to manually select the camera - look for a camera icon in the site
4. Some sites may block custom camera streams for safety

### Extension won't load
- Make sure "Developer mode" is enabled in `chrome://extensions`
- Check for errors in the extension's "Errors" section

### Camera not working
- Grant camera permission when prompted
- Try a different camera if multiple are available

### Slow performance
- Switch to "Performance" quality mode
- Close other tabs/applications
- Disable Face Enhancer in settings

### Out of memory
- The app automatically limits memory usage
- Try closing other applications
- Switch to Performance mode

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| Chrome | v94+ | v110+ |
| RAM | 2 GB | 4 GB |
| Storage | 500 MB free | 1 GB free |
| Camera | Any | HD webcam |

## License

Same as main Deep-Live-Cam project. For educational and creative purposes only.

## Credits

- Base code: [Deep-Live-Cam](https://github.com/hacksider/Deep-Live-Cam)
- Chrome optimization: Custom adaptation for Chrome OS devices
