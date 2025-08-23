# Create new command structure

**Status:** InProgress
**Agent PID:** 41190

## Original Todo

Create new command structure: Replace 5 overlapping commands (sc-create, sc-modify, sc-fix, sc-understand, sc-review) with 4 intent-based commands (sc-plan, sc-work, sc-explore, sc-review) + 1 structured command (sc-workflow)

## Description

Transform SimpleClaude from 5 overlapping task-based commands to a cleaner 4+1 intent-based architecture that better aligns with actual developer cognitive modes. This addresses current overlap issues where:

- `sc-modify` and `sc-fix` both modify code (fix is just modification with debugging focus)  
- `sc-create` and `sc-modify` overlap when creating features requires modifying existing code
- Users face intent confusion choosing between task-based commands

The new structure will be:
- **4 Simple Commands** (`sc-plan`, `sc-work`, `sc-explore`, `sc-review`): Intent-based "just do it" commands that understand user intent and orchestrate agents intelligently
- **1 Structured Command** (`sc-workflow`): Methodical "do it right with tracking" command for enterprise/complex work with INIT → SELECT → REFINE → IMPLEMENT → COMMIT lifecycle

This maintains the proven lightweight agent architecture and token efficiency from v0.5.0 while providing cleaner separation of concerns.

_Read [analysis.md](./analysis.md) in full for detailed codebase research and context_

## Implementation Plan

- [x] **Update TEMPLATE.md** (.claude/commands/simpleclaude/): Transform from task-based to intent-based approach, update examples to reflect new 4+1 philosophy with clear intent → agent orchestration patterns
- [ ] **Create sc-plan.md** (.claude/commands/simpleclaude/): Using updated template, implement "I need to think through something" command
- [ ] **Test sc-plan**: Verify command works with sample planning requests
- [ ] **Create sc-work.md** (.claude/commands/simpleclaude/): Using template, implement "I need to build/fix/modify something" command  
- [ ] **Test sc-work**: Verify command works with sample implementation requests
- [ ] **Create sc-explore.md** (.claude/commands/simpleclaude/): Using template, implement "I need to understand something" command
- [ ] **Test sc-explore**: Verify command works with sample research requests
- [ ] **Update sc-review.md** (.claude/commands/simpleclaude/): Using template, expand to "I need to verify quality/security/performance"
- [ ] **Test sc-review**: Verify updated command works with sample review requests
- [ ] **Create sc-workflow.md** (.claude/commands/simpleclaude/): Copy and adapt from extras/sc-structured-workflow.md
- [ ] **Test sc-workflow**: Verify structured workflow phases work correctly
- [ ] **Update VERSION and documentation**: Bump to 1.0.0, update CLAUDE.md, README.md after all commands are working
- [ ] **Remove old commands**: Delete sc-create.md, sc-modify.md, sc-fix.md, sc-understand.md only after new structure is fully tested

## Notes

[Implementation notes]
