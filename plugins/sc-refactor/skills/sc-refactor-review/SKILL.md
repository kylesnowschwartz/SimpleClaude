---
name: sc-refactor-review
description: This skill should be used when the user asks to "review code", "find dead code", "check for duplication", "simplify the codebase", "find refactoring opportunities", "do code cleanup", "check naming consistency", "analyze test organization", "run codebase health check", or "review my PR". Routes to specialized analysis agents based on the type of review requested.
---

# SC Refactor Review Skill

Reference guide for routing review and refactoring requests to specialized agents.

## Quick Reference

### Commands

| Command | Use When | Invokes |
|---------|----------|---------|
| `/sc-refactor:sc-review-pr` | Reviewing a PR for quality with ticket context | sc-code-reviewer + sc-structural-reviewer |
| `/sc-refactor:sc-cleanup` | Post-AI session cleanup (debug statements, duplicates) | 4 agents (dead-code, duplication, naming, test) |
| `/sc-refactor:sc-audit` | Verify structural completeness (wiring, configs) | sc-structural-reviewer |
| `/sc-refactor:sc-codebase-health` | Full codebase analysis | All 6 agents in parallel |

### Agents

| Agent | Focus | Color |
|-------|-------|-------|
| `sc-structural-reviewer` | Change completeness, orphaned code, dev artifacts | blue |
| `sc-duplication-hunter` | Copy-paste, structural, logic duplication | yellow |
| `sc-abstraction-critic` | YAGNI violations, over-engineering, wrapper hell | orange |
| `sc-naming-auditor` | Convention violations, semantic drift | cyan |
| `sc-dead-code-detector` | Unreferenced exports, orphan files, commented code | red |
| `sc-test-organizer` | Test structure, missing tests, fixture sprawl | green |

External dependency (from simpleclaude-core):
- `sc-code-reviewer` - Bugs, security, CLAUDE.md compliance

## Routing Table

Match the user's request to the appropriate command or agents:

| User Intent | Route To |
|-------------|----------|
| "review PR", "check my PR", "PR review" | `/sc-review-pr` |
| "clean up", "after AI session", "find debug", "console.log" | `/sc-cleanup` |
| "audit", "structural check", "verify wiring", "missing config" | `/sc-audit` |
| "health check", "full analysis", "comprehensive" | `/sc-codebase-health` |
| "dead code", "unused", "orphan" | sc-dead-code-detector |
| "duplicate", "DRY", "repeated" | sc-duplication-hunter |
| "simplify", "YAGNI", "over-engineer" | sc-abstraction-critic |
| "naming", "consistency", "convention" | sc-naming-auditor |
| "test organization", "test structure" | sc-test-organizer |
| "structural", "complete changes" | sc-structural-reviewer |

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
Task(subagent_type: "sc-refactor:sc-duplication-hunter", run_in_background: true, prompt: "...")
Task(subagent_type: "sc-refactor:sc-abstraction-critic", run_in_background: true, prompt: "...")
```

### Full Health Check (6 Agents)

```
Task(subagent_type: "sc-refactor:sc-structural-reviewer", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-duplication-hunter", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-abstraction-critic", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-naming-auditor", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-dead-code-detector", run_in_background: true, ...)
Task(subagent_type: "sc-refactor:sc-test-organizer", run_in_background: true, ...)
```

## Output Synthesis

After agents complete, synthesize findings by priority:

```
## [Category] Analysis

### High Priority (confidence >= 90)
- [finding]: [description] ([file:line])

### Medium Priority (confidence 80-89)
- [finding]: [description] ([file:line])

### Recommendations
- [actionable next step]
```

## Command Details

### sc-review-pr

Context-aware PR review with ticket integration. Gathers:
- PR metadata (title, body, commits, changed files)
- Linked ticket context (Jira, GitHub Issues, beads)
- Relevant CLAUDE.md guidelines

Then runs parallel review agents focused on the PR diff.

### sc-cleanup

Post-AI session cleanup. Spawns 4 agents to find:
- Debug statements (console.log, print, debugger, binding.pry)
- Code duplication (AI rewrote instead of reusing)
- Naming inconsistencies
- Test organization issues

Offers auto-fix for immediate issues (debug removal, dead code deletion).

### sc-audit

Structural completeness verification. Uses sc-structural-reviewer to check:
- Route registration
- ENV variable documentation
- Database migrations
- Barrel file exports
- Documentation updates
- Related file renames (CSS, tests, stories)

Reports PASS/FAIL per category with fix suggestions.

### sc-codebase-health

Comprehensive health check running all 6 agents in parallel. Produces:
- Executive summary
- Quick wins (fixable in <30 min)
- Recommended refactors
- Tech debt backlog
- Items to skip (not worth effort)

Offers auto-fix for quick wins after analysis.
