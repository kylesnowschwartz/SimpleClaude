---
name: sc-worktrees
description: "Manage Git worktrees for parallel development sessions"
argument-hint: "[optional] worktree command (list, create, remove, prune)"
---

# sc-worktrees: Git Worktrees for Claude Code Sessions

Git worktrees let you work on multiple branches simultaneously in separate directories. Claude Code has native worktree support for simple isolation, plus manual worktree management for advanced multi-session workflows.

## Native Worktree Support (v2.1.49+)

**Start a session in an isolated worktree:**

```bash
claude --worktree        # or claude -w
```

This creates a worktree in `.claude/worktrees/`, branches from HEAD, and prompts to keep or delete on exit. Good for quick isolation where you don't need to coordinate multiple sessions.

**Mid-session isolation:** Ask Claude to "work in a worktree" and it'll use the `EnterWorktree` tool to create one on the fly.

**Subagent isolation:** Agent definitions can use `isolation: "worktree"` in frontmatter to give each subagent its own temporary worktree. The worktree is cleaned up when the agent finishes.

```yaml
---
name: my-isolated-agent
isolation: worktree
---
```

**Background agents:** Agent definitions support `background: true` to always run as a background task. Combine with `isolation: worktree` for fully isolated parallel agents.

```yaml
---
name: my-background-agent
background: true
isolation: worktree
---
```

**Kill background agents:** `Ctrl+F` (press twice within 3 seconds) kills all running background agents.

## Manual Worktrees (Multi-Session / Merge Workflows)

Native worktree support creates temporary worktrees that get cleaned up automatically. For workflows that need persistent worktrees (parallel development across terminals, merge consolidation, code review), manage them manually.

**Create a new worktree:**

```bash
git worktree add tree/feature-name -b feature-name
cd tree/feature-name
claude
```

**Create worktree for existing branch:**

```bash
git worktree add tree/existing-branch existing-branch
cd tree/existing-branch
claude
```

### Essential Commands

**List all worktrees:**

```bash
git worktree list
```

**Remove finished worktree:**

```bash
git worktree remove tree/feature-name
git branch -d feature-name  # optional: delete branch
```

**Clean up stale references:**

```bash
git worktree prune
```

### Directory Structure

```
YourProject/
├── .git/
├── src/
├── .gitignore          # add: /tree/
└── tree/
    ├── feature-auth/
    └── hotfix-123/
```

### Usage Examples

**Parallel development:**

- Terminal 1: `cd ~/project && claude` (main)
- Terminal 2: `cd ~/project/tree/feature && claude` (feature)
- Terminal 3: `cd ~/project/tree/hotfix && claude` (urgent fix)

**Code review:**

```bash
git worktree add tree/review -b review/pr-123
cd tree/review
git pull origin pull/123/head
claude
```

### Setup Notes

1. Add `/tree/` to `.gitignore`
2. Run `npm install` (or equivalent) in each new worktree
3. Each worktree maintains separate Claude Code context
4. All worktrees share the same `.git` database

## When to Use What

| Scenario | Approach |
|---|---|
| Quick feature isolation | `claude -w` |
| Mid-session isolation | Ask Claude to use a worktree |
| Isolated subagent work (no merge needed) | `isolation: worktree` in agent frontmatter |
| Parallel terminal sessions | Manual worktrees in `tree/` |
| Multi-agent merge workflow | `/parallel-worktree-team` |

**If no $ARGUMENTS are provided** Instruct the user on how to create and verify worktrees, starting with native support for simple cases and manual management for advanced use.

**If $ARGUMENTS are provided** Help the user fulfill their request asking any necessary clarifying questions

${ARGUMENTS}
