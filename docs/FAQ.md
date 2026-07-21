# Frequently Asked Questions

## General

### What is Deep-Live-Cam Chrome?
Real-time face swap extension for Chrome - swap faces live during video calls.

### Is it free?
Yes, completely free and open source.

### What versions are available?
- **LITE**: Built-in face-api.js, no downloads needed
- **MINI**: Full ONNX models for highest quality

## Installation

### How do I install it?
1. Download the ZIP from releases
2. Extract the folder
3. Go to `chrome://extensions/`
4. Enable Developer mode
5. Click "Load unpacked"
6. Select the folder

### Does it work on Chrome OS?
Yes! Optimized for Chrome OS devices including low-end NAND storage.

## Usage

### How do I use face swap?
1. Click the extension icon
2. Select a face image
3. Choose your camera
4. Press LIVE

### Does it work on all sites?
Works on: Omegle, OmeTV, ChatRandom, Meet, Zoom, Teams, Discord, and more.

## Technical

### What models do I need?
**LITE**: No models needed (uses face-api.js)
**MINI**: Download from HuggingFace:
- inswapper_128_fp16.onnx (~160MB)
- GFPGANv1.4.onnx (~40MB)
- buffalo_l.zip (~50MB)

### What are the system requirements?
- Chrome 102+
- 2GB RAM minimum
- Camera access

## Privacy

### Is my data safe?
Yes. All processing happens locally in your browser. No data is sent to servers.

### Does it access my camera?
Yes, only when you enable face swap. You can revoke permission anytime.

## Support

### Where can I get help?
Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open a GitHub issue.

### How do I report bugs?
Open an issue on GitHub with:
- Chrome version
- Device info
- Error messages
- Steps to reproduce
