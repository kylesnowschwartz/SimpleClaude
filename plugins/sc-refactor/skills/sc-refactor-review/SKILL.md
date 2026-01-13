---
name: sc-refactor-review
description: This skill should be used when the user asks to review code, find dead code, check for duplication, simplify a codebase, find refactoring opportunities, do code cleanup, check naming consistency, or analyze test organization. Routes to specialized analysis agents based on the type of review requested.
triggers:
  - "review my code"
  - "find dead code"
  - "check for duplication"
  - "simplify this codebase"
  - "refactoring opportunities"
  - "code cleanup"
  - "naming consistency"
  - "test organization"
  - "codebase health"
---

# SC Refactor Review Skill

Guidance for routing review and refactoring requests to specialized agents.

## Routing Table

Match the user's request to the appropriate agents:

| User Intent | Agents to Spawn | Focus |
|-------------|-----------------|-------|
| "review", "check", "validate", "PR" | sc-code-reviewer + sc-structural-reviewer | Bugs, security, completeness |
| "health", "full", "comprehensive" | All 5 agents in parallel | Complete analysis |
| "dead code", "unused", "orphan" | sc-dead-code-detector | Unreferenced exports, orphan files |
| "duplicate", "DRY", "repeated" | sc-duplication-hunter | Copy-paste, structural, logic duplication |
| "simplify", "YAGNI", "over-engineer" | sc-abstraction-critic | Unnecessary complexity |
| "naming", "consistency", "convention" | sc-naming-auditor | Convention violations, semantic drift |
| "test organization", "test structure" | sc-test-organizer | Test file organization, missing tests |
| "structural", "complete", "cleanup" | sc-structural-reviewer | Change completeness, dependency hygiene |

## Agent Spawning

### Single Agent
```
Task(
  subagent_type: "sc-refactor:sc-[agent-name]",
  prompt: "Analyze [target] for [focus area]. Report findings with confidence scores."
)
```

### Multiple Agents (Parallel)
Spawn all relevant agents in a single message with `run_in_background: true`:
```
Task(subagent_type: "sc-refactor:sc-agent-1", run_in_background: true, prompt: "...")
Task(subagent_type: "sc-refactor:sc-agent-2", run_in_background: true, prompt: "...")
```

### Full Health Check (5 Agents)
```
Task(subagent_type: "sc-refactor:sc-duplication-hunter", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-abstraction-critic", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-naming-auditor", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-dead-code-detector", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-test-organizer", run_in_background: true, ...)
```

## Output Synthesis

After agents complete, synthesize findings:

```
## [Category] Analysis

### High Priority (confidence >= 90)
- [finding]: [description] ([file:line])

### Medium Priority (confidence 80-89)
- [finding]: [description] ([file:line])

### Recommendations
- [actionable next step]
```

## Available Agents

**sc-refactor plugin:**
- `sc-duplication-hunter` - Copy-paste, structural, logic duplication
- `sc-abstraction-critic` - YAGNI violations, over-engineering
- `sc-naming-auditor` - Convention violations, semantic drift
- `sc-dead-code-detector` - Unreferenced exports, orphan files
- `sc-test-organizer` - Test structure, missing tests
- `sc-structural-reviewer` - Change completeness, dependency hygiene

**simpleclaude-core plugin:**
- `sc-code-reviewer` - Bugs, security, CLAUDE.md compliance

## Manual Commands

Users can also invoke these workflows directly:
- `/sc-refactor:sc-production-review` - Functional + structural review
- `/sc-refactor:sc-codebase-health` - All 5 agents parallel
