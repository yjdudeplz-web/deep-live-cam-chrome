# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.1.x   | :white_check_mark: |
| < 2.1   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue
2. Email the maintainers directly or use GitHub's private vulnerability reporting
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- Acknowledgment within 48 hours
- Regular updates on progress
- Credit in the security advisory (if desired)

## Security Best Practices

### For Users

- Only install from official sources
- Review permissions before installing
- Keep Chrome and extensions updated
- Report suspicious behavior

### For Developers

- Follow Chrome Web Store policies
- Use minimal permissions
- Validate all inputs
- Sanitize outputs
- Use Content Security Policy

## Permissions Used

| Permission | Purpose | Required |
|------------|---------|----------|
| activeTab | Access current tab | Yes |
| storage | Save settings locally | Yes |
| downloads | Save AI models | Yes |
| videoCapture | Camera access | Yes |
| scripting | Inject into pages | Yes |
| tabs | Tab management | Yes |

## Data Handling

- All processing happens locally
- No data sent to external servers
- Models stored locally in extension
- Settings stored in Chrome storage

## Known Limitations

- Extension context can be invalidated
- Service worker may be terminated
- Camera access requires user permission
- Some sites may block content scripts
