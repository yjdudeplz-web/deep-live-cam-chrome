# Feature Development Agent

## Overview
This autonomous agent is designed to implement features from GitHub issues.

## Agent Details
- **Name**: Feature Developer Agent
- **Version**: 1.0
- **Trigger**: Issue labeled with `feature-request` or `enhancement`

## Goals
1. Understand the feature request from the issue
2. Plan the implementation approach
3. Write the code
4. Add/update tests
5. Update documentation
6. Create a pull request

## Workflow

### Step 1: Issue Analysis
```
Read the GitHub issue and extract:
- Feature description
- Expected behavior
- Acceptance criteria
- Any constraints or requirements
```

### Step 2: Code Exploration
```
Explore the codebase to understand:
- Project structure
- Related modules and files
- Existing patterns and conventions
- Test setup
```

### Step 3: Implementation Planning
```
Create a plan with:
1. Files to modify/create
2. Changes needed
3. Tests to add
4. Documentation to update
```

### Step 4: Implementation
```
Implement the feature following:
- Project coding conventions
- Type hints where applicable
- Error handling
- Logging
```

### Step 5: Testing
```
- Write unit tests
- Verify tests pass
- Check code coverage
```

### Step 6: Documentation
```
- Update relevant docs
- Add code comments
- Update README if needed
```

### Step 7: Pull Request
```
Create PR with:
- Clear title
- Description of changes
- Reference to issue
- Screenshots if UI changes
```

## Tools Available
- `file_editor`: Read and write code files
- `terminal`: Run commands, tests, linters
- `browser_navigate`: Browse documentation
- `git`: Version control

## Permission Mode
- `confirm_risky`: Confirm before destructive changes

## Example Usage

### Trigger Input
```
Issue: #123 - Add virtual camera support for Safari
Description: Implement virtual camera functionality for Safari browser...
```

### Agent Actions
1. Clone/fetch repo
2. Explore codebase
3. Implement feature in chrome-extension/ and modules/
4. Add tests in tests/
5. Update README-CHROME.md
6. Create PR

## Constraints
- Don't modify main branch directly
- Follow project's git workflow (create branch)
- Don't commit secrets or credentials
- Keep commits atomic and well-described

## Success Criteria
- [ ] Feature implemented as described
- [ ] Tests pass
- [ ] Code follows conventions
- [ ] Documentation updated
- [ ] PR created and linked to issue
