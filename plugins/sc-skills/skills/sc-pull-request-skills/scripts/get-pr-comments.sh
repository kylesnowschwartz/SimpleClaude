#!/usr/bin/env bash
# get-pr-comments.sh - Fetch unresolved PR review comments
#
# Usage: get-pr-comments.sh [PR_NUMBER]
#        If PR_NUMBER is omitted, uses the current branch's PR
#
# Output: JSON array of unresolved review threads with comments

set -euo pipefail

# Get PR number from argument or detect from current branch
if [[ $# -ge 1 ]]; then
  PR_NUMBER="$1"
else
  PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")
  if [[ -z "$PR_NUMBER" ]]; then
    echo "Error: No PR number provided and no PR found for current branch" >&2
    exit 1
  fi
fi

# Get repository owner and name
REPO_INFO=$(gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"')
OWNER=$(echo "$REPO_INFO" | cut -d'/' -f1)
REPO=$(echo "$REPO_INFO" | cut -d'/' -f2)

# Fetch review threads with GraphQL
gh api graphql -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      url
      title
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          comments(first: 20) {
            nodes {
              id
              databaseId
              author {
                login
              }
              body
              createdAt
            }
          }
        }
      }
    }
  }
}' -f owner="$OWNER" -f name="$REPO" -F pr="$PR_NUMBER" | jq '
  .data.repository.pullRequest | {
    url,
    title,
    threads: [
      .reviewThreads.nodes[]
      | select(.isResolved == false)
      | {
          threadId: .id,
          path: .path,
          line: .line,
          isOutdated: .isOutdated,
          comments: [
            .comments.nodes[] | {
              id: .id,
              databaseId: .databaseId,
              author: .author.login,
              body: .body,
              createdAt: .createdAt
            }
          ]
        }
    ]
  }
'
