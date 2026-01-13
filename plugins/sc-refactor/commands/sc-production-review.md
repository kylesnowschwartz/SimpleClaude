---
description: Comprehensive pre-merge review with multi-phase validation pipeline
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite
argument-hint: [PR-number-or-branch]
---

Run a production-ready code review with gate checks, parallel analysis, and finding validation.

**Agent assumptions:**
- All tools are functional. Do not make exploratory calls.
- Only call tools required to complete the task.
- HIGH SIGNAL ONLY - flag issues where code will fail, not style concerns.

Create a TodoWrite checklist before starting.

## Phase 1: Context Gathering (haiku, parallel)

Launch two haiku agents in parallel:

```
Task(subagent_type: "general-purpose", model: "haiku", run_in_background: true,
     prompt: "Find all CLAUDE.md files relevant to this review:
              1. Root CLAUDE.md
              2. CLAUDE.md files in directories containing changed files
              Return list of paths only.")

Task(subagent_type: "general-purpose", model: "haiku", run_in_background: true,
     prompt: "Get PR metadata: title, description, changed files list.
              Use: gh pr view $ARGUMENTS --json title,body,files
              Return structured summary.")
```

## Phase 2: Change Summary (sonnet)

Launch a sonnet agent with context from Phase 1:

```
Task(subagent_type: "general-purpose", model: "sonnet",
     prompt: "Summarize the PR changes:
              - What is being added/changed/removed?
              - What is the author's intent?
              - What areas need careful review?
              PR metadata: [from Phase 1]
              Changed files: [from Phase 1]")
```

## Phase 3: Parallel Review (sonnet + opus)

Launch 4 agents in parallel with different focus areas:

```
# Agent 1: CLAUDE.md Compliance (sonnet)
Task(subagent_type: "simpleclaude-core:sc-code-reviewer", model: "sonnet",
     run_in_background: true,
     prompt: "Review for CLAUDE.md compliance only.
              Guidelines: [CLAUDE.md content from Phase 1]
              Changes: [diff]
              Flag only explicit rule violations you can quote.")

# Agent 2: Structural Completeness (sonnet)
Task(subagent_type: "sc-refactor:sc-structural-reviewer", model: "sonnet",
     run_in_background: true,
     prompt: "Review structural completeness:
              - Missing config updates?
              - Orphaned code from refactoring?
              - Development artifacts left behind?
              Changes: [diff]")

# Agent 3: Bug Detection (opus)
Task(subagent_type: "general-purpose", model: "opus",
     run_in_background: true,
     prompt: "Scan for bugs in the diff ONLY. Flag:
              - Syntax/parse errors
              - Type errors, missing imports
              - Clear logic errors
              Do NOT flag: style, potential issues, improvements.
              Changes: [diff]
              Author intent: [from Phase 2]")

# Agent 4: Security/Logic (opus)
Task(subagent_type: "general-purpose", model: "opus",
     run_in_background: true,
     prompt: "Scan for security and logic issues:
              - Authentication/authorization flaws
              - Input validation gaps
              - Race conditions
              - Data exposure risks
              Only flag issues IN the changed code.
              Changes: [diff]")
```

## Phase 4: Validation (parallel)

For EACH finding from Phase 3, launch a validation agent:

```
Task(subagent_type: "general-purpose",
     model: "opus",  # for bugs
     # or model: "sonnet",  # for CLAUDE.md issues
     prompt: "Validate this finding:
              Issue: [description]
              Location: [file:line]

              Confirm with HIGH CONFIDENCE that:
              1. The issue actually exists in the code
              2. It's not a false positive
              3. It's within the changed code (not pre-existing)

              Return: VALID + evidence, or INVALID + reason")
```

## Phase 5: Filter and Report

Keep only VALID findings. Produce report:

```
# Production Review: [PR title]

## Summary
[From Phase 2]

## Validated Issues

### Critical (will break things)
- [issue]: [description] ([file:line])
  Evidence: [from validation]

### Important (should fix)
- [issue]: [description] ([file:line])
  Evidence: [from validation]

### Structural
- [issue]: [description]

## Verdict

[ ] READY FOR MERGE - No critical issues found
[ ] NEEDS FIXES - [count] issues require changes
[ ] NEEDS DISCUSSION - [count] issues need human judgment
```

## False Positive Prevention

Do NOT flag:
- Pre-existing issues (not introduced by this PR)
- Style/quality concerns (unless explicit CLAUDE.md rule)
- Potential issues depending on specific inputs
- Issues a linter would catch
- Subjective improvements

When uncertain, do not flag. False positives erode trust.
