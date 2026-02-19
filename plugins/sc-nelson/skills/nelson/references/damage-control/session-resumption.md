# Session Resumption: Picking Up Mid-Mission

Use when a session is interrupted (context limit, crash, timeout) and work must continue.

1. Read `.agent-history/nelson/<slug>/mission-state.json` to identify the current phase and mission parameters.
2. Read the latest `.agent-history/nelson/<slug>/quarterdeck-NNN.md` for last known state.
3. Run `TaskList()` to get current task statuses: `pending`, `in_progress`, `completed`.
4. Check `.worktrees/` for active worktrees from the mission:
   - For each worktree listed in `mission-state.json` `worktrees` field, verify the directory exists.
   - Run `git status` in each existing worktree to check for uncommitted work.
   - If a worktree has uncommitted changes, decide: commit partial work and resume, or discard and re-create.
   - If a worktree directory is missing but listed in state, re-create it from the branch (the branch still exists in git).
5. For each `in_progress` task, verify partial outputs against the task deliverable.
6. Discard any unverified or incomplete outputs that cannot be confirmed correct.
7. Re-issue sailing orders from `.agent-history/nelson/<slug>/sailing-orders.md` with updated scope reflecting completed work.
8. Re-form the squadron at the minimum size needed for remaining tasks.
9. Resume quarterdeck rhythm from the next scheduled checkpoint.
