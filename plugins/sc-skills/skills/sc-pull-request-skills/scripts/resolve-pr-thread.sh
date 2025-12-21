#!/usr/bin/env bash
# resolve-pr-thread.sh - Mark a PR review thread as resolved
#
# Usage: resolve-pr-thread.sh THREAD_ID
#
# The THREAD_ID is the GraphQL node ID (starts with "PRRT_")
# obtained from get-pr-comments.sh output

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: resolve-pr-thread.sh THREAD_ID" >&2
  echo "" >&2
  echo "THREAD_ID: GraphQL node ID from get-pr-comments.sh (e.g., PRRT_kwDOxx...)" >&2
  exit 1
fi

THREAD_ID="$1"

# Resolve the thread via GraphQL mutation
RESULT=$(gh api graphql -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: {threadId: $threadId}) {
    thread {
      id
      isResolved
    }
  }
}' -f threadId="$THREAD_ID")

# Check if successful
IS_RESOLVED=$(echo "$RESULT" | jq -r '.data.resolveReviewThread.thread.isResolved')

if [[ "$IS_RESOLVED" == "true" ]]; then
  echo "Thread $THREAD_ID resolved successfully"
else
  echo "Failed to resolve thread $THREAD_ID" >&2
  echo "$RESULT" >&2
  exit 1
fi
