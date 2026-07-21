# Contributing to Deep-Live-Cam Chrome Edition 🛠️

Thank you for your interest in contributing! 🎉

## 📋 Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit pull requests
- ⭐ Star the repo

## 🚀 Quick Start

```bash
# Fork the repo
git clone https://github.com/yjdudeplz-web/deep-live-cam-chrome.git
cd deep-live-cam-chrome

# Create a branch
git checkout -b feature/your-feature-name

# Make changes and commit
git commit -m "feat: add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

## 📝 Pull Request Guidelines

1. **Branch naming**: 
   - `feature/` for new features
   - `fix/` for bug fixes
   - `docs/` for documentation
   - `chore/` for maintenance

2. **Commit messages**: Use [Conventional Commits](https://www.conventionalcommits.org/)

3. **PR Description**: Fill out the PR template

4. **Testing**: Ensure changes work correctly

## 🧪 Testing

Before submitting:
- [ ] Test extension loads in Chrome
- [ ] Test face swap functionality
- [ ] No console errors

## 📦 Version Structure

| Version | Use Case |
|---------|----------|
| Lite | Low-end devices, no model download |
| Mini | Full features, ONNX models (~250MB) |

---

## Collaboration Guidelines and Codebase Quality Standards

To ensure smooth collaboration and maintain the high quality of our codebase, please adhere to the following guidelines:

## Branching Strategy

*   **`premain`**:
    *   Always push your changes to the `premain` branch initially.
    *   This safeguards the `main` branch from unintentional disruptions.
    *   All tests will be performed on the `premain` branch.
    *   Changes will only be merged into `main` after several hours or days of rigorous testing.
*   **`experimental`**:
    *   For large or potentially disruptive changes, use the `experimental` branch.
    *   This allows for thorough discussion and review before considering a merge into `main`.

## Pre-Pull Request Checklist

Before creating a Pull Request (PR), ensure you have completed the following tests:

### Functionality

*   **Realtime Faceswap**:
    *   Test with face enhancer **enabled** and **disabled**.
*   **Map Faces**:
    *   Test with both options (**enabled** and **disabled**).
*   **Camera Listing**:
    *   Verify that all cameras are listed accurately.

### Stability

*   **Realtime FPS**:
    *   Confirm that there is no drop in real-time frames per second (FPS).
*   **Boot Time**:
    *   Changes should not negatively impact the boot time of either the application or the real-time faceswap feature.
*   **GPU Overloading**:
    *   Test for a minimum of 15 minutes to guarantee no GPU overloading, which could lead to crashes.
*   **App Performance**:
    *   The application should remain responsive and not exhibit any lag.
