---
name: sc-pr-comments
description: Fetch and display comments from GitHub PR
argument-hint: "[optional: PR number]"
---

# Fetch PR Comments

Fetch unresolved review comments using the get-pr-comments script:

```bash
"${CLAUDE_PLUGIN_ROOT}/skills/sc-pull-request-skills/scripts/get-pr-comments.sh" $ARGUMENTS
```

The script returns JSON with structure:

```json
{
  "url": "https://github.com/...",
  "title": "PR title",
  "threads": [
    {
      "threadId": "PRRT_...",
      "path": "src/file.ts",
      "line": 42,
      "isOutdated": false,
      "comments": [
        {"author": "reviewer", "body": "...", "createdAt": "..."}
      ]
    }
  ]
}
```

## Output Format

Parse the JSON and format as:

### Unresolved Review Comments

**{path}:{line}** - Thread `{threadId}`

@{author} ({createdAt}):
> {body}

[replies indented]

---

### Summary

For each file with comments:

**{path}**
- @{author}: {one-line summary of feedback}

### Statistics

- Total unresolved threads: {count}
- Files with comments: {list}

If no unresolved comments, report "All review threads resolved."
