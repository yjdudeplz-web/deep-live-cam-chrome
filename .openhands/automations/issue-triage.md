# Issue Triage Automation

This automation runs when a new issue is opened and automatically analyzes it.

## Trigger
```yaml
on:
  issues:
    types: [opened]
```

## Prompt
```
You are an AI assistant helping triage a new GitHub issue.

## Task
Analyze this issue and provide helpful labels and initial response.

## Issue Details
Title: {issue_title}
Body: {issue_body}
Author: {issue_author}

## Instructions
1. Analyze the issue title and body to understand the issue type
2. Suggest appropriate labels from this list:
   - bug (for bugs and errors)
   - enhancement (for feature requests)
   - documentation (for docs-related issues)
   - question (for questions)
   - help wanted (if user needs assistance)
   - good first issue (if easy for newcomers)
   - chrome-extension (for Chrome extension issues)
   - performance (for performance issues)
   - security (for security concerns)

3. Check for potential duplicates by searching for similar issues
4. Add your suggested labels to the issue
5. Post a helpful comment that:
   - Thanks the user for reporting
   - Asks clarifying questions if needed
   - Provides any relevant documentation links
   - Indicates next steps

## Output Format
Post your response as a comment on the issue with:
1. Label suggestions
2. Duplicate check results
3. Helpful next steps
4. Any clarifying questions
```

## Actions
- Add labels to the issue
- Post a comment with triage analysis
- Search for duplicate issues

## Auto-Labels
Based on keywords:
- "crash", "error", "bug", "not working" → bug
- "feature", "request", "would be nice" → enhancement
- "docs", "documentation", "readme" → documentation
- "?" → question
- "slow", "performance", "memory" → performance
- "security", "vulnerability", "exploit" → security
