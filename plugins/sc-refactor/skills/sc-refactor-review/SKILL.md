---
name: sc-refactor-review
description: Use this skill when performing code review, refactoring analysis, or cleanup tasks. Routes to specialized agents based on review type. Requires context packet for focused analysis - will invoke context-wizard if none provided.
triggers:
  - "review my code"
  - "find dead code"
  - "check for duplication"
  - "simplify this codebase"
  - "refactoring opportunities"
  - "code cleanup"
  - "naming consistency"
  - "test organization"
---

# SC Refactor Review Skill

Routes review and refactoring requests to specialized agents based on intent.

## Quick Reference

| Intent | Agents | Focus |
|--------|--------|-------|
| Code review (production) | sc-code-reviewer + sc-structural-reviewer | Bugs, security, completeness |
| Code review (feature branch) | sc-code-reviewer | High-confidence issues only |
| Simplification | sc-abstraction-critic + sc-duplication-hunter | Unnecessary complexity |
| Dead code removal | sc-dead-code-detector + sc-structural-reviewer | Unreferenced code |
| Cleanup | sc-naming-auditor + sc-test-organizer | Consistency, structure |
| Full codebase health | All 5 agents (parallel) | Comprehensive analysis |

## Context Requirement

This skill works best with a context packet specifying:
- What was changed/implemented
- What areas to focus on
- What to ignore (intentional patterns)

If no context packet is provided, invoke `/sc-extras:sc-context-wizard` scoped to the review request before proceeding.

## Routing Logic

```
1. Check for context packet (@.agent-history/context-packet-*.md)
   - If missing: invoke context-wizard first

2. Parse intent from request:
   - "review" / "check" / "validate" -> Code Review flow
   - "simplify" / "refactor" / "clean up" -> Refactoring flow
   - "dead code" / "unused" / "delete" -> Dead Code flow
   - "naming" / "consistency" -> Naming flow
   - "test" / "organization" -> Test Organization flow
   - "health" / "full" / "comprehensive" -> All Agents flow

3. Spawn appropriate agents (parallel when multiple)

4. Synthesize findings into unified report
```

## Output Format

All agents report in this structure:

```
## [Category] Analysis

### High Priority (confidence >= 90)
- [finding]: [description] ([file:line])

### Medium Priority (confidence 80-89)
- [finding]: [description] ([file:line])

### Recommendations
- [actionable next step]
```

## Related Components

- **Agents**: sc-duplication-hunter, sc-abstraction-critic, sc-naming-auditor, sc-dead-code-detector, sc-test-organizer
- **Existing**: sc-code-reviewer (simpleclaude-core), sc-structural-reviewer (simpleclaude-core)
- **Commands**: sc-codebase-health (orchestrator for full analysis)
