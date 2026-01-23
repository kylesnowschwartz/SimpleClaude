---
name: sc-worktrees
description: "Manage Git worktrees for parallel development sessions"
argument-hint: "[optional] worktree command (list, create, remove, prune)"
---

# sc-worktrees: Git Worktrees for Parallel Claude Code Sessions

Git worktrees let you work on multiple branches simultaneously in separate directories. Perfect for parallel Claude Code sessions without losing context.

## Quick Start

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

## Essential Commands

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

## Directory Structure

```
YourProject/
├── .git/
├── src/
├── .gitignore          # add: /tree/
└── tree/
    ├── feature-auth/
    └── hotfix-123/
```

## Usage Examples

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

## Setup Notes

1. Add `/tree/` to `.gitignore`
2. Run `npm install` (or equivalent) in each new worktree
3. Each worktree maintains separate Claude Code context
4. All worktrees share the same `.git` database

**If no $ARGUMENTS are provided** Instruct the user on how to manually create and verify their own worktrees and worktree status

**If $ARGUMENTS are provided** Help the user fulfill their request asking any necessary clarifying questions

${ARGUMENTS}
