---
name: sc-refactor
description: Plan and execute surgical code refactorings with behavior preservation
allowed-tools: Task, Read, Bash, Grep, Glob, TodoWrite, AskUserQuestion
argument-hint: "[target] or specific refactoring request"
---

# sc-refactor: Surgical Code Refactoring

**Purpose**: Improve code quality through safe, behavior-preserving refactorings. Either analyze code for opportunities or execute a specific refactoring.

## Mode Detection

Parse $ARGUMENTS to determine mode:

**Plan Mode** (analysis requested):
- Empty arguments
- Contains: "analyze", "find", "what", "plan", "recommend", "opportunities", "suggest"
- Directory/file path without specific action

**Execute Mode** (specific refactoring):
- Contains action verb: "extract", "rename", "simplify", "eliminate", "consolidate", "split", "inline", "remove"
- Specific target: "extract X from Y", "rename A to B", "simplify conditionals in Z"

**Ambiguous**: Ask user which mode they want.

---

## Plan Mode: Find Refactoring Opportunities

### Phase 1: Invoke Planner

```
Task(
  subagent_type: "sc-refactor:sc-refactor-planner",
  prompt: "Analyze [target from $ARGUMENTS or current directory] for refactoring opportunities.
           Return prioritized recommendations with file:line references."
)
```

### Phase 2: Present Results

Display planner output. If opportunities found, ask user:

| Option   | Label              | Description             |
| -------- | -------            | -------------           |
| select   | Select refactoring | Pick one to execute now |
| list     | Full list          | Just show the analysis  |

### Phase 3: If "Select refactoring"

Display numbered list of recommendations. Ask which one to execute.

Then proceed to Execute Mode with the selected refactoring.

---

## Execute Mode: Perform Refactoring

### Phase 1: Verify Intent

If `$ARGUMENTS` is vague about the specific change, ask for clarification:
- What exactly to refactor
- Which file(s)
- What the target name/structure should be (if applicable)

### Phase 2: Invoke Executor

```
Task(
  subagent_type: "sc-refactor:sc-refactor-executor",
  prompt: "Execute this refactoring: [specific refactoring from $ARGUMENTS or user selection]

           Requirements:
           - Preserve all observable behavior
           - Run tests before and after
           - Report success/failure with files modified"
)
```

### Phase 3: Report Results

Display executor output. If successful:

```
## Refactoring Complete

**Change:** [description from executor]
**Technique:** [pattern used]
**Files:** [list]
**Tests:** [status]

### Next Steps
- Review the changes: `git diff`
- Run additional tests if needed
- Commit when satisfied: `git add -u && git commit -m "refactor: [description]"`
```

If failed or needs clarification, display the blocker and ask how to proceed.

### Phase 4: Continue?

Ask user:

| Option   | Label               | Description                       |
| -------- | -------             | -------------                     |
| another  | Another refactoring | Execute another from the analysis |
| analyze  | New analysis        | Analyze a different target        |
| done     | Done                | Stop here                         |

---

## Example Flows

**User:** `/sc-refactor src/utils`
- Plan mode: Analyze src/utils for opportunities
- Present recommendations
- Offer to execute selected one

**User:** `/sc-refactor extract the duplicate validation logic in auth.ts into a shared function`
- Execute mode: Direct to executor
- Report results
- Offer to continue

**User:** `/sc-refactor`
- Ambiguous: Ask for target or specific refactoring

---

## What This Command Does

- Identifies refactoring opportunities through static analysis
- Executes one surgical refactoring at a time
- Verifies behavior preservation through tests
- Guides iterative improvement workflow

## What This Command Does NOT Do

- Multiple refactorings in one pass (use iteratively)
- Feature changes or bug fixes (separate concerns)
- Architectural redesigns (different conversation)
- Auto-commit changes (user controls commits)
