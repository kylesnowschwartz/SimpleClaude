---
name: sc-resolve-pr-parallel
description: Resolve all PR comments using parallel processing
argument-hint: "[optional: PR number or current PR]"
---

Resolve all PR comments using parallel processing with the sc-pr-comment-resolver agent. Consider any additional user arguments in ARGUMENTS

## Workflow

### 1. Analyze

Get current branch and PR context, then fetch all unresolved comments:

```bash
gh pr status
gh pr view --json number,url,headRefName
```

For the current or specified PR, get all review comments:

```bash
gh api repos/{owner}/{repo}/pulls/{pr_number}/comments --jq '.[] | {id, path, line, body, in_reply_to_id}'
```

Get review threads to identify unresolved comments:

```bash
gh api graphql -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          isResolved
          comments(first: 10) {
            nodes {
              id
              body
              path
              line
            }
          }
        }
      }
    }
  }
}' -f owner=OWNER -f name=REPO -F pr=PR_NUMBER
```

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

$ARGUMENTS
