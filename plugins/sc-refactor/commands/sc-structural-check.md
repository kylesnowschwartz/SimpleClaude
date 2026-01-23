---
name: sc-structural-check
description: Structural completeness audit - verify wiring, configs, and nothing is missing
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite, AskUserQuestion, WebFetch
argument-hint: "[target-directory-or-feature]"
---

Audit the codebase at $ARGUMENTS (or current directory if not specified) for structural completeness.

## Purpose

After implementing a feature or refactoring, things get forgotten:
- Routes not registered
- ENV variables used but not documented
- Database migrations missing or incomplete
- Barrel file exports not updated
- README/docs not reflecting changes
- CSS/test/story files not renamed after component renames

This command verifies your changes are structurally complete.

## Phase 1: Determine Scope

If $ARGUMENTS specifies a feature/directory, focus there.
Otherwise, check git status/diff to determine recent changes:

```bash
git diff --name-only HEAD~5..HEAD  # Recent file changes
git status --porcelain             # Uncommitted changes
```

## Phase 2: Launch Structural Reviewer

```
Task(subagent_type: "sc-refactor:sc-structural-reviewer",
     prompt: "Audit structural completeness for: [scope]

              Check these categories:

              1. ROUTE REGISTRATION
                 - New endpoints have routes defined
                 - Removed endpoints have routes cleaned up
                 - Route file matches controller/handler structure

              2. ENVIRONMENT VARIABLES
                 - New ENV vars are documented in .env.example or README
                 - Removed features have ENV vars cleaned up
                 - No hardcoded values that should be env vars

              3. DATABASE/SCHEMA
                 - Model changes have corresponding migrations
                 - Removed models have cleanup migrations
                 - Index additions for new foreign keys

              4. EXPORTS/IMPORTS
                 - New modules exported from barrel files (index.ts, etc.)
                 - Renamed exports updated in all barrel files
                 - Removed exports cleaned from barrels

              5. DOCUMENTATION
                 - README reflects new features/changes
                 - API docs updated for endpoint changes
                 - CHANGELOG updated (if project uses one)

              6. RELATED FILES
                 - Renamed components have CSS/SCSS files renamed
                 - Renamed components have test files renamed
                 - Renamed components have Storybook files renamed

              Report each category as PASS, FAIL, or N/A with evidence.")
```

## Phase 3: Report

```
# Structural Audit Report

## Summary
[1-2 sentences on overall completeness]

## Checklist

| Category | Status | Issues |
|----------|--------|--------|
| Routes | PASS/FAIL | [count] |
| Environment | PASS/FAIL | [count] |
| Database | PASS/FAIL | [count] |
| Exports | PASS/FAIL | [count] |
| Documentation | PASS/FAIL | [count] |
| Related Files | PASS/FAIL | [count] |

## Issues Found

### Critical (will break things)
- [issue]: [description] ([file])
  Fix: [what to do]

### Important (should address)
- [issue]: [description] ([file])
  Fix: [what to do]

### Suggestions
- [issue]: [description]
```

## Phase 4: User Choice

Use AskUserQuestion:

| Option | Label | Description |
|--------|-------|-------------|
| fix-critical | Fix critical issues | Address issues that will break builds/runtime |
| fix-all | Fix all issues | Address critical + important issues |
| report-only | Just the report | Output report and stop |

### If fixing:
1. Create TodoWrite checklist from issues
2. Implement each fix, marking complete as you go
3. Re-run structural check on fixed areas
4. Summarize changes made

### If "Just the report":
Output the report. Done.

## What This Does NOT Check

- Code correctness (use tests)
- Dead code (use sc-cleanup)
- Code duplication (use sc-cleanup)
- Security issues (use sc-review-pr)
