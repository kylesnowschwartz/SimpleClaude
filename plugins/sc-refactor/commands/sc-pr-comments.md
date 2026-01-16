---
name: sc-pr-comments
description: Fetch and display comments from GitHub PR
argument-hint: "[--all] [PR number | PR URL | owner/repo PR_NUMBER]"
---

# Fetch PR Comments

Fetch review comments as an ASCII tree from the PR in $ARGUMENTS:

```bash
"${CLAUDE_PLUGIN_ROOT}/scripts/get-pr-comments.sh" $ARGUMENTS | ruby "${CLAUDE_PLUGIN_ROOT}/scripts/format-pr-tree.rb"
```

**Options:**
- `--all`: Include resolved threads (marked with `[RESOLVED]`). Use when user wants full context, history, or to understand what was already addressed.

**Input formats:**
- No args: current branch's PR
- `123`: PR #123 in current repo
- `https://github.com/owner/repo/pull/123`: any PR by URL
- `owner/repo 123`: any PR by owner/repo and number

**When to use `--all`:**
- User asks for "all comments" or "full history"
- User wants to understand reviewer patterns or what was discussed
- User is doing a code review and needs full context
- User asks "what was already resolved?"

Present the output to the user. If there are no unresolved comments, confirm all threads are resolved.
