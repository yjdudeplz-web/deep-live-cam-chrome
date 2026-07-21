# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.6] - 2026-07-21

### Added
- **Lite/Mini Versions**: Two separate builds for different use cases
  - Lite: Built-in face-api.js, no model downloads needed
  - Mini: Full ONNX models for highest quality
- **Build Script**: Python build script (`build/build.py`) for creating releases
- **Comprehensive CI/CD**:
  - `extension-tests.yml`: Full test suite
  - `build-release.yml`: Auto-build on tags
  - `pr-stats.yml`: PR statistics
  - `commit-lint.yml`: Commit message validation
  - `cleanup.yml`: Repository maintenance
- **Accessibility Improvements**:
  - ARIA labels and roles
  - High contrast mode support
  - Reduced motion support
  - Focus indicators
- **CODEOWNERS file**: Auto-request reviews
- **Renovate config**: Auto-update dependencies

### Changed
- Improved manifest CSP (added jsdelivr.net, worker-src)
- Updated bug report template with Chrome-specific fields
- Enhanced CONTRIBUTING.md with quick start guide
- Added .gitignore for build artifacts

### Fixed
- Removed duplicate message handler in service-worker
- Fixed minimum Chrome version requirement

### Documentation
- Added comprehensive README
- Added quick start guides
- Added version comparison tables

## [2.1.5] - Earlier

### Previous Release
- See git history for earlier changes
