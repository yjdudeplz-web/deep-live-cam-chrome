# OpenHands Agents Index

This directory contains autonomous agents for the Deep-Live-Cam Chrome Edition project.

## Available Agents

### 1. Feature Developer Agent
- **File**: `feature-developer.md`
- **Purpose**: Implement features from GitHub issues
- **Trigger**: Issues labeled `feature-request` or `enhancement`
- **Actions**: Code implementation, tests, docs, PR creation

### 2. Bug Fix Agent
- **File**: `bug-fixer.md`
- **Purpose**: Investigate and fix bugs
- **Trigger**: Issues labeled `bug`
- **Actions**: Reproduce, analyze, fix, test, PR creation

### 3. Documentation Agent
- **File**: `documentation.md`
- **Purpose**: Keep docs up-to-date
- **Trigger**: PRs merged or code changes
- **Actions**: Update docs, verify links, improve clarity

## Agent Configuration

Agents are configured in `automations/config.json`:

```json
{
  "version": "1.0",
  "automations": [
    {
      "name": "Issue Triage",
      "file": "issue-triage.md",
      "enabled": true
    },
    {
      "name": "PR Review",
      "file": "pr-review.md",
      "enabled": true
    },
    {
      "name": "Weekly Maintenance",
      "file": "weekly-maintenance.md",
      "enabled": true
    }
  ]
}
```

## Usage

### Manual Invocation
Agents can be triggered manually via conversation or automation triggers.

### Automatic Triggers
- **Issue Triage**: Runs when new issue is opened
- **PR Review**: Runs when PR is labeled `needs-review`
- **Weekly Maintenance**: Runs every Monday at 9 AM UTC

## Agent Permissions

| Agent | file_editor | terminal | browser | git |
|-------|------------|----------|---------|-----|
| Feature Developer | ✅ | ✅ | ✅ | ✅ |
| Bug Fixer | ✅ | ✅ | ✅ | ✅ |
| Documentation | ✅ | ✅ | ✅ | ❌ |

## Best Practices

1. **Start Small**: Test agents on low-risk tasks first
2. **Review Output**: Always review agent-generated code/docs
3. **Monitor Performance**: Track success rates and adjust prompts
4. **Keep Updated**: Update agent prompts as project evolves
5. **Security**: Never grant agents write access to secrets

## Adding New Agents

1. Create agent file in this directory
2. Define goals, workflow, and tools
3. Add to `config.json`
4. Test on sample task
5. Deploy and monitor

## Support

For questions about agents, open an issue with the `agent` label.
