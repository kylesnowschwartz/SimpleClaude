---
description: Comprehensive pre-merge review combining bug detection and structural verification
allowed-tools: Task, Read, Bash, TodoWrite
argument-hint: [files-or-branch]
---

Run a comprehensive review for production-ready code. Combines functional review (bugs, security) with structural review (completeness, hygiene).

## Scope

By default, review changes from `git diff` (unstaged). User may specify:
- Specific files: `@path/to/file.ts`
- Branch comparison: `feature-branch`
- Staged changes: `--staged`

## Phase 1: Parallel Review

Launch BOTH reviewers simultaneously:

```
Task(subagent_type: "simpleclaude-core:sc-code-reviewer", run_in_background: true,
     prompt: "Review [scope] for bugs, security issues, and CLAUDE.md compliance.
              Report only confidence >= 80 findings.")

Task(subagent_type: "sc-refactor:sc-structural-reviewer", run_in_background: true,
     prompt: "Review [scope] for structural completeness:
              - Dead code from changes
              - Missing config updates
              - Development artifacts
              - Dependency hygiene")
```

## Phase 2: Synthesize

Collect results and produce unified report:

```
# Production Review: [scope]

## Functional Issues (sc-code-reviewer)

### Critical (confidence >= 90)
- [issue]: [description] ([file:line]) - [confidence]

### Important (confidence 80-89)
- [issue]: [description] ([file:line]) - [confidence]

## Structural Issues (sc-structural-reviewer)

### Blocking
- [issue that will break build/deploy]

### Debt-Inducing
- [issue that will cause maintenance pain]

## Verdict

[ ] READY FOR MERGE - No critical issues
[ ] NEEDS FIXES - [count] blocking issues
[ ] NEEDS REVIEW - [count] issues flagged for discussion
```

## Phase 3: Summary

Provide actionable next steps:
- If READY: Confirm merge-readiness
- If NEEDS FIXES: List specific fixes required
- If NEEDS REVIEW: List items needing human judgment
