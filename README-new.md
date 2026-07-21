# 🤖 Deep-Live-Cam Chrome Extension

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=google-chrome" alt="Chrome Extension">
  <img src="https://img.shields.io/badge/Version-2.1.6-34A853?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Chrome-OS-Supported-333333?style=for-the-badge&logo=chrome" alt="Chrome OS">
</p>

<p align="center">
  <strong>Real-time face swap for Chrome OS devices</strong><br>
  Works on Omegle, OmeTV, ChatRandom, Google Meet, Zoom, Teams, Discord, and more!
</p>

---

## 🎯 Features

### Two Versions for Every Need

| Version | Size | Models | Best For |
|---------|------|--------|----------|
| **Lite** | ~40KB | Built-in face-api.js | Low-end Chrome, NAND storage |
| **Mini** | ~40KB + 250MB | ONNX models | High quality, best results |

### ✨ Core Features

- 🔄 **Real-time Face Swap** - Swap faces live during video calls
- 📹 **Works Everywhere** - Omegle, OmeTV, ChatRandom, Meet, Zoom, Teams, Discord
- 🖥️ **Chrome OS Optimized** - Designed for low-end Chromebooks
- 🎨 **Privacy First** - All processing happens locally
- ⚡ **Fast Setup** - Works out of the box with Lite version
- 🔧 **Fully Customizable** - Adjust quality, resolution, FPS

### Lite vs Mini

#### Lite Version (Recommended)
- ✅ No downloads needed - works immediately
- ✅ Uses face-api.js for face detection
- ✅ Perfect for low-end devices
- ✅ Smaller storage footprint
- ⚠️ Lower quality face swapping

#### Mini Version (Best Quality)
- ✅ Full ONNX model quality
- ✅ Face enhancement included
- ✅ Best for high-end devices
- ⚠️ Requires ~250MB model download

---

## 🚀 Quick Start

### Installation

1. **Download** the [latest release](https://github.com/yjdudeplz-web/deep-live-cam-chrome/releases)
2. **Extract** the ZIP file
3. **Open** Chrome and go to `chrome://extensions/`
4. **Enable** Developer mode (toggle in top right)
5. **Click** "Load unpacked"
6. **Select** the extracted folder
7. **Done!** 🎉

### For Lite (No Downloads)
Simply install and start using - no additional setup needed!

### For Mini (Full Quality)
1. Install the extension
2. Download AI models from [HuggingFace](https://huggingface.co/hacksider/deep-live-cam)
3. Place models in the `models/` folder
4. Enjoy high-quality face swaps!

---

## 💻 Supported Sites

| Site | Status | Notes |
|------|--------|-------|
| Omegle | ✅ Tested | Real-time video chat |
| OmeTV | ✅ Tested | Random video chat |
| ChatRandom | ✅ Tested | Random video chat |
| Google Meet | ✅ Tested | Video conferencing |
| Zoom | ✅ Tested | Video meetings |
| Microsoft Teams | ✅ Tested | Enterprise meetings |
| Discord | ✅ Tested | Video calls & streams |
| Tinychat | ✅ Tested | Chat rooms |
| Chaturbate | ⚠️ May vary | Adult content |

---

## 🔧 Configuration

### Device Profiles

The extension auto-detects your device and applies optimized settings:

| Profile | RAM | Resolution | FPS | Use Case |
|---------|-----|------------|-----|----------|
| **Low** | ≤2GB | 480p | 10 | NAND/Chromebooks |
| **Medium** | 4GB | 720p | 15 | Most users |
| **High** | 8GB+ | 1080p | 30 | Best quality |

### Manual Settings

Access settings via the extension popup:
- **Quality Mode**: Performance / Balanced / Quality
- **Resolution**: 480p / 720p / 1080p
- **Frame Rate**: 10 / 15 / 30 FPS
- **Face Enhancer**: Enable/Disable
- **Cache**: Enable/Disable

---

## 🛠️ Development

### Project Structure

```
deep-live-cam-chrome/
├── chrome-extension/     # Main extension code
│   ├── manifest.json     # Extension manifest
│   ├── service-worker.js # Background service
│   ├── popup.js          # Popup UI logic
│   ├── popup.html        # Popup interface
│   ├── face-swap.html    # Face swap page
│   ├── face-swap-engine.js # Face swap logic
│   ├── content-script.js # Site injection
│   └── icons/            # Extension icons
├── build/                # Build scripts
├── .github/              # GitHub workflows
│   └── workflows/        # CI/CD pipelines
└── tests/                # Test files
```

### Build from Source

```bash
# Clone the repo
git clone https://github.com/yjdudeplz-web/deep-live-cam-chrome.git
cd deep-live-cam-chrome

# Run build script
bash build/build-extension.sh

# Output: build/*.zip
```

### GitHub Actions

The project uses automated workflows for:
- 🧪 **Testing** - Lint, validate, browser tests
- 📦 **Building** - Auto-build Lite/Mini versions
- 🚀 **Releasing** - Auto-create GitHub releases
- 🧹 **Maintenance** - Stale cleanup, label sync

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Commit Format

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chrome-extension): add new feature
fix(popup): resolve bug
docs(readme): update documentation
refactor(engine): improve code
test(face-swap): add tests
chore(deps): update dependencies
```

---

## 📋 Automation & Integrations

This project includes comprehensive automation:

| Workflow | Purpose | Trigger |
|----------|---------|---------|
| `ci.yml` | Main CI pipeline | Every push |
| `extension-tests.yml` | Extension tests | Every push |
| `build-release.yml` | Build & release | On tag/ dispatch |
| `stale.yml` | Close inactive issues | Daily |
| `auto-label.yml` | Label PRs/Issues | On open |
| `welcome.yml` | Greet contributors | On first PR |
| `release-drafter.yml` | Draft release notes | Every PR |
| `pr-stats.yml` | PR statistics | On PR activity |
| `commit-lint.yml` | Lint commits | Every push |
| `cleanup.yml` | Maintenance | Daily |

---

## 📊 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1.6 | 2026-07-21 | Add Lite/Mini versions |
| 2.1.5 | Earlier | Previous release |

See [releases](https://github.com/yjdudeplz-web/deep-live-cam-chrome/releases) for full changelog.

---

## ⚠️ Disclaimer

This software is provided for educational and entertainment purposes only. Users are responsible for ensuring compliance with applicable laws and platform terms of service. The developers assume no liability for misuse.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Made with ❤️ for Chrome OS users
</p>
