---
name: parallel-worktree-team
description: Parallelize work across agent teams using git worktrees and tmux
argument-hint: "[description of work to parallelize]"
---

# Parallel Worktree Team

Analyze the requested work by entering Plan Mode, then decompose it into parallelizable streams, then execute them simultaneously using git worktrees for isolation and Agent Teams within Tmux for coordination.

## Input

$ARGUMENTS

## Phase 1: Analyze and Decompose

1. Read the project's CLAUDE.md for conventions, build/check commands, and commit rules
2. Explore the codebase to understand what files each workstream will touch
3. Decompose the work into 2-4 independent streams that minimize file overlap
4. Identify dependencies between streams (which must merge first?)
5. Present the decomposition to the user for approval before proceeding

For each stream, define:
- A short name (used for branch and worktree naming)
- The specific deliverables
- Which files it will create or modify
- Verification criteria

## Phase 2: Set Up Infrastructure

### Create worktrees

One worktree per stream, branched from the current branch:

```bash
PARENT_BRANCH=$(git branch --show-current)
mkdir -p .worktrees
git worktree add .worktrees/<stream-name> $PARENT_BRANCH -b <stream-branch>
```

### Symlink dependencies

Each worktree needs access to installed packages:

eg. for npm projects:
```bash
ln -sf "$(pwd)/node_modules" ".worktrees/<stream-name>/node_modules"
```

Other language ecosystems require appropriate and equivalent package symlinking.

Also symlink any other shared directories the project needs (check CLAUDE.md for patterns).

### Create team

```
TeamCreate: team_name=<descriptive-name>, description=<what we're doing>
```

With `teammateMode: "tmux"` configured, each spawned agent gets its own tmux pane for live visibility.

### Create tasks with dependencies

One task per stream via TaskCreate. Set up blocking relationships:
- If stream B depends on stream A merging first, use `TaskUpdate` with `addBlockedBy`
- The consolidation task should be `blockedBy` all stream tasks

## Phase 3: Spawn Agents

Launch all agents in a single message (parallel tool calls):

```
Task:
  subagent_type: general-purpose
  name: <stream-name>-agent
  team_name: <team-name>
  mode: bypassPermissions
  run_in_background: true
  prompt: <detailed instructions>
```

Each agent prompt MUST include:

1. **Worktree path** — "All work happens in `/absolute/path/.worktrees/<name>/`. Verify with `git rev-parse --show-toplevel` before starting."
2. **Specific deliverables** — exactly what to create, modify, extract
3. **Verification command** — the project's check/test/lint command to run in the worktree
4. **Commit rules:**
   - Use conventional commits (`feat:`, `refactor:`, `fix:`, `style:`, `test:`)
   - Stage selectively: `git add <file1> <file2>` — never `git add -A`
   - Commit messages in present tense, imperative mood
5. **Completion protocol** — mark task as completed, send summary to team-lead

## Phase 4: Monitor and Wait

- Agents send messages when done — these arrive automatically
- Track progress via TaskList; use TaskOutput to read agent output if needed
- Do NOT duplicate work agents are doing
- When an agent completes, shut it down:
  ```
  TaskUpdate: taskId=<id>, status=completed
  SendMessage: type=shutdown_request, recipient=<agent-name>
  ```
- **On failure:** Read the agent's output, assess whether the failure is isolated to that stream or affects others. Fix in the worktree or abort and replan — do not merge a broken stream.

## Phase 5: Consolidate

Merge in topological order of the `blockedBy` graph — streams with no blockers merge first:

```bash
git checkout <parent-branch>

# Merge each stream branch in order
git merge <stream-1-branch> --no-edit
git merge <stream-2-branch> --no-edit
git merge <stream-3-branch> --no-edit
```

If merge conflicts occur:
1. Identify conflicting files
2. Resolve conflicts (the orchestrator understands both sides)
3. `git add <resolved-files> && git commit --no-edit`

After all merges, run the full verification suite.

## Phase 6: Clean Up

```bash
# Remove worktrees (warn on failure — don't swallow errors)
git worktree remove .worktrees/<stream-1>
git worktree remove .worktrees/<stream-2>
git worktree remove .worktrees/<stream-3>

# Delete stream branches (merged, no longer needed)
git branch -d <stream-1-branch> <stream-2-branch> <stream-3-branch>
```

Clean up the team: `TeamDelete`

## Principles

- **Minimize file overlap** between streams. If two streams must modify the same file, one should block the other or accept merge conflicts.
- **Agents own their commits.** The orchestrator only makes merge commits.
- **Merge order matters.** Foundational changes (types, interfaces, shared utilities) merge first. Dependent changes (consumers of those types) merge after.
- **Verify at every stage.** Each agent verifies in its worktree. Orchestrator verifies after each merge and after full consolidation.
- **Fail fast.** If an agent reports failures, investigate before merging anything.

## Success Criteria

- [ ] All stream branches pass verification independently
- [ ] All branches merged without unresolved conflicts
- [ ] Full verification passes on consolidated branch
- [ ] Worktrees and stream branches cleaned up
- [ ] Team deleted
