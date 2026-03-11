# mq: Markdown Query and Extraction Reference

**Goal: Extract specific elements from Markdown without reading entire file.**

## The Essential Pattern

```bash
mq '.selector' file.md
```

mq uses jq-like syntax to query Markdown document structure.

---

# Core Patterns (80% of Use Cases)

## 1. Extract Code Blocks

```bash
mq '.code' file.md                    # All code blocks
mq '.code("python")' file.md          # Python code blocks only
mq '.code("rust")' file.md            # Rust code blocks only
mq '.code.lang' file.md               # Just language identifiers
```

## 2. Extract Headers

```bash
mq '.h' file.md                       # All headers
mq '.h1' file.md                      # Level 1 headers only
mq '.h2' file.md                      # Level 2 headers only
mq '.h3' file.md                      # Level 3 headers only
```

## 3. Extract Links

```bash
mq '.link' file.md                    # All links (text and URL)
mq '.link.url' file.md                # URLs only
mq '.link.text' file.md               # Link text only
```

## 4. Extract Images

```bash
mq '.image' file.md                   # All images
mq '.image.url' file.md               # Image URLs only
mq '.image.alt' file.md               # Alt text only
```

## 5. Extract Tables

```bash
mq '.[][]' file.md                    # All table cell data
```

## 6. Extract Lists

```bash
mq '.list' file.md                    # All list items
mq '.ul' file.md                      # Unordered lists
mq '.ol' file.md                      # Ordered lists
```

## 7. Extract Blockquotes

```bash
mq '.blockquote' file.md              # All blockquotes
```

## 8. Extract Paragraphs

```bash
mq '.p' file.md                       # All paragraphs
```

---

# Common Real-World Workflows

## "Get all code examples from README"
```bash
mq '.code' README.md
```

## "Find all Python examples"
```bash
mq '.code("python")' docs/tutorial.md
```

## "List all external links"
```bash
mq '.link.url' README.md
```

## "Get table of contents (all headers)"
```bash
mq '.h' README.md
```

## "Extract installation commands"
```bash
mq '.code("bash")' README.md
```

## "Get API endpoint documentation"
```bash
mq '.code("http")' api-docs.md
```

## "Find TypeScript interfaces"
```bash
mq '.code("typescript")' docs/types.md
```

---

# Filtering and Selection

## Filter by Content

```bash
mq '.code | select(contains("name"))' file.md    # Code blocks containing "name"
mq 'select(!.code("js"))' file.md                # Everything except JS code
```

## Negate Selection

```bash
mq 'select(!.code)' file.md                      # Everything except code blocks
```

---

# Advanced Patterns (20% Use Cases)

## Combine Selectors

```bash
mq '.code, .link' file.md             # Code blocks AND links
```

## Generate Table of Contents

```bash
mq '.h | toc' file.md                 # Generate TOC from headers
```

## Chain Operations

```bash
mq '.code | select(contains("import"))' file.md
```

---

# Input Formats

mq handles multiple input formats:

```bash
mq '.code' file.md                    # Markdown (default)
mq --from mdx '.code' file.mdx        # MDX
mq --from html '.code' file.html      # HTML
mq --from text '.p' file.txt          # Plain text
```

---

# Output Formats

Control output rendering:

```bash
mq '.code' file.md                    # Markdown output (default)
mq -F html '.code' file.md            # HTML output
mq -F text '.code' file.md            # Plain text output
mq -F json '.code' file.md            # JSON output
mq -F none '.code' file.md            # Suppress output
```

---

# YAML Frontmatter Extraction

mq has a `.yaml` selector for extracting YAML frontmatter from Markdown files:

```bash
# Extract raw frontmatter content
mq '.yaml.value' file.md

# Extract with delimiters (---)
mq --yaml '.yaml' file.md

# Parse to JSON (pipe to yq)
mq '.yaml.value' file.md | yq -F json

# Get specific frontmatter field
mq '.yaml.value' file.md | yq '.description'

# Extract frontmatter from multiple files
fd -e md | xargs -I {} sh -c 'echo "=== {} ===" && mq ".yaml.value" "{}"'
```

**Note:** The `.yaml` selector extracts the raw YAML text. For structured parsing, pipe to `yq`.

---

# Common Flags

- `-F FORMAT` - Output format (markdown, html, text, json, none)
- `-I FORMAT` - Input format (markdown, mdx, html, text, null, raw)
- `--yaml` - Include YAML module for frontmatter
- `--json` - JSON mode

---

# Integration with Other Tools

## With jq (JSON output)
```bash
mq -F json '.code' README.md | jq '.[0]'
```

## With ripgrep (find then query)
```bash
rg -l "API" --type md | xargs -I {} mq '.code("bash")' {}
```

## With shell pipelines
```bash
mq '.link.url' README.md | sort | uniq    # Unique links
mq '.code' README.md | wc -l              # Count code blocks
```

## Reading STDIN
```bash
cat README.md | mq '.h1'
echo "# Title" | mq '.h'
```

---

# Best Practices

## 1. Use Specific Selectors
```bash
# BAD:  mq '.' file.md  (returns everything)
# GOOD: mq '.code("python")' file.md  (specific)
```

## 2. Filter Early
```bash
mq '.code | select(contains("import"))' file.md
```

## 3. Use JSON Output for Further Processing
```bash
mq -F json '.link' README.md | jq '.[] | .url'
```

## 4. Combine with File Finding
```bash
fd -e md | xargs -I {} mq '.code' {}
```

---

# Quick Reference

## Most Common Commands

```bash
# Code blocks
mq '.code' file.md
mq '.code("lang")' file.md

# Headers
mq '.h' file.md
mq '.h2' file.md

# Links
mq '.link' file.md
mq '.link.url' file.md

# Tables
mq '.[][]' file.md

# Lists
mq '.list' file.md

# Images
mq '.image' file.md

# Frontmatter
mq '.yaml.value' file.md
mq '.yaml.value' file.md | yq -F json

# Filter
mq '.code | select(contains("text"))' file.md

# Output as JSON
mq -F json '.code' file.md
```

---

# When to Use Read Instead

Use Read tool when:
- File is < 50 lines
- Need to see overall document structure
- Making edits (need full context)
- Exploring unknown Markdown structure

Use mq when:
- File is large (documentation, specs)
- Know exactly what element(s) you need
- Want to save context tokens

---

# Summary

**Default pattern:**
```bash
mq '.selector' file.md
```

**Key principles:**
1. Use element selectors (`.code`, `.h`, `.link`, `.list`, `.yaml`)
2. Filter with language specifier `.code("lang")`
3. Use `select()` for content filtering
4. Use `-F json` for further processing with jq
5. Access sub-properties with `.url`, `.text`, `.alt`, `.value`
6. For frontmatter parsing, pipe `.yaml.value` to `yq`

**Massive context savings: Extract only what you need instead of reading entire Markdown files.**
