#!/bin/bash
#==============================================================================
# Deep-Live-Cam Chrome Extension Builder
# Builds Lite and Mini versions for distribution
#==============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
EXT_DIR="chrome-extension"
BUILD_DIR="build"
BUILD_LITE="$BUILD_DIR/lite"
BUILD_MINI="$BUILD_DIR/mini"

# Version
VERSION=$(grep '"version"' "$EXT_DIR/manifest.json" | sed 's/.*"version": "\([^"]*\)".*/\1/')

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Deep-Live-Cam Chrome Builder v$VERSION${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Clean build directory
echo -e "${YELLOW}🧹 Cleaning build directory...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_LITE/models" "$BUILD_MINI/models"

# Copy common files
echo -e "${YELLOW}📁 Copying extension files...${NC}"
cp -r "$EXT_DIR"/* "$BUILD_LITE/"
cp -r "$EXT_DIR"/* "$BUILD_MINI/"

# Create LITE version (no models folder, uses face-api.js)
echo -e "${YELLOW}📦 Building LITE version...${NC}"
rm -rf "$BUILD_LITE/models"
rm -rf "$BUILD_LITE/icons"

# Create LITE-specific files
cat > "$BUILD_LITE/models.md" << 'EOF'
# LITE Version

Uses built-in face-api.js for face detection - no model download needed!

## Features
- ✅ Face detection (built-in)
- ✅ Real-time processing
- ✅ Optimized for low-end devices

## Requirements
- Chrome 102+
- 2GB RAM minimum
- No additional downloads required
EOF

# Update LITE manifest
cat > "$BUILD_LITE/manifest.json" << 'EOF'
{
  "manifest_version": 3,
  "name": "Deep-Live-Cam Chrome (Lite)",
  "version": "VERSION_PLACEHOLDER",
  "description": "Lightweight face swap for Chrome OS - No downloads needed!",
  "permissions": [
    "activeTab",
    "storage",
    "downloads",
    "offscreen",
    "videoCapture",
    "scripting",
    "tabs"
  ],
  "host_permissions": [
    "https://omegle.com/*",
    "https://www.omegle.com/*",
    "https://ometv.com/*",
    "https://www.ometv.com/*",
    "https://chatrandom.com/*",
    "https://www.chatrandom.com/*",
    "https://chaturbate.com/*",
    "https://www.chaturbate.com/*",
    "https://tinychat.com/*",
    "https://meet.google.com/*",
    "https://zoom.us/*",
    "https://teams.microsoft.com/*",
    "https://discord.com/*",
    "http://localhost:8765/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "*://omegle.com/*",
        "*://www.omegle.com/*",
        "*://ometv.com/*",
        "*://www.ometv.com/*",
        "*://chatrandom.com/*",
        "*://www.chatrandom.com/*",
        "*://chaturbate.com/*",
        "*://www.chaturbate.com/*",
        "*://tinychat.com/*",
        "*://meet.google.com/*",
        "*://*.zoom.us/*",
        "*://*.teams.microsoft.com/*",
        "*://discord.com/*"
      ],
      "js": ["content-script.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
    "256": "icons/icon256.png"
  },
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net; object-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://huggingface.co https://*.huggingface.co https://cdn.jsdelivr.net http://localhost:8765; worker-src 'self' blob:"
  },
  "offline_enabled": true,
  "minimum_chrome_version": "102"
}
EOF

# Replace version placeholder
sed -i "s/VERSION_PLACEHOLDER/$VERSION/" "$BUILD_LITE/manifest.json"

# Create MINI version (with models folder for ONNX)
echo -e "${YELLOW}📦 Building MINI version...${NC}"

# Create MINI-specific models README
cat > "$BUILD_MINI/models/README.md" << 'EOF'
# MINI Version - AI Models Required

Download these models from HuggingFace for full-quality face swapping:

## Required Models

| Model | Size | Download |
|-------|------|----------|
| inswapper_128_fp16.onnx | ~160MB | [HuggingFace](https://huggingface.co/hacksider/deep-live-cam/resolve/main/inswapper_128_fp16.onnx) |
| GFPGANv1.4.onnx | ~40MB | [HuggingFace](https://huggingface.co/hacksider/deep-live-cam/resolve/main/GFPGANv1.4.onnx) |
| buffalo_l.zip | ~50MB | [HuggingFace](https://huggingface.co/ashleykleynhans/inswapper/resolve/main/buffalo_l.zip) |

## Installation

1. Download all 3 files above
2. Place ONNX files in this folder
3. Extract buffalo_l.zip contents here
4. Total size: ~250MB

## Features
- ✅ Full-quality face swapping
- ✅ Face enhancement
- ✅ High resolution support
EOF

# Update MINI manifest description
cat > "$BUILD_MINI/manifest.json" << 'EOF'
{
  "manifest_version": 3,
  "name": "Deep-Live-Cam Chrome (Mini)",
  "version": "VERSION_PLACEHOLDER",
  "description": "Full-featured face swap for Chrome OS with AI models",
  "permissions": [
    "activeTab",
    "storage",
    "downloads",
    "offscreen",
    "videoCapture",
    "scripting",
    "tabs"
  ],
  "host_permissions": [
    "https://omegle.com/*",
    "https://www.omegle.com/*",
    "https://ometv.com/*",
    "https://www.ometv.com/*",
    "https://chatrandom.com/*",
    "https://www.chatrandom.com/*",
    "https://chaturbate.com/*",
    "https://www.chaturbate.com/*",
    "https://tinychat.com/*",
    "https://meet.google.com/*",
    "https://zoom.us/*",
    "https://teams.microsoft.com/*",
    "https://discord.com/*",
    "http://localhost:8765/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "*://omegle.com/*",
        "*://www.omegle.com/*",
        "*://ometv.com/*",
        "*://www.ometv.com/*",
        "*://chatrandom.com/*",
        "*://www.chatrandom.com/*",
        "*://chaturbate.com/*",
        "*://www.chaturbate.com/*",
        "*://tinychat.com/*",
        "*://meet.google.com/*",
        "*://*.zoom.us/*",
        "*://*.teams.microsoft.com/*",
        "*://discord.com/*"
      ],
      "js": ["content-script.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
    "256": "icons/icon256.png"
  },
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_security_policy": {
    "extension_pages": "script-src 'self' 'wasm-unsafe-eval' blob: https://cdn.jsdelivr.net; object-src 'self' blob:; style-src 'self' 'unsafe-inline'; connect-src 'self' https://huggingface.co https://*.huggingface.co https://cdn.jsdelivr.net http://localhost:8765; worker-src 'self' blob:"
  },
  "offline_enabled": true,
  "web_accessible_resources": [
    {
      "resources": ["models/*", "icons/*"],
      "matches": ["<all_urls>"]
    }
  ],
  "minimum_chrome_version": "102"
}
EOF

sed -i "s/VERSION_PLACEHOLDER/$VERSION/" "$BUILD_MINI/manifest.json"

# Create ZIP files
echo -e "${YELLOW}📦 Creating ZIP archives...${NC}"

# Calculate sizes
LITE_SIZE=$(du -sh "$BUILD_LITE" | cut -f1)
MINI_SIZE=$(du -sh "$BUILD_MINI" | cut -f1)

cd "$BUILD_DIR"
zip -r "deep-live-cam-chrome-$VERSION-lite.zip" lite/
zip -r "deep-live-cam-chrome-$VERSION-mini.zip" mini/
cd ..

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Build Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "📦 Outputs:"
echo -e "   ${BLUE}build/deep-live-cam-chrome-$VERSION-lite.zip${NC} ($LITE_SIZE)"
echo -e "   ${BLUE}build/deep-live-cam-chrome-$VERSION-mini.zip${NC} ($MINI_SIZE)"
echo ""
echo -e "${GREEN}✅ Done!${NC}"
