# Standing Order: Split Keel

Plan merge order before captains begin work.

Each captain works in an isolated git worktree, so textual file conflicts during execution are eliminated. Semantic conflicts (interface changes, shared abstractions) can still occur — verification at consolidation catches these. The remaining tactical risk is merge order — merging in the wrong sequence creates unnecessary conflicts.

**Merge ordering rules:**
- Foundational changes (types, interfaces, shared utilities) merge first.
- Dependent changes (consumers of those interfaces) merge after their dependencies.
- If two ships will modify the same file heavily, plan them as sequential tasks (`blockedBy`) rather than parallel work.

**Symptoms of poor merge ordering:**
- Consolidation produces conflicts that could have been avoided by merging in dependency order.
- Admiral spends consolidation time resolving conflicts that stem from sequencing, not substance.

**Remedy:** Add a "Merge order" section to the battle plan. Order branches topologically by task dependency — tasks with no blockers merge first, then tasks that depended on them, and so on.
