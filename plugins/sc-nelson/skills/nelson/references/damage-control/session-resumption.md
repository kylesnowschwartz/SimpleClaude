# Session Resumption: Picking Up Mid-Mission

Use when a session is interrupted (context limit, crash, timeout) and work must continue.

1. Read `.agent-history/nelson/<slug>/mission-state.json` to identify the current phase and mission parameters.
2. Read the latest `.agent-history/nelson/<slug>/quarterdeck-NNN.md` for last known state.
3. Run `TaskList()` to get current task statuses: `pending`, `in_progress`, `completed`.
4. For each `in_progress` task, verify partial outputs against the task deliverable.
5. Discard any unverified or incomplete outputs that cannot be confirmed correct.
6. Re-issue sailing orders from `.agent-history/nelson/<slug>/sailing-orders.md` with updated scope reflecting completed work.
7. Re-form the squadron at the minimum size needed for remaining tasks.
8. Resume quarterdeck rhythm from the next scheduled checkpoint.
