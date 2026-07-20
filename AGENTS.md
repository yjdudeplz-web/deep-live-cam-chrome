# Deep-Live-Cam Chrome Edition - Agent Memory

## Repository Info
- **GitHub**: https://github.com/yjdudeplz-web/deep-live-cam-chrome
- **Owner**: yjdudeplz-web
- **Main Branch**: main

## Project Overview
Deep-Live-Cam Chrome Edition is a fork of hacksider/Deep-Live-Cam optimized for:
- Chrome OS devices with NAND storage
- Low-end hardware (2-4GB RAM)
- Virtual camera support for video chat sites (Omegle, OmeTV, ChatRandom)

## Key Features
1. **Chrome Extension** (`chrome-extension/`) - Face swap with virtual camera
2. **Python Modules** - Chrome OS detection, memory optimization, NAND optimization
3. **Docker Support** - Crostini container deployment
4. **Troll Mode** - Direct buttons to open video chat sites

## Repository Structure

```
deep-live-cam-chrome/
├── chrome-extension/          # Chrome Extension
│   ├── manifest.json         # Extension config
│   ├── service-worker.js    # Background service (5-min tasks)
│   ├── content-script.js    # Injects into video chat sites
│   ├── face-swap.html       # Main face swap UI
│   ├── face-api-wrapper.js  # Face detection wrapper
│   ├── face-swap-engine.js  # Face swap engine
│   ├── face-swap-webgl.js  # WebGL renderer
│   └── popup.html/css/js    # Extension popup
├── modules/                  # Python modules
│   ├── chrome_os.py         # Chrome OS detection
│   ├── memory_optimize.py   # Memory management
│   ├── nand_optimize.py    # NAND optimizations
│   ├── adaptive_quality.py  # Auto quality settings
│   └── model_compress.py    # Model compression
├── .github/                  # GitHub workflows and templates
│   ├── workflows/           # CI/CD pipelines
│   │   ├── ci.yml          # Linting and tests
│   │   ├── test.yml        # Multi-platform testing
│   │   ├── docker.yml      # Docker builds
│   │   ├── security.yml    # Security scanning
│   │   ├── dependencies.yml # Dependency updates
│   │   ├── release.yml     # Release automation
│   │   └── ads.yml         # Ad revenue tracking
│   └── ISSUE_TEMPLATE/    # Issue templates
├── .openhands/              # OpenHands automations
│   ├── agents/              # Autonomous agents
│   │   ├── feature-developer.md
│   │   ├── bug-fixer.md
│   │   └── documentation.md
│   └── automations/         # Triggered automations
│       ├── issue-triage.md
│       ├── pr-review.md
│       └── weekly-maintenance.md
├── requirements-chrome.txt  # Chrome dependencies
├── Dockerfile.chrome        # Docker for Crostini
├── docker-compose.chrome.yml
└── README-CHROME.md       # Chrome-specific docs
```

## GitHub Actions Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Linting with ruff |
| `test.yml` | Push/PR | Multi-platform tests (Linux, macOS, Windows) |
| `docker.yml` | Push/Tags | Docker image build & publish |
| `security.yml` | Schedule | Vulnerability scanning, CodeQL |
| `dependencies.yml` | Weekly | Auto-update dependencies |
| `release.yml` | Tags | Create releases with changelog |
| `promote.yml` | Release | Social media announcements |

## OpenHands Automations

| Automation | Trigger | Purpose |
|------------|---------|---------|
| `issue-triage.md` | Issue opened | Auto-label and analyze issues |
| `pr-review.md` | PR labeled | Auto-review code changes |
| `weekly-maintenance.md` | Weekly cron | Repository health checks |

## Autonomous Agents

| Agent | Purpose | Trigger |
|-------|---------|---------|
| `feature-developer.md` | Implement features | Issue labeled `feature-request` |
| `bug-fixer.md` | Fix bugs | Issue labeled `bug` |
| `documentation.md` | Update docs | PR merged |

## Commands

### Chrome Extension
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select `chrome-extension/` folder

### Python (Crostini/Linux)
```bash
pip install -r requirements-chrome.txt
python run.py
```

### Docker
```bash
docker-compose -f docker-compose.chrome.yml up
```

## Key Technologies
- **Face Detection**: face-api.js (TensorFlow.js-based)
- **WebGL**: Hardware-accelerated rendering
- **Virtual Camera**: MediaStream API + tab capture
- **Background Tasks**: Chrome alarms (5-minute intervals)

## Important Notes
- Virtual camera works via `canvas.captureStream()` and content script interception
- Troll mode buttons open Omegle/OmeTV/ChatRandom with face swap active
- Service worker runs health checks and performance monitoring every 5 minutes
- Memory optimized for 2-4GB RAM Chrome devices
- NAND storage optimizations reduce random I/O

## Git Workflow
```bash
git checkout -b feature/your-feature
# make changes
git add -A
git commit -m "feat: description"
git push -u origin your-branch
# Create PR on GitHub
```

## CI/CD Pipeline
1. **Push**: Run linting and tests
2. **PR**: Multi-platform tests + security scan
3. **Merge**: Build Docker image + publish
4. **Release**: Generate changelog + publish release
