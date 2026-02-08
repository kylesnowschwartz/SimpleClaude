---
name: mq
description: This skill should be used when the user asks to "get code blocks from README", "extract links from markdown", "find all headers in this doc", "pull the table from documentation", "what code examples are in this file", or when needing specific elements (code, links, headers, tables) from large Markdown files without loading the entire file.
---

# mq: Markdown Query and Extraction Tool

Use mq to extract specific elements from Markdown files without loading entire file contents into context.

## When to Use mq vs Read

**Use mq when:**
- Need specific element(s) from Markdown file (headers, code blocks, links, tables)
- File is large (>50 lines) and only need subset
- Querying document structure
- Extracting code samples, URLs, or table data
- **Saves 80-95% context** vs reading entire file

**Just use Read when:**
- File is small (<50 lines)
- Need to understand overall structure
- Making edits (need full context anyway)

## Common File Types

Markdown files where mq excels:
- README.md, CHANGELOG.md, documentation
- GitHub wiki pages
- Technical specifications
- API documentation with code samples

## Quick Examples

```bash
# Get all code blocks
mq '.code' README.md

# Get code blocks by language
mq '.code("rust")' file.md

# Get all links (URLs only)
mq '.link.url' file.md

# Get all headers
mq '.h' README.md

# Get level-2 headers only
mq '.h2' file.md

# Extract table data
mq '.[][]' file.md

# Extract YAML frontmatter (raw)
mq '.yaml.value' file.md

# Parse frontmatter to JSON (pipe to yq)
mq '.yaml.value' file.md | yq -o json
```

## Core Principle

Extract exactly what is needed in one command - massive context savings compared to reading entire Markdown files.

## Detailed Reference

For comprehensive mq patterns, syntax, and examples, load [mq guide](./references/mq-guide.md):
- Core patterns (80% of use cases)
- Element selectors (code, links, headers, tables, lists)
- Filtering and transformation
- Output formats
- Integration with other tools
