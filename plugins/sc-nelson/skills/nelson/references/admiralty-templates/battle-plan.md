# Battle Plan Template

```text
Task ID:
- Name:
- Owner:
- Ship (if crewed):
- Crew manifest (if crewed):
- Deliverable:
- Dependencies:
- Station tier (0-3):
- File ownership (if code):
- Validation required:
- Rollback note required: yes/no
```

## TaskCreate Mapping

Each task in the battle plan becomes a TaskCreate call:

```
TaskCreate(
  subject:     "<Task Name>"
  description: "Owner: <captain>\nShip: <ship>\nDeliverable: <what>\nStation: <tier>\nFiles: <ownership>\nValidation: <required>"
  activeForm:  "<present-continuous description>"
)

Then wire dependencies:
  TaskUpdate(taskId=<id>, addBlockedBy=[<dep-ids>])
  TaskUpdate(taskId=<id>, owner="hms-<ship>")
```
