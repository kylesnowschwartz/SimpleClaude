---
name: sc-codebase-health
description: Run parallel analysis agents for comprehensive codebase health check
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite, AskUserQuestion, WebFetch
argument-hint: "[target-directory]"
---

Analyze the codebase at $ARGUMENTS (or current directory if not specified) for code quality issues.

## Phase 1: Check Context

If a context packet exists (@.agent-history/context-packet-*.md), use it to focus the analysis.
If not, briefly ask: "What areas should I focus on? (or 'all' for comprehensive scan)"

## Phase 2: Launch Analysis Agents

Launch ALL 6 agents simultaneously using Task with `run_in_background: true`:

```
Task(subagent_type: "sc-refactor:sc-structural-reviewer", run_in_background: true,
     prompt: "Analyze [target] for structural completeness. Focus on: [context areas]")

Task(subagent_type: "sc-refactor:sc-duplication-hunter", run_in_background: true,
     prompt: "Analyze [target] for code duplication. Focus on: [context areas]")

Task(subagent_type: "sc-refactor:sc-abstraction-critic", run_in_background: true,
     prompt: "Analyze [target] for unnecessary abstractions. Focus on: [context areas]")

Task(subagent_type: "sc-refactor:sc-naming-auditor", run_in_background: true,
     prompt: "Analyze [target] for naming inconsistencies. Focus on: [context areas]")

Task(subagent_type: "sc-refactor:sc-dead-code-detector", run_in_background: true,
     prompt: "Analyze [target] for dead/unreferenced code. Focus on: [context areas]")

Task(subagent_type: "sc-refactor:sc-test-organizer", run_in_background: true,
     prompt: "Analyze [target] test organization. Focus on: [context areas]")
```

## Phase 3: Collect and Synthesize

Wait for all agents to complete. Consolidate findings:

```
# Codebase Health Report

## Executive Summary
[3-5 sentences on overall health]

## Quick Wins
[High-confidence issues fixable in < 30 min]

## Recommended Refactors
[Larger changes worth doing]

## Tech Debt Backlog
[Valid but not urgent]

## Skip These
[Not worth the effort - explain why]
```

Cross-reference findings (e.g., duplication often relates to abstraction issues).

## Phase 4: User Choice

Use AskUserQuestion:

| Option | Label | Description |
|--------|-------|-------------|
| fix-plan | Generate fix plan | Step-by-step instructions for Quick Wins and Recommended Refactors |
| auto-fix | Auto-fix quick wins | Make code changes for quick wins (max 10 iterations) |
| report-only | Just the report | Output report and stop |

### If "Generate fix plan":
For each item, provide: Files, Steps (concrete), Verification method.

### If "Auto-fix quick wins":
1. Create TodoWrite checklist from quick wins
2. Implement each (max 10), marking complete as you go
3. Summarize changes made

### If "Just the report":
Output the report. Done.
