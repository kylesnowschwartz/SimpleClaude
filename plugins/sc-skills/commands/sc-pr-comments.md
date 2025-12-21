---
name: sc-pr-comments
description: Fetch and display comments from GitHub PR
argument-hint: "[PR number | PR URL | owner/repo PR_NUMBER]"
---

# Fetch PR Comments

Fetch unresolved review comments as an ASCII tree:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/sc-pull-request-skills/scripts/get-pr-comments.sh" $ARGUMENTS | ruby "${CLAUDE_PLUGIN_ROOT}/skills/sc-pull-request-skills/scripts/format-pr-tree.rb"
```

**Input formats:**
- No args: current branch's PR
- `123`: PR #123 in current repo
- `https://github.com/owner/repo/pull/123`: any PR by URL
- `owner/repo 123`: any PR by owner/repo and number

Present the output to the user. If there are no comments, confirm all threads are resolved.
