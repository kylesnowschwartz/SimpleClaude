---
name: sc-pull-request-skills
description: GitHub PR workflow automation including fetching unresolved comments, resolving review threads, and parallel comment resolution. Use this skill when working with PR reviews, addressing reviewer feedback, or automating PR comment workflows.
---

This skill provides tools and workflows for automating GitHub pull request review processes.

## Quick Reference

### Fetch Unresolved PR Comments

```bash
# Current branch's PR
./scripts/get-pr-comments.sh

# Specific PR
./scripts/get-pr-comments.sh 123
```

Returns JSON with unresolved threads, paths, line numbers, and comment bodies.

### Resolve a Review Thread

```bash
./scripts/resolve-pr-thread.sh PRRT_kwDO...
```

The thread ID comes from the `threadId` field in `get-pr-comments.sh` output.

## Related Components

**Agent:** `sc-pr-comment-resolver` - Resolves individual PR comments by implementing requested changes and reporting resolution status.

**Command:** `/sc-resolve-pr-parallel` - Orchestrates parallel resolution of all unresolved PR comments using multiple agents.

## Workflow Pattern

1. Fetch unresolved comments with `get-pr-comments.sh`
2. For each comment, spawn `sc-pr-comment-resolver` agent
3. After changes, commit and push
4. Mark threads resolved with `resolve-pr-thread.sh`
5. Verify all threads resolved

## GitHub API Patterns

### Get PR Review Comments (REST)

```bash
gh api repos/{owner}/{repo}/pulls/{pr}/comments
```

### Get Review Threads (GraphQL)

```bash
gh api graphql -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          path
          line
          comments(first: 10) {
            nodes { body author { login } }
          }
        }
      }
    }
  }
}'
```

### Resolve Thread (GraphQL Mutation)

```bash
gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread { isResolved }
  }
}'
```
