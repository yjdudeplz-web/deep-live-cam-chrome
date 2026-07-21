# Contributing to Deep-Live-Cam Chrome

Thank you for your interest in contributing!

## Ways to Contribute

- 🐛 Report bugs
- 💡 Suggest features
- 📖 Improve documentation
- 🔧 Submit code changes
- 🧪 Write tests

## Development Setup

```bash
# Clone the repo
git clone https://github.com/yjdudeplz-web/deep-live-cam-chrome.git
cd deep-live-cam-chrome

# Install dependencies
npm install

# Run tests
npm test

# Build extension
npm run build
```

## Project Structure

```
chrome-extension/
├── manifest.json       # Extension manifest
├── service-worker.js   # Background service
├── popup.js            # Popup UI
├── face-swap*.js       # Face swap engines
└── content-script.js   # Site injection
```

## Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Run `npm run lint` before committing

## Commit Messages

Follow Conventional Commits:

```
feat(chrome-extension): add new feature
fix(popup): resolve bug
docs(readme): update documentation
test(face-swap): add tests
chore(deps): update dependencies
```

## Pull Request Process

1. Fork the repo
2. Create a branch (`git checkout -b feature/amazing-feature`)
3. Make changes
4. Run tests
5. Commit with clear message
6. Push and create PR

## Testing

- Write tests for new features
- Ensure existing tests pass
- Test manually on Chrome

## Code Review

- Be responsive to feedback
- Make requested changes
- Keep PRs focused

## Questions?

Open an issue for discussion!
