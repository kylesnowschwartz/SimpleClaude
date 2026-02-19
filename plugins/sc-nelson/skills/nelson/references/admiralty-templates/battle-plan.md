# Battle Plan Template

```text
Task ID:
- Name:
- Owner:
- Ship (if crewed):
- Worktree: .worktrees/<slug>-hms-<ship>
- Crew manifest (if crewed):
- Deliverable:
- Dependencies:
- Station tier (0-3):
- Validation required:
- Rollback note required: yes/no
```

## Merge Order

Add this section at the end of every multi-agent battle plan. Order branches topologically by task dependency — tasks with no blockers merge first.

```text
Merge order:
1. hms-<ship-1> (no dependencies)
2. hms-<ship-2> (after ship-1)
3. hms-<ship-3> (after ship-1 and ship-2)
```

## TaskCreate Mapping

Each task in the battle plan becomes a TaskCreate call:

```
TaskCreate(
  subject:     "<Task Name>"
  description: "Owner: <captain>\nShip: <ship>\nWorktree: .worktrees/<slug>-hms-<ship>\nDeliverable: <what>\nStation: <tier>\nValidation: <required>"
  activeForm:  "<present-continuous description>"
)

Then wire dependencies:
  TaskUpdate(taskId=<id>, addBlockedBy=[<dep-ids>])
  TaskUpdate(taskId=<id>, owner="hms-<ship>")
```
