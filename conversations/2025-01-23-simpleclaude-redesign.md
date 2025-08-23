# SimpleClaude 2.0 Command Redesign

**Date**: January 23, 2025
**Context**: Redesigning SimpleClaude's 5 core commands to better match evolving usage patterns
**Outcome**: New 4+1 command structure proposal

## Problem Analysis

Kyle identified overlap issues in the current 5-command structure:
- `sc-modify` and `sc-fix` are too similar (both modify code)
- `sc-create` overlaps with `sc-modify` (creating is a form of modification)
- Commands lack planning/priming phases that have proven important
- Need for todo/document lifecycle management without creating clutter

## Design Philosophy Evolution

### From: Task-Based Commands
- sc-create (new features)
- sc-modify (changes)
- sc-fix (bug fixes)
- sc-understand (analysis)
- sc-review (quality)

### To: Intent-Based Commands
Commands that understand user intent and orchestrate appropriate agents intelligently.

## SimpleClaude 2.0 Proposal

### The Simple Four (ad-hoc, lightweight)

1. **`sc-plan`** - "I need to think through something"
   - Analyzes codebase/requirements
   - Creates actionable roadmaps
   - Manages todo lifecycle (ephemeral by default)
   - Auto-primes context for next steps

2. **`sc-work`** - "I need to build/fix/modify something"
   - Takes plan or direct request
   - Spawns appropriate agents (create, modify, fix, test)
   - Manages implementation tracking
   - Auto-runs validation (lint, test, build)

3. **`sc-explore`** - "I need to understand something"
   - Research and analysis
   - Domain understanding
   - Codebase navigation
   - Synthesizes findings

4. **`sc-review`** - "I need to verify quality/security/performance"
   - Comprehensive analysis
   - Security scanning
   - Performance profiling
   - Architecture assessment

### The Structured One (methodical, stateful)

5. **`sc-workflow`** - "I need structured, resumable task execution"
   - Complete lifecycle: INIT → SELECT → REFINE → IMPLEMENT → COMMIT
   - Persistent artifacts: todos/, work/, done/ directories
   - Resumable tasks with PID tracking
   - Maintains project-description.md
   - Structured checkpoints with user confirmation
   - Single-commit discipline for clean git history

## Key Insights

### Simplicity Redefined
- Fewer commands to remember
- Commands lean on LLM's ability to understand intent
- Agents handle specialized tasks (testing is just another agent task)
- Minimal manual cleanup required

### The Balance
- **Simple commands**: "Just do it" mentality for quick tasks
- **Workflow command**: "Do it right with tracking" for enterprise/complex work

### Architecture Benefits
- Commands auto-detect when to use specialized agents (test-runner, etc.)
- Each command can spawn multiple specialized agents in parallel
- Context flows between commands naturally
- Artifacts are session-scoped by default with option to persist

## Implementation Considerations

- All commands must update consistently across the codebase
- .claude/ remains the source directory for commands and agents
- Maintain token efficiency through isolated agent contexts
- Follow existing architectural patterns from v0.5.0

## Next Steps

1. Prototype the new command structure
2. Test intent recognition accuracy
3. Ensure backward compatibility or migration path
4. Update documentation and examples
5. Consider versioning this as SimpleClaude 1.0.0 (breaking changes)

---

*This design session represents a significant evolution in SimpleClaude's philosophy, moving from task-based to intent-based commands while maintaining the core principle of simplicity.*
