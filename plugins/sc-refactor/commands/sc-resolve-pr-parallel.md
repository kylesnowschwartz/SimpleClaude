---
name: sc-resolve-pr-parallel
description: Resolve all PR comments using parallel processing
argument-hint: "[optional: PR number or current PR]"
---

Resolve all PR comments using parallel processing with the sc-pr-comment-resolver agent. Consider any additional user arguments in $ARGUMENTS

## Workflow

### 1. Analyze

Use the `/sc-refactor:sc-pr-comments` skill to fetch and display all unresolved comments as a formatted tree. Unresolved threads are displayed by default. Pass `--all` if user wants context from resolved threads.

For programmatic access to comment data (spawning agents), use the raw JSON:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/get-pr-comments.sh" $ARGUMENTS
```

This returns JSON with `threads[]` containing `path`, `line`, `threadId`, and `comments[]` with `body` and `author`.

### 2. Plan

Create a TodoWrite list of all unresolved items grouped by type:

- Bug fixes
- Refactoring requests
- Style/formatting
- Documentation
- Other

### 3. Implement (PARALLEL & BACKGROUND)

Spawn an `sc-pr-comment-resolver` agent for each unresolved comment **in parallel**.

For example, if there are 3 unresolved comments, spawn 3 agents simultaneously:

```
Task(sc-pr-comment-resolver, comment1_context)
Task(sc-pr-comment-resolver, comment2_context)
Task(sc-pr-comment-resolver, comment3_context)
```

Always run all agents in parallel for maximum efficiency, in the background.
Instruct each agent to focus on their work only and avoid conflicts with other parallel agents.

### 4. Summarize & Review

After all agents complete:

1. Review all changes made by agents
2. Report all changes in a comprehensive summary to the user in Outline & bulleted format, and allow them to review the work before committing.

## Success Criteria

- All review comments are addressed with code changes, and/or earmarked for manual review by the User
- No regressions introduced
- All tests pass using testing agents
- Changes are atomic and targeted to the specific feedback
- Any additional suggestions are presented as that, just suggestions

_Rembember, you are guiding a team of parallel agents to help fixup Pull Request feedback and then report the results back to the user for review_
