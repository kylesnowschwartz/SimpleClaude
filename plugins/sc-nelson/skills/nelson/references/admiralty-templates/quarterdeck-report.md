# Quarterdeck Report Template

Progress tracking maps directly to `TaskList()` output — use it to populate the pending/in_progress/completed counts below.

```text
Checkpoint time:

Progress:
- pending:
- in_progress:
- completed:

Blockers:
- blocker:
  owner:
  next action:
  eta:

Budget:
- token/time spent:
- token/time remaining:

Risk updates:
- new/changed risks:
- mitigation:

Signal flag (if any):
- recognition:

Admiral decision:
- continue / rescope / stop:
- rationale:
```

Write each checkpoint report to `.agent-history/nelson/<slug>/quarterdeck-NNN.md` (zero-padded, incrementing).
