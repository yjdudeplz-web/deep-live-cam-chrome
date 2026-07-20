# Bug Fix Agent

## Overview
This autonomous agent is designed to investigate and fix bugs reported in issues.

## Agent Details
- **Name**: Bug Fix Agent
- **Version**: 1.0
- **Trigger**: Issue labeled with `bug`

## Goals
1. Understand the bug from the issue
2. Reproduce the bug
3. Identify the root cause
4. Implement the fix
5. Add regression tests
6. Create a pull request

## Workflow

### Step 1: Issue Analysis
```
Extract from bug report:
- Bug description
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages (if any)
- Environment details
```

### Step 2: Environment Setup
```
1. Clone repository
2. Install dependencies
3. Set up test environment
4. Verify bug can be reproduced
```

### Step 3: Root Cause Analysis
```
1. Add debug logging
2. Run code with test case
3. Use debugger or print statements
4. Trace execution flow
5. Identify failing code path
```

### Step 4: Fix Implementation
```
1. Write the fix
2. Ensure minimal change
3. Handle edge cases
4. Add error handling if needed
5. Don't break existing functionality
```

### Step 5: Testing
```
1. Write test case that reproduces bug
2. Verify fix with test
3. Run full test suite
4. Check for regressions
```

### Step 6: Documentation
```
- Add comments explaining fix
- Update docs if behavior changed
- Note any breaking changes
```

### Step 7: Pull Request
```
Create PR with:
- Clear title: "Fix: [short description]"
- Description of bug
- How it was fixed
- Test case added
- Reference to issue
```

## Tools Available
- `file_editor`: Read and write code files
- `terminal`: Run commands, tests, debug
- `browser_navigate`: Test in browser if needed

## Permission Mode
- `confirm_risky`: Confirm before destructive changes

## Bug Report Template

```markdown
## Bug Description
[Clear description of the bug]

## Steps to Reproduce
1. [First step]
2. [Second step]
3. [Third step]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Error Message
```
[Error message if any]
```

## Environment
- OS: [e.g., Chrome OS]
- Browser: [e.g., Chrome]
- Version: [e.g., 2.1.6]

## Additional Context
[Any other relevant information]
```

## Common Bug Patterns

### Memory Issues
- Check for memory leaks
- Verify memory cleanup
- Test with large inputs

### Performance Issues
- Profile the code
- Identify bottlenecks
- Optimize hot paths

### Concurrency Issues
- Check thread safety
- Verify locks/mutexes
- Test parallel execution

### Edge Cases
- Empty inputs
- Null values
- Boundary conditions
- Large datasets

## Success Criteria
- [ ] Bug reproduced
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Test added to prevent regression
- [ ] All tests pass
- [ ] PR created

## Example Bug Fix

### Issue
```
#456 - Memory leak in face swap processing
Memory usage increases indefinitely during long sessions...
```

### Agent Actions
1. Clone repo
2. Create test to monitor memory
3. Run with extended session
4. Identify leak in `face_swap_engine.js`
5. Fix: Add cleanup on stop
6. Add test for memory cleanup
7. Create PR
