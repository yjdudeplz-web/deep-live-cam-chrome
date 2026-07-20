# Documentation Agent

## Overview
This autonomous agent is designed to keep documentation up-to-date with code changes.

## Agent Details
- **Name**: Documentation Agent
- **Version**: 1.0
- **Trigger**: PR merged or code changes detected

## Goals
1. Detect code changes that need docs updates
2. Update relevant documentation
3. Check for broken links
4. Improve clarity and examples
5. Maintain consistency

## Workflow

### Step 1: Change Detection
```
After code changes, identify:
- New files added
- Modified functions/APIs
- New features
- Configuration changes
- Breaking changes
```

### Step 2: Documentation Mapping
```
Map code changes to docs:
- README.md - Overview changes
- API changes → docs/API.md
- CLI changes → README usage section
- Module changes → module docstrings
- Config changes → configuration docs
```

### Step 3: Update Documentation
```
1. Update README with new features
2. Add API documentation
3. Update examples
4. Fix outdated info
5. Add troubleshooting tips
```

### Step 4: Link Verification
```
1. Check all links work
2. Verify images load
3. Check code examples run
```

### Step 5: Quality Check
```
- Check for typos
- Verify formatting
- Ensure consistency
- Add cross-references
```

## Documentation Structure

```
docs/
├── README.md           # Main documentation
├── INSTALLATION.md    # Installation guide
├── USAGE.md           # Usage instructions
├── API.md            # API reference
├── CHROME.md         # Chrome extension docs
├── CONTRIBUTING.md   # Contribution guide
└── TROUBLESHOOTING.md # Common issues
```

## Documentation Standards

### README.md
```
- Clear project description
- Quick start guide
- Features list
- Requirements
- Installation
- Basic usage
- Support info
```

### Code Comments
```
- Explain WHY not WHAT
- Document complex logic
- Include type hints
- Add JSDoc for JS
- Add docstrings for Python
```

### API Documentation
```
- Endpoint descriptions
- Parameter lists
- Return values
- Error codes
- Usage examples
```

## Update Checklist

### On New Feature
- [ ] Add to README features list
- [ ] Add usage example
- [ ] Update screenshots if needed
- [ ] Add troubleshooting entry

### On Bug Fix
- [ ] Update troubleshooting if new issue
- [ ] Add workaround if needed

### On API Change
- [ ] Update API docs
- [ ] Add migration guide if breaking
- [ ] Update examples

### On Config Change
- [ ] Update configuration docs
- [ ] Add new options
- [ ] Document defaults

## Tools Available
- `file_editor`: Read and write docs
- `terminal`: Run link checkers, spell check
- `browser_navigate`: Test links

## Success Criteria
- [ ] All changed code documented
- [ ] No broken links
- [ ] Examples work
- [ ] Consistent formatting
- [ ] PR created for updates

## Example Updates

### New Feature
```
Feature: Virtual camera for Safari

Update:
- README.md: Add Safari to supported browsers
- CHROME.md: Add Safari installation section
- TROUBLESHOOTING.md: Add Safari-specific tips
```

### New Module
```
Module: modules/video_analyzer.py

Update:
- README.md: Add to project structure
- API.md: Document class and methods
- Add docstrings to code
```
