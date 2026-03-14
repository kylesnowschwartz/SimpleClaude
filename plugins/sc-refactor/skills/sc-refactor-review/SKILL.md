---
name: sc-refactor-review
description: This skill SHOULD be used when the user asks to "review code", "find dead code", "check for duplication", "simplify the codebase", "find refactoring opportunities", "do code cleanup", "check naming consistency", "analyze test organization", "run codebase health check", "review my PR", "refactor this code", "extract method", "rename variable", "consolidate duplicates", "adversarial review", "red team review", "find ways to break this", "multi-model review", "get multiple AI opinions on this code", "hunt bugs", "find bugs", "bug hunt", or "adversarial bug hunt". Routes to specialized analysis agents, refactoring workflow, multi-model adversarial review, or adversarial bug hunt based on the type of request.
---

# SC Refactor Review Skill

Reference guide for routing review and refactoring requests to specialized agents.

## Quick Reference

### Commands

| Command | Use When | Invokes |
|---------|----------|---------|
| `/sc-refactor:sc-refactor` | Refactor code (plan or execute) | sc-refactor-planner + sc-refactor-executor |
| `/sc-refactor:sc-review-pr` | Reviewing a PR for quality with ticket context | sc-code-reviewer + sc-structural-reviewer |
| `/sc-refactor:sc-pr-comments` | View unresolved PR review comments | Scripts (GraphQL) |
| `/sc-refactor:sc-resolve-pr-parallel` | Batch resolve all PR comments | sc-pr-comment-resolver (parallel) |
| `/sc-refactor:sc-cleanup` | Post-AI session cleanup (debug statements, duplicates) | 4 agents (dead-code, duplication, naming, test) |
| `/sc-refactor:sc-audit` | Verify structural completeness (wiring, configs) | sc-structural-reviewer |
| `/sc-refactor:sc-codebase-health` | Full codebase analysis | All 6 agents in parallel |
| `/sc-refactor:sc-adversarial-review` | Multi-model adversarial review | Codex CLI + Gemini CLI + Claude |
| `/sc-refactor:sc-bug-hunt` | Adversarial bug hunt with competing agents | 3 Explore agents (finder, adversary, referee) |

### Agents

| Agent | Focus | Color |
|-------|-------|-------|
| `sc-refactor-planner` | Analyze code, recommend refactoring opportunities | yellow |
| `sc-refactor-executor` | Execute ONE surgical refactoring with test verification | green |
| `sc-structural-reviewer` | Change completeness, orphaned code, dev artifacts | blue |
| `sc-duplication-hunter` | Copy-paste, structural, logic duplication | yellow |
| `sc-abstraction-critic` | YAGNI violations, over-engineering, wrapper hell | orange |
| `sc-naming-auditor` | Convention violations, semantic drift | cyan |
| `sc-dead-code-detector` | Unreferenced exports, orphan files, commented code | red |
| `sc-test-organizer` | Test structure, missing tests, fixture sprawl | green |
| `sc-pr-comment-resolver` | Implement PR review comment changes | blue |
External dependency (from sc-core):
- `sc-code-reviewer` - Bugs, security, CLAUDE.md compliance

## Routing Table

Match the user's request to the appropriate command or agents:

| User Intent | Route To |
|-------------|----------|
| "refactor", "extract method", "rename", "consolidate", "inline" | `/sc-refactor` |
| "refactoring opportunities", "what should I refactor" | `/sc-refactor` (plan mode) |
| "review PR", "check my PR", "PR review" | `/sc-review-pr` |
| "PR comments", "view comments", "unresolved comments" | `/sc-pr-comments` |
| "resolve comments", "fix PR feedback", "address review" | `/sc-resolve-pr-parallel` |
| "clean up", "after AI session", "find debug", "console.log" | `/sc-cleanup` |
| "audit", "structural check", "verify wiring", "missing config" | `/sc-audit` |
| "health check", "full analysis", "comprehensive" | `/sc-codebase-health` |
| "adversarial review", "red team", "break this code", "multi-model" | `/sc-adversarial-review` |
| "bug hunt", "find bugs", "hunt bugs", "adversarial bug hunt" | `/sc-bug-hunt` |
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

You MUST use the results delivered in task-notifications directly — do NOT call TaskOutput on completed background agents, as the task registry purges completed entries and TaskOutput will fail with "No task found".

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

### sc-refactor

Surgical code refactoring workflow with two modes:

**Plan Mode** (no specific action given):
1. Invokes sc-refactor-planner to analyze target
2. Presents prioritized recommendations
3. User selects one to execute

**Execute Mode** (specific action given):
1. Invokes sc-refactor-executor with the specific refactoring
2. Executor runs tests, makes change, verifies behavior preserved
3. Reports success/failure with files modified

Example usage:
- `/sc-refactor src/utils` - Analyze for opportunities
- `/sc-refactor extract duplicate validation in auth.ts` - Execute specific refactoring

Key constraints:
- ONE refactoring per invocation
- Tests must pass before and after
- Zero behavioral changes
- Does NOT auto-commit

### sc-codebase-health

Comprehensive health check running all 6 agents in parallel. Produces:
- Executive summary
- Quick wins (fixable in <30 min)
- Recommended refactors
- Tech debt backlog
- Items to skip (not worth effort)

Offers auto-fix for quick wins after analysis.

### sc-adversarial-review

Multi-model adversarial review using external AI CLIs. Runs OpenAI Codex, Google Gemini, and Claude in parallel against the same target with an attacker's mindset.

Value: Model diversity. Different architectures find different blind spots. Findings categorized as:
- **Consensus** (multiple models agree) — highest confidence
- **Unique** (one model only) — investigate
- **Divergent** (models disagree) — most interesting

Requires: `codex` and/or `gemini` CLI installed. Degrades gracefully to whichever is available + Claude.

Example usage:
- `/sc-adversarial-review` — Review uncommitted changes
- `/sc-adversarial-review branch` — Review current branch vs main
- `/sc-adversarial-review src/auth/` — Review specific directory

### sc-bug-hunt

Adversarial bug hunting with three competing agents. Uses economic incentives to produce high-fidelity results:

1. **Bug Finder** (superset) — Scores +1/+5/+10 by impact. Incentivized to find everything, including borderline cases.
2. **Adversary** (filter) — Earns bug's score for disproofs, loses 2x for wrong disproofs. Aggressive but cautious.
3. **Referee** (ground truth) — Told correct answers exist. +1 correct ruling, -1 wrong. Produces final verified list.

Agents run sequentially — each phase feeds into the next. The adversarial structure means false positives get filtered out through competing economic pressure rather than relying on a single agent's judgment.

Example usage:
- `/sc-bug-hunt src/auth/` — Hunt bugs in auth directory
- `/sc-bug-hunt staged` — Hunt bugs in uncommitted changes
- `/sc-bug-hunt branch` — Hunt bugs in current branch vs main
