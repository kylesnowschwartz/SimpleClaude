# sc-hooks

SimpleClaude hooks for auto-formatting, lint checks, and tool monitoring.

## What it does

| Event | Handler | Behavior |
| --- | --- | --- |
| `Stop` | `AutoFormatHandler` | Formats the files Claude modified (git diff + untracked) before lint runs. Never blocks. |
| `Stop` | `LintCheckHandler` | Runs linters/type-checkers on the modified files and reports errors back so Claude can fix them. Has a retry guard to avoid infinite stop loops. |
| `PreToolUse` (`WebFetch`) | `GitHubUrlHandler` | When Claude WebFetches a github.com repo page, injects a soft hint (via `additionalContext`, no block) suggesting the equivalent `gh` CLI commands. The fetch still proceeds, so reserved site routes (`features`, `marketplace`, …) and raw URLs are never stranded. |

## Environment Variables

| Variable | Effect | Notes |
| --- | --- | --- |
| `RUBY_CLAUDE_HOOKS_DEBUG` | Print full error backtraces from hook entrypoints when a hook raises. | Debugging aid, not a feature flag. Any set value enables it. |

Transient (one Claude session):

```bash
RUBY_CLAUDE_HOOKS_DEBUG=1 claude
```

Persistent (every shell):

```bash
# In ~/.zshrc, ~/.bashrc, or your direnv .envrc
export RUBY_CLAUDE_HOOKS_DEBUG=1
```
