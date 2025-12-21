---
name: sc-resolve-pr-parallel
description: Resolve all PR comments using parallel processing
argument-hint: "[optional: PR number or current PR]"
---

Resolve all PR comments using parallel processing with the sc-pr-comment-resolver agent.

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

### 3. Implement (PARALLEL)

Spawn an `sc-pr-comment-resolver` agent for each unresolved comment **in parallel**.

For example, if there are 3 unresolved comments, spawn 3 agents simultaneously:

```
Task(sc-pr-comment-resolver, comment1_context)
Task(sc-pr-comment-resolver, comment2_context)
Task(sc-pr-comment-resolver, comment3_context)
```

Always run all agents in parallel for maximum efficiency.

### 4. Commit & Resolve

After all agents complete:

1. Review all changes made by agents
2. Stage and commit changes with a clear message:
   ```bash
   git add -u
   git commit -m "fix: Address PR review comments"
   ```

3. Resolve the threads via GraphQL:
   ```bash
   gh api graphql -f query='
   mutation($threadId: ID!) {
     resolveReviewThread(input: {threadId: $threadId}) {
       thread { isResolved }
     }
   }' -f threadId=THREAD_ID
   ```

4. Push to remote:
   ```bash
   git push
   ```

### 5. Verify

Check that all comments are resolved:

```bash
gh api graphql -f query='...' | jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)'
```

If any remain unresolved, repeat the process from step 1.

## Success Criteria

- All review comments addressed
- All review threads marked as resolved
- Changes committed and pushed
- No regressions introduced
