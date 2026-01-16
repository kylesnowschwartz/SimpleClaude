---
name: sc-review-pr
description: Context-aware PR review with ticket integration and multi-phase validation
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite, AskUserQuestion, WebFetch
argument-hint: "[PR-number-or-URL]"
---

Run a context-aware PR review that gathers ticket context, PR metadata, and CLAUDE.md guidelines before running parallel review agents.

<pr-reference>
  $ARGUMENTS can be:
  - PR number: 42
  - Full URL: https://github.com/owner/repo/pull/42
  - Empty: infer from current branch
</pr-reference>

**Agent assumptions:**
- All tools are functional. Do not make exploratory calls.
- Only call tools required to complete the task.
- HIGH SIGNAL ONLY - flag issues where code will fail, not style concerns.
- CONTEXT-FIRST - always understand author intent before reviewing.

Create a TodoWrite checklist before starting.

## Phase 1: Context Gathering (haiku, parallel)

Launch three haiku agents in parallel to gather all context:

```
# Agent 1: PR Metadata
Task(subagent_type: "general-purpose", model: "haiku", run_in_background: true,
     prompt: "Get PR metadata using gh CLI:
              gh pr view $ARGUMENTS --json number,title,body,commits,files,headRefName,baseRefName

              Extract and return:
              - PR number and title
              - Full PR body/description
              - List of commit messages
              - List of changed files
              - Branch names (head and base)

              Return as structured data.")

# Agent 2: CLAUDE.md Finder
Task(subagent_type: "general-purpose", model: "haiku", run_in_background: true,
     prompt: "Find all CLAUDE.md files relevant to this PR:

              1. Check for root CLAUDE.md and .claude/CLAUDE.md
              2. Get list of changed files from: gh pr view $ARGUMENTS --json files
              3. For each unique directory containing changed files, check for CLAUDE.md

              Return:
              - List of CLAUDE.md paths found
              - Brief summary of key guidelines from each")

# Agent 3: Ticket Extractor
Task(subagent_type: "general-purpose", model: "haiku", run_in_background: true,
     prompt: "Extract ticket references from PR metadata:

              1. Get PR title and body: gh pr view $ARGUMENTS --json title,body
              2. Parse for ticket patterns:
                 - JIRA: PROJECT-123, PROJ-1234
                 - GitHub Issues: #123, owner/repo#123
                 - Beads: bd-123
                 - Linear: ABC-123
              3. If JIRA tickets found and jira-cli available, fetch summaries
              4. If GitHub issues found, fetch with: gh issue view [number] --json title,body

              Return:
              - List of ticket references found
              - Ticket summaries if fetchable
              - 'No ticket references found' if none")
```

Wait for all Phase 1 agents to complete before proceeding.

## Phase 2: Intent Summary (sonnet, sequential)

Synthesize context from Phase 1 into a clear understanding of author intent:

```
Task(subagent_type: "general-purpose", model: "sonnet",
     prompt: "Synthesize the PR context into an intent summary:

              PR Metadata: [from Agent 1]
              CLAUDE.md Guidelines: [from Agent 2]
              Ticket Context: [from Agent 3]

              Produce:
              1. **Author Intent**: What problem is being solved? What's the goal?
              2. **Change Summary**: What was added/changed/removed?
              3. **Risk Areas**: What parts need careful review based on:
                 - Complexity of changes
                 - Security-sensitive code
                 - Core functionality modifications
                 - CLAUDE.md requirements that might apply
              4. **Review Focus**: Specific things to look for given the context

              If no ticket context available, infer intent from PR title/body/commits.
              Keep summary concise but complete.")
```

## Phase 3: Parallel Review (sonnet + opus, parallel)

Launch 4 specialized review agents with full context:

```
# Agent 1: CLAUDE.md Compliance (sonnet)
Task(subagent_type: "simpleclaude-core:sc-code-reviewer", model: "sonnet",
     run_in_background: true,
     prompt: "Review for CLAUDE.md compliance only.  If no CLAUDE.md was found in phase 1, stop now.

              CLAUDE.md Guidelines:
              [content from Phase 1]

              Author Intent:
              [from Phase 2]

              Review the PR diff: gh pr diff $ARGUMENTS

              For each finding, provide:
              - Specific CLAUDE.md rule being violated (quote it)
              - File and line number
              - Why this violates the rule
              - Confidence score (0-100)

              Only report violations of EXPLICIT rules you can quote.
              Do not invent rules or flag style preferences.")

# Agent 2: Structural Completeness (sonnet)
Task(subagent_type: "sc-refactor:sc-structural-reviewer", model: "sonnet",
     run_in_background: true,
     prompt: "Review structural completeness of this PR.

              Changed Files: [from Phase 1]
              Author Intent: [from Phase 2]

              Check for:
              - Missing config updates (package.json, tsconfig, etc.)
              - Orphaned code from refactoring (old implementations left behind)
              - Development artifacts (console.log, TODO, commented code)
              - Incomplete migrations (half-updated imports, mixed patterns)
              - Missing test file additions/updates

              Get the diff: gh pr diff $ARGUMENTS

              For each finding, provide:
              - What's missing or orphaned
              - File and line number
              - Confidence score (0-100)")

# Agent 3: Bug Detection (opus)
Task(subagent_type: "general-purpose", model: "opus",
     run_in_background: true,
     prompt: "Scan for bugs in the PR diff ONLY.

              Author Intent: [from Phase 2]

              Get the diff: gh pr diff $ARGUMENTS

              Flag ONLY:
              - Syntax/parse errors that will break
              - Type errors, missing imports
              - Clear logic errors (wrong operator, off-by-one, etc.)
              - Null/undefined access without guards
              - Resource leaks (unclosed handles, missing cleanup)

              Do NOT flag:
              - Style concerns
              - Potential issues that 'might' happen
              - Improvements or optimizations
              - Pre-existing issues not introduced by this PR

              For each finding:
              - Description of the bug
              - File and line number
              - Why this will break
              - Confidence score (0-100)")

# Agent 4: Security Scanner (opus)
Task(subagent_type: "general-purpose", model: "opus",
     run_in_background: true,
     prompt: "Scan for security issues in the PR diff.

              Author Intent: [from Phase 2]

              Get the diff: gh pr diff $ARGUMENTS

              Flag ONLY issues in CHANGED code:
              - Authentication/authorization bypasses
              - Input validation gaps (SQL injection, XSS, command injection)
              - Secrets/credentials in code
              - Insecure cryptography
              - Race conditions with security implications
              - Data exposure risks

              For each finding:
              - Security issue type
              - File and line number
              - Attack vector or risk
              - Confidence score (0-100)

              Do not flag theoretical risks or best-practice improvements.")
```

Wait for all Phase 3 agents to complete.

## Phase 4: Validation (parallel per finding)

For EACH finding with confidence >= 80 from Phase 3, spawn a validation agent:

```
# For bug findings (use opus)
Task(subagent_type: "general-purpose", model: "opus",
     prompt: "Validate this bug finding:

              Issue: [description from Phase 3]
              Location: [file:line from Phase 3]
              Claimed Evidence: [from Phase 3]

              Steps:
              1. Read the file at the specified location
              2. Confirm the issue actually exists as described
              3. Check if this is NEW in the PR (not pre-existing)
                 - Get file from base branch: git show origin/$BASE_BRANCH:$FILE
                 - Compare to see if issue was introduced
              4. Verify the issue will actually cause problems

              Return:
              - VALID: Issue confirmed with evidence
              - INVALID: Reason (false positive, pre-existing, misread, etc.)

              Be rigorous. False positives erode trust.")
```

Run validations in parallel. Collect results.

## Phase 5: Report

Filter to only VALID findings. Produce structured report:

```markdown
# PR Review: [PR title]

## Context

- **PR**: #[number] - [title]
- **Branch**: [head] -> [base]
- **Author Intent**: [synthesized from Phase 2]
- **Scope**: [N files changed - brief summary]
- **Ticket Context**: [tickets found and their summaries, or "None referenced"]

## Validated Issues

### Critical (will break things)

- **[type]**: [description]
  - Location: `[file:line]`
  - Evidence: [why this is a real issue]
  - Relates to intent: [how this conflicts with author's goal, if relevant]

### Important (should fix before merge)

- **[type]**: [description]
  - Location: `[file:line]`
  - Evidence: [validation evidence]

### Structural (incomplete changes)

- **[type]**: [description]
  - Location: `[file:line]` or "project-wide"
  - Evidence: [what's missing or orphaned]

## Summary

**[N] issues found** ([X] critical, [Y] important, [Z] structural)

Reviewed against:
- [List of CLAUDE.md files checked]

Ticket context used:
- [List of tickets that informed the review, or "None - reviewed based on PR description only"]

---

*Review focused on issues introduced by this PR only. Pre-existing issues were excluded.*
```

## Edge Case Handling

**No ticket references found:**
- Report "No ticket references found in PR title, body, or commits"
- Continue review using PR title/body/commits for intent
- Note in summary: "Ticket context: None - reviewed based on PR description only"

**No CLAUDE.md files found:**
- Report "No CLAUDE.md files found in repository"
- Skip CLAUDE.md compliance agent in Phase 3
- Note in summary: "No project guidelines found"

**Empty PR body:**
- Use commit messages and PR title for intent
- Note: "PR description empty - intent inferred from commits"

**No issues found:**
- Report all checks passed
- Confirm what was reviewed
- Provide brief summary of what was checked

## Anti-Patterns (Do NOT Flag)

- Pre-existing issues not introduced by this PR
- Style/quality concerns (unless explicit CLAUDE.md rule)
- Potential issues depending on specific inputs
- Issues a linter would catch
- Subjective improvements
- "Best practice" suggestions

When uncertain, admit it, and seek guidance from the User. False positives erode trust.
