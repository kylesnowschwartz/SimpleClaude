# sc-worktrees: Help users understand and implement git-worktrees for parallel Claude Code sessions.

**Educational Purpose**: Git-worktrees allow running multiple Claude Code sessions simultaneously with complete context isolation - perfect for parallel development without losing work context

## Git-Worktrees Overview (From Anthropic Documentation)

**Source**: https://docs.anthropic.com/en/docs/claude-code/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees

Git worktrees allow checking out multiple branches from the same repository into separate directories. Each worktree has an isolated working directory while sharing the same Git history. This enables:

- Parallel work on multiple tasks simultaneously
- Complete code isolation between Claude Code instances
- No interference between different development contexts
- Preserved context when switching between tasks

## Implementation Instructions

**If user provides no arguments**: Display current worktree status and educational overview.

**If user provides arguments**: Follow these steps based on their request:

### 1. Repository Assessment

Check current repository state:

```bash
git status --porcelain        # Verify clean working directory
git worktree list            # Show existing worktrees
claude --version             # Verify Claude Code available
```

### 2. Create Worktrees Based on Request

**For new feature development:**

```bash
git worktree add ../project-feature-name -b feature-name
cd ../project-feature-name
# Reinitialize dependencies
npm install  # or pip install -r requirements.txt, etc.
claude
```

**For existing branch:**

```bash
git worktree add ../project-existing-branch existing-branch
cd ../project-existing-branch
# Setup development environment
claude
```

**For code review:**

```bash
git worktree add ../project-review -b review/pr-123
cd ../project-review
git pull origin pull/123/head
claude
```

### 3. Validate Setup

Confirm everything works:

- Navigate to new worktree directory
- Verify Claude Code starts successfully
- Test basic operations (file editing, git commands)
- Demonstrate parallel session capability

## Common Usage Patterns

**Parallel Development:**

- Main work continues in original directory
- Bug fixes or features developed in separate worktrees
- Each Claude session maintains independent context

**Experimental Work:**

- Create worktree for risky changes
- If successful: merge back to main
- If failed: simply remove worktree without affecting main work

**Long-running Features:**

- Keep feature development in dedicated worktree
- Switch between tasks without losing context
- Merge when feature complete

## Management Commands

**List all worktrees:**

```bash
git worktree list
```

**Remove completed worktree:**

```bash
git worktree remove ../project-feature-completed
git branch -d feature-completed  # Clean up branch if desired
```

**Clean up stale references:**

```bash
git worktree prune
```

## Best Practices

1. **Naming**: Use descriptive directory names like `../project-feature-auth`
2. **Organization**: Keep worktrees in parallel structure to main repo
3. **Dependencies**: Run `npm install` or equivalent in each new worktree
4. **Cleanup**: Remove worktrees when features are complete
5. **Git Database**: All worktrees share the same `.git` database (space efficient)

## Benefits for Claude Code Users

**Context Preservation**: Each worktree maintains its own Claude Code context and conversation history.

**Parallel Sessions**: Work on multiple tasks simultaneously:

- Terminal 1: `cd ~/project && claude` (main development)
- Terminal 2: `cd ../project-feature-a && claude` (feature work)
- Terminal 3: `cd ../project-hotfix && claude` (urgent fixes)

**No Context Loss**: Switch between tasks without losing your place or starting fresh conversations.

## Troubleshooting

**If worktree creation fails:**

- Ensure working directory is clean (`git status`)
- Check that branch name doesn't already exist
- Verify sufficient disk space

**If Claude Code doesn't work in worktree:**

- Confirm Claude Code is in PATH: `claude --version`
- Check file permissions in worktree directory
- Verify git operations work: `git status`

Remember: Git worktrees share history but isolate working directories - perfect for parallel Claude Code development!

${ARGUMENTS}
