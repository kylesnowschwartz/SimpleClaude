# sc-hooks

SimpleClaude hooks for session management, tool monitoring, plan review gating, and notifications.

## Environment Variables

All sc-hooks runtime flags are read from the process environment. **Any set value disables the feature; unset is the only way to leave the default behavior active.** sc-hooks does not parse `"true"` / `"false"` / `"0"` specially — `SOME_FLAG=0` and `SOME_FLAG=false` both still count as "set" and therefore disable.

| Variable | Effect | Notes |
| --- | --- | --- |
| `SIMPLE_CLAUDE_DISABLE_NOTIFICATIONS` | Suppress all macOS notifications from `NotificationHandler` (permission prompts, idle warnings, MCP input). | The hook still runs; it just no-ops. |
| `SIMPLE_CLAUDE_DISABLE_NOTIFICATION_SOUND` | Mute the "glass" sound on notifications, but still display them. | Independent of `~/.config/claude/sounds.conf`. |
| `SIMPLE_CLAUDE_DISABLE_SKILL_CHECK` | Skip the `<skill_check>` reminder block that `TriggerSkillsHandler` injects on every user prompt. | Use when the reminder is noisy for your workflow. |
| `RUBY_CLAUDE_HOOKS_DEBUG` | Print full error backtraces from hook entrypoints when a hook raises. | Debugging aid, not a feature flag. |

## Setting an env var

Transient (one Claude session):

```bash
SIMPLE_CLAUDE_DISABLE_SKILL_CHECK=1 claude
```

Persistent (every shell):

```bash
# In ~/.zshrc, ~/.bashrc, or your direnv .envrc
export SIMPLE_CLAUDE_DISABLE_SKILL_CHECK=1
```

To re-enable a feature, **unset** the variable — assigning `0` or `false` won't work:

```bash
unset SIMPLE_CLAUDE_DISABLE_SKILL_CHECK
```
