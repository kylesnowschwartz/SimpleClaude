#!/usr/bin/env bash
# get-pr-comments.sh - Fetch PR review comments
#
# Usage: get-pr-comments.sh [--all] [PR_NUMBER | PR_URL]
#        get-pr-comments.sh [--all] owner/repo PR_NUMBER
#
#        If no args, uses the current branch's PR
#        --all: Include resolved threads (default: unresolved only)
#
# Output: JSON with review threads and comments

set -euo pipefail

# Parse --all flag
INCLUDE_RESOLVED=false
if [[ "${1:-}" == "--all" ]]; then
  INCLUDE_RESOLVED=true
  shift
fi

# Parse arguments
if [[ $# -eq 0 ]]; then
  # No args - detect from current branch
  PR_NUMBER=$(gh pr view --json number --jq '.number' 2>/dev/null || echo "")
  if [[ -z "$PR_NUMBER" ]]; then
    echo "Error: No PR found for current branch" >&2
    exit 1
  fi
  REPO_INFO=$(gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"')
  OWNER=$(echo "$REPO_INFO" | cut -d'/' -f1)
  REPO=$(echo "$REPO_INFO" | cut -d'/' -f2)

elif [[ $# -eq 1 ]]; then
  # Single arg - could be PR number or URL
  if [[ "$1" =~ ^https://github.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
    # GitHub URL format
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    PR_NUMBER="${BASH_REMATCH[3]}"
  elif [[ "$1" =~ ^[0-9]+$ ]]; then
    # Just a number - use current repo
    PR_NUMBER="$1"
    REPO_INFO=$(gh repo view --json owner,name --jq '"\(.owner.login)/\(.name)"')
    OWNER=$(echo "$REPO_INFO" | cut -d'/' -f1)
    REPO=$(echo "$REPO_INFO" | cut -d'/' -f2)
  else
    echo "Error: Invalid argument. Use PR number, URL, or 'owner/repo PR_NUMBER'" >&2
    exit 1
  fi

elif [[ $# -eq 2 ]]; then
  # Two args - owner/repo and PR number
  if [[ "$1" =~ ^([^/]+)/([^/]+)$ ]]; then
    OWNER="${BASH_REMATCH[1]}"
    REPO="${BASH_REMATCH[2]}"
    PR_NUMBER="$2"
  else
    echo "Error: First arg must be owner/repo format" >&2
    exit 1
  fi

else
  echo "Usage: get-pr-comments.sh [--all] [PR_NUMBER | PR_URL | owner/repo PR_NUMBER]" >&2
  exit 1
fi

# Build jq filter based on --all flag
if [[ "$INCLUDE_RESOLVED" == "true" ]]; then
  THREAD_FILTER=""
else
  THREAD_FILTER="| select(.isResolved == false)"
fi

# Fetch review threads and PR-level comments with GraphQL
gh api graphql -f query='
query($owner: String!, $name: String!, $pr: Int!) {
  repository(owner: $owner, name: $name) {
    pullRequest(number: $pr) {
      url
      title
      comments(first: 100) {
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
}' -f owner="$OWNER" -f name="$REPO" -F pr="$PR_NUMBER" | jq --arg filter "$THREAD_FILTER" '
  .data.repository.pullRequest | {
    url,
    title,
    prComments: [
      .comments.nodes[] | {
        id: .id,
        databaseId: .databaseId,
        author: .author.login,
        body: .body,
        createdAt: .createdAt
      }
    ],
    threads: [
      .reviewThreads.nodes[]
      '"$THREAD_FILTER"'
      | {
          threadId: .id,
          path: .path,
          line: .line,
          isResolved: .isResolved,
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
