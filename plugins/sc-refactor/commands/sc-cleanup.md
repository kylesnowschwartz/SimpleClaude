---
name: sc-cleanup
description: Post-AI session cleanup - find debug statements, duplicate code, and AI artifacts
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite, AskUserQuestion, WebFetch
argument-hint: "[target-directory]"
---

Clean up the codebase at $ARGUMENTS (or current directory if not specified) after an AI coding session.

## Purpose

AI coding sessions often leave behind artifacts:
- Debug statements (`console.log`, `print()`, `debugger`, `binding.pry`)
- Duplicate implementations (AI wrote new code instead of finding existing)
- Inconsistent naming (AI used different conventions than the codebase)
- Orphaned tests or missing test coverage
- TODO/FIXME comments that should be resolved

This command finds these issues so you can clean them up before committing.

## Phase 1: Launch Analysis Agents

Launch 4 agents in parallel with `run_in_background: true`:

```
Task(subagent_type: "sc-refactor:sc-dead-code-detector", run_in_background: true,
     prompt: "Analyze [target] for dead code and debug artifacts. Focus on:
              - Debug statements (console.log, print, debugger, binding.pry, byebug)
              - Stale TODO/FIXME/HACK/XXX comments
              - Commented-out code blocks
              - Unused imports")

Task(subagent_type: "sc-refactor:sc-duplication-hunter", run_in_background: true,
     prompt: "Analyze [target] for code duplication. Focus on:
              - Duplicate function implementations
              - Copy-pasted code blocks
              - Reimplemented utility functions")

Task(subagent_type: "sc-refactor:sc-naming-auditor", run_in_background: true,
     prompt: "Analyze [target] for naming inconsistencies. Focus on:
              - Convention violations vs established patterns
              - Inconsistent casing or prefixes
              - Names that don't match the domain language")

Task(subagent_type: "sc-refactor:sc-test-organizer", run_in_background: true,
     prompt: "Analyze [target] test organization. Focus on:
              - Missing tests for new code
              - Orphaned test files
              - Test/implementation file mismatches")
```

## Phase 2: Collect and Prioritize

Wait for all agents to complete. Categorize findings:

```
# Post-Session Cleanup Report

## Immediate Fixes (before committing)
[Debug statements, obvious duplicates, broken tests]

## Should Address
[Naming inconsistencies, missing tests]

## Consider Later
[Minor duplication, stylistic issues]

## Findings Summary
- Dead code/debug: [count] issues
- Duplication: [count] issues
- Naming: [count] issues
- Test organization: [count] issues
```

## Phase 3: User Choice

Use AskUserQuestion:

| Option | Label | Description |
|--------|-------|-------------|
| auto-fix | Auto-fix immediate issues | Remove debug statements, delete dead code (max 15 changes) |
| fix-plan | Generate fix plan | Step-by-step instructions for each issue |
| report-only | Just the report | Output report and stop |

### If "Auto-fix immediate issues":
1. Create TodoWrite checklist from immediate fixes
2. Implement each fix (max 15), marking complete as you go
3. Only fix high-confidence items (debug statements, obvious dead code)
4. Summarize changes made

### If "Generate fix plan":
For each issue: File, Problem, Fix steps, Verification.

### If "Just the report":
Output the report. Done.

## What This Does NOT Check

- Functional correctness (use tests for that)
- Security issues (use sc-review-pr)
- Structural completeness (use sc-audit)
- Code style (use your linter)
