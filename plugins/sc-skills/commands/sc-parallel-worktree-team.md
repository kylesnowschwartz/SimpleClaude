---
name: sc-parallel-worktree-team
description: Parallelize work across agent teams using git worktrees and tmux
argument-hint: "[description of work to parallelize]"
---

# Parallel Worktree Team

Analyze the requested work by entering Plan Mode, then decompose it into parallelizable streams, then execute them simultaneously using git worktrees for isolation and Agent Teams within Tmux for coordination.

## Prerequisites

Agent Teams is an experimental feature. The user's session must have been started with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set in the environment, otherwise `TeamCreate`, `SendMessage`, and team-aware `Agent` spawning will be unavailable. If team tools fail with "tool not found", stop and tell the user to relaunch Claude Code with that env var.

## Input

$ARGUMENTS

## Phase 1: Analyze and Decompose

Produce a **decomposition artifact** that Phase 2 and Phase 5 consume mechanically. Do this work inside Plan Mode so the user approves the artifact before any worktree or team is created.

### Step 1: Read project context

1. Read the project's CLAUDE.md for conventions, the build/check/test/lint commands, and commit rules.
2. Explore the codebase enough to know — for each candidate stream — the exact paths that will be created or modified.

### Step 2: Classify every cross-stream dependency

For every pair of streams where one references the other, classify the dependency as exactly one of the following types. The type determines merge ordering in Phase 5 and the `blocked_by` wiring in Phase 2.

- **type/interface** — Stream B imports types, interfaces, or generated bindings that Stream A defines (or vice versa). A must merge before B.
- **data/file-write** — Stream B reads files that Stream A writes (fixtures, schemas, generated assets, migrations). A must merge before B.
- **build/compile** — Stream B's build, bundler, or compiler resolves symbols exported by Stream A. A must merge before B.
- **test-only** — Stream B's tests reference Stream A's public API but Stream B's production code does not. Either order is acceptable **only if** the test fixtures are isolated to B's stream; otherwise treat as type/interface and sequence A first.
- **none** — Stream is foundational; no cross-stream dependency.

### Step 3: Apply overlap-detection rules

Apply these rules literally. They are not heuristics.

1. **Two streams overlap if they modify the same file.**
2. **Overlap is acceptable only when one stream is strictly additive** — append-only changes such as adding new exports, new test cases, or new entries to a registry — and the other stream does not also rewrite the additive region.
3. **Otherwise, overlapping streams MUST take one of three remediations:**
   - sequence them via `blocked_by` (one merges first),
   - merge them into a single stream, or
   - split the shared surface into a foundational stream that both depend on and that merges first.
4. **Streams that touch shared symbols** (types, constants, interfaces, public exports) **in non-additive ways MUST NOT run in parallel.** Promote the shared surface into a foundational stream.

### Step 4: Emit the decomposition artifact

For each stream (target 2-4 streams), emit one fenced yaml block with exactly these fields:

```yaml
- name: <short-name>                      # used for branch and worktree naming; kebab-case
  files_modified: [<path>, <path>]        # files this stream edits in place
  files_created: [<path>]                 # files this stream creates from scratch
  blocked_by: [<stream-name>, ...]        # other stream names that must merge first; [] if foundational
  dependency_type: type/interface | data/file-write | build/compile | test-only | none
  deliverables: <one line describing what ships from this stream>
  verify_cmd: <the project's check/test/lint command scoped to this stream>
```

Rules for the artifact:

- `blocked_by` entries reference other `name` values from this same artifact — never task IDs (those don't exist yet) and never file paths.
- If `blocked_by` is non-empty, `dependency_type` MUST be one of the non-`none` types and MUST justify the ordering (e.g. `type/interface` is why A blocks B).
- If `blocked_by` is `[]`, `dependency_type` MUST be `none`.
- Every file in `files_modified` and `files_created` is owned by exactly one stream unless overlap is justified per Step 3 rule #2.

### Step 5: Present for approval

Present the full set of yaml blocks to the user inside the plan. Do not exit Plan Mode and do not proceed to Phase 2 until the user approves the decomposition.

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

Call the `TeamCreate` tool with `team_name: <descriptive-name>` (required) and `description: <what we're doing>`. With `teammateMode: "tmux"` configured in the user's settings, each spawned agent gets its own tmux pane for live visibility.

### Create tasks from the decomposition artifact

Walk the Phase 1 artifact in order. For each stream entry:

1. Call `TaskCreate` with `subject` set to the stream `name` and `description` set to its `deliverables` (both required). Record the returned task ID against the stream `name` so you can resolve names to IDs in the next step.
2. After every stream has a task ID, walk the artifact a second time. For each stream entry whose `blocked_by` list is non-empty, call `TaskUpdate` with `taskId` set to that stream's task ID and `addBlockedBy` set to the list of task IDs that its `blocked_by` stream names resolve to. (`TaskCreate` does not accept `addBlockedBy` — dependencies must be added after creation.)
3. Create one consolidation task via `TaskCreate`, then call `TaskUpdate` on it with `addBlockedBy` set to every stream task ID.
4. After spawning each teammate in Phase 3, assign its task by calling `TaskUpdate` with `taskId` set to the stream's task ID and `owner` set to the teammate's name so the task list reflects who is working on what.

## Phase 3: Spawn Agents

For each stream, call the `Agent` tool with these parameters using their exact schema names:

- `description`: a short label for the stream's work (required)
- `prompt`: the detailed instructions string described below (required)
- `subagent_type`: `"general-purpose"`
- `name`: `<stream-name>-agent`
- `team_name`: `<team-name>` (the team created in Phase 2)
- `mode`: `"bypassPermissions"`
- `run_in_background`: `true`

Do NOT pass `isolation: "worktree"`. That parameter makes the Agent tool create its own temporary worktree on a separate branch — different from the named `.worktrees/<stream-name>/` branches this command provisions and merges in Phase 5. The agent's commits would land on the Agent-tool-managed branch (returned in the tool result but not tracked here), silently breaking Phase 5's merge. The agent must `cd` into the named worktree via its `prompt` (see deliverable #1 below).

Spawn all stream agents in a single assistant message so the `Agent` tool calls execute in parallel.

Each agent's `prompt` MUST include:

1. **Worktree path** — "All work happens in `/absolute/path/.worktrees/<stream-name>/`. `cd` into that directory first, then verify with `git rev-parse --show-toplevel` before starting."
2. **Specific deliverables** — exactly what to create, modify, extract
3. **Verification command** — the project's check/test/lint command to run in the worktree
4. **Commit rules:**
   - Use conventional commits (`feat:`, `refactor:`, `fix:`, `style:`, `test:`)
   - Stage selectively: `git add <file1> <file2>` — never `git add -A`
   - Commit messages in present tense, imperative mood
5. **Completion protocol** — mark task as completed, send summary to team-lead

## Phase 4: Monitor and Wait

- Agents notify the orchestrator on completion; consume those notification results directly. `TaskOutput` is deprecated — do NOT call it on agent tasks, and do NOT `Read` the agent's `.output` file (it is a symlink to the full sub-agent JSONL transcript and will overflow your context window).
- Do NOT duplicate work agents are doing.
- When an agent completes, shut it down. First, call `TaskUpdate` with `taskId` set to the agent's task ID and `status` set to `"completed"`. Then call `SendMessage` with `to` set to the agent's teammate name (not `recipient`) and `message` set to the object `{"type": "shutdown_request"}`. Because `message` is an object, `summary` is not required.
- **On failure:** Read the agent's output, assess whether the failure is isolated to that stream or affects others. Fix in the worktree or abort and replan — do not merge a broken stream.

## Phase 5: Consolidate

Merge in topological order of the `blocked_by` graph — streams whose `blocked_by` is `[]` merge first:

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

Clean up the team by calling the `TeamDelete` tool (no parameters — it auto-resolves the current session's team). `TeamDelete` fails if any teammates are still active, so confirm every agent was shut down in Phase 4 before this step.

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
