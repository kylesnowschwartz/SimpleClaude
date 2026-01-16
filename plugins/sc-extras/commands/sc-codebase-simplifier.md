---
description: Run 5 parallel agents to analyze codebase quality (duplication, abstractions, naming, dead code, tests)
allowed-tools: Task, Read, Bash, AskUserQuestion, TodoWrite
argument-hint: [target-directory]
---

Analyze the codebase at $ARGUMENTS (or current directory if not specified) for code quality issues.

## Phase 1: Launch 5 Analysis Agents in Parallel

Launch ALL of these agents simultaneously in a single message using the Task tool with `run_in_background: true`. Do NOT wait between launches.

### Duplication Hunter
```
Task(
  description: "Find code duplication",
  subagent_type: "Explore",
  model: "sonnet",
  run_in_background: true,
  prompt: """
  You are a code duplication specialist. Analyze this codebase for:

  1. Copy-paste duplication: Identical or near-identical code blocks
  2. Structural duplication: Same patterns implemented differently
  3. Logic duplication: Same business logic scattered across files

  For each finding, report:
  - Files and line ranges involved
  - Similarity percentage (exact, near-exact, structural)
  - Suggested consolidation approach (extract function, module, trait, etc.)

  Focus on duplication that MATTERS - ignore boilerplate that's intentionally repeated.
  Return a structured list of findings with severity (high/medium/low).
  """
)
```

### Abstraction Critic
```
Task(
  description: "Find unnecessary abstractions",
  subagent_type: "Explore",
  model: "opus",
  run_in_background: true,
  prompt: """
  You are an abstraction minimalist. Hunt for unnecessary complexity:

  1. Over-abstraction: Interfaces with one implementation, factories that create one thing
  2. Premature generalization: Code built for flexibility never used
  3. Wrapper hell: Classes that just delegate to another class
  4. Config theater: Complex configuration for things that never change

  For each finding, explain:
  - What the abstraction is trying to do
  - Why it's unnecessary (show the single usage, the never-used flexibility)
  - What simpler alternative would work

  Be opinionated. YAGNI violations are your specialty.
  """
)
```

### Naming Auditor
```
Task(
  description: "Audit naming consistency",
  subagent_type: "Explore",
  model: "sonnet",
  run_in_background: true,
  prompt: """
  You audit naming consistency across a codebase. Look for:

  1. Convention violations: camelCase vs snake_case mixing, inconsistent prefixes
  2. Semantic drift: Same concept named differently in different places
  3. Misleading names: Functions that do more/less than their name suggests
  4. Abbreviation chaos: Some things abbreviated, others not

  Group findings by type. For each, show:
  - The inconsistent examples
  - What the convention should be (infer from majority usage)
  - Files affected

  Don't nitpick - focus on inconsistencies that hurt readability.
  """
)
```

### Dead Code Detector
```
Task(
  description: "Find dead/unreferenced code",
  subagent_type: "Explore",
  model: "sonnet",
  run_in_background: true,
  prompt: """
  You find code that should be deleted. Hunt for:

  1. Unreferenced exports: Public functions/classes never imported
  2. Orphan files: Files not required by anything
  3. Commented-out code: Code in comments that's clearly dead
  4. Feature flags to nowhere: Conditionals for features that don't exist
  5. TODO graveyards: Ancient TODOs that will never be done

  For each finding:
  - Show the dead code location
  - Prove it's dead (no references, no imports)
  - Confidence level (certain, likely, possible)

  Be conservative - don't flag things that might be used dynamically or via reflection.
  """
)
```

### Test Organizer
```
Task(
  description: "Analyze test organization",
  subagent_type: "Explore",
  model: "sonnet",
  run_in_background: true,
  prompt: """
  You analyze test organization and coverage patterns. Look for:

  1. Structural chaos: Tests not mirroring source structure
  2. Missing test files: Source files with no corresponding tests
  3. Giant test files: Test files that should be split
  4. Fixture sprawl: Test data scattered without organization
  5. Framework inconsistency: Different test patterns in same codebase

  Report:
  - Current test organization pattern (or lack thereof)
  - Specific files that violate the pattern
  - Coverage gaps (directories with no tests)
  - Recommended structure

  Don't count assertions or coverage percentage - focus on organization.
  """
)
```

## Phase 2: Collect Results

After launching all agents, periodically check their output files using Read or `tail -f`. Wait until all 5 complete.

Format each category's findings as:

```
## [Category Name]

### High Priority
- [item]: [one-line description] ([file:line])

### Medium Priority
- ...

### Low Priority
- ...
```

Skip empty priority levels. Be concise - one sentence per item.

## Phase 3: Synthesize Report

Consolidate all findings into this structure:

```
# Codebase Quality Report

## Executive Summary
[3-5 sentences on overall codebase health]

## Quick Wins
[Things fixable in < 30 minutes with high impact]

## Recommended Refactors
[Larger changes worth doing]

## Tech Debt Backlog
[Valid issues to track but not urgent]

## Skip These
[Findings not worth the effort - explain why]
```

Be opinionated about priority. Cross-reference findings where duplication relates to abstraction issues, etc.

## Phase 4: User Choice

Use AskUserQuestion with these options:

| Option | Label | Description |
|--------|-------|-------------|
| fix-plan | Generate fix plan | Detailed step-by-step instructions for each Quick Win and Recommended Refactor |
| auto-fix | Auto-fix quick wins | Make the code changes for quick wins (max 10 iterations) |
| report-only | Just the report | Output the report and stop |

### If "Generate fix plan":

For each Quick Win and Recommended Refactor:

```
### [Issue Name]
**Files**: [list]
**Steps**:
1. [specific action]
2. [specific action]
**Verification**: [how to confirm it worked]
```

Make steps concrete enough for a junior dev.

### If "Auto-fix quick wins":

1. Extract quick wins as a checklist using TodoWrite
2. Loop (max 10):
   - Pick next unaddressed quick win
   - Make the code change
   - Mark complete in TodoWrite
   - Continue until done or max reached
3. Summarize all changes made

### If "Just the report":

Output the consolidated report. Done.
