---
name: query-files
description: This skill SHOULD be used for structured extraction or batch queries against JSON (use jq), YAML (use yq), or Markdown (use mq), and for advanced text search with ripgrep flags or pipe composition (use rg).
---

# Context-Efficient Extraction

Extract specific data from files using CLI tools instead of built-in Read/Grep. Saves 80-95% of context tokens on large files and enables features the built-in tools lack.

## Route by Task

| Task | Tool | When to use over built-in |
|------|------|--------------------------|
| JSON field extraction | `jq` | File >50 lines, need specific fields |
| YAML field extraction | `yq` | File >50 lines, need specific fields |
| Markdown element extraction | `mq` | Need code blocks, links, headers, tables |
| Text search with advanced flags | `rg` | Need `-F`, `-v`, `-w`, `-C`, pipe composition |

Fall back to Read when the file is small (<50 lines), the overall structure matters, or edits follow immediately. Fall back to built-in Grep for straightforward pattern matching (handles 95% of search needs).

## jq: JSON Extraction

```bash
# Specific field
jq -r '.version' package.json
jq -r '.compilerOptions.target' tsconfig.json

# Nested field
jq -r '.dependencies.react' package.json

# All keys at a level
jq -r '.scripts | keys[]' package.json
jq -r '.dependencies | keys[]' package.json

# Multiple fields
jq '{name, version}' package.json

# Filter array by condition
jq '.items[] | select(.active == true)' data.json

# Count
jq '.dependencies | length' package.json

# Pluck from array
jq -r '.data[].name' response.json

# Filter with to_entries
jq -r '.dependencies | to_entries[] | select(.value | startswith("^")) | "\(.key): \(.value)"' package.json
```

**Common files:** package.json, tsconfig.json, package-lock.json, .eslintrc.json, API responses.

For detailed patterns (package.json, tsconfig, API responses), load [jq reference](./references/jq-guide.md).

## yq: YAML Extraction

```bash
# Specific field
yq '.version' pubspec.yaml
yq '.services.web.image' docker-compose.yml

# All keys at a level
yq '.services | keys' docker-compose.yml

# Nested array element
yq '.jobs.build.steps[0].name' .github/workflows/ci.yml

# Filter by condition
yq '.services.[] | select(.ports)' docker-compose.yml

# Multiple fields
yq '.name, .version' pubspec.yaml

# Wildcard across siblings
yq '.services.*.image' docker-compose.yml

# Output as JSON
yq -o=json '.' config.yaml
```

**Common files:** docker-compose.yml, .github/workflows/*.yml, kubernetes manifests, Helm charts, pubspec.yaml.

For detailed patterns (Docker Compose, GitHub Actions, Kubernetes), load [yq reference](./references/yq-guide.md).

## mq: Markdown Extraction

```bash
# Code blocks
mq '.code' README.md
mq '.code("python")' README.md

# Headers
mq '.h' README.md
mq '.h2' README.md

# Links
mq '.link.url' README.md

# Tables
mq '.[][]' README.md

# Lists
mq '.list' README.md

# YAML frontmatter
mq '.yaml.value' file.md

# Frontmatter parsed to JSON
mq '.yaml.value' file.md | yq -o json

# Filter by content
mq '.code | select(contains("import"))' file.md

# JSON output for further processing
mq -F json '.code' README.md | jq '.[0]'
```

**Common files:** README.md, CHANGELOG.md, documentation, API docs, specs.

For detailed patterns (selectors, filtering, output formats, frontmatter), load [mq reference](./references/mq-guide.md).

## rg: Advanced Text Search

Use `rg` via Bash when the built-in Grep tool lacks the flag or composition needed.

```bash
# Fixed string (no regex interpretation)
rg -F 'console.log(' .

# Word boundaries
rg -w 'function' .

# Invert match
rg -v 'test' -t js .

# Context lines
rg -n -C 2 'pattern' .

# Specific file types
rg -t js 'import' .
rg -t py 'def ' .
rg -t go 'func ' .

# Exclude directories
rg --glob '!node_modules' 'pattern' .

# Count matches per file
rg -c 'TODO' .

# Files only (no content)
rg -l 'pattern' .

# Pipe composition
rg 'pattern' . | head -10
rg -l 'pattern' . | sort -u
```

For detailed patterns (function defs, imports, file types, pipe composition), load [rg reference](./references/rg-guide.md).

## Cross-Tool Pipelines

```bash
# Parse markdown frontmatter as structured data
mq '.yaml.value' file.md | yq '.description'

# Markdown to JSON to jq
mq -F json '.link' README.md | jq '.[].url'

# Find files by content, extract structured data
rg -l 'apiVersion' -t yaml | xargs -I {} yq '.kind' {}

# Find markdown files, extract code blocks
fd -e md | xargs -I {} mq '.code("bash")' {}

# YAML to JSON conversion
yq -o=json '.' config.yaml | jq '.services | keys[]'
```

## Core Principle

One command, exact data, minimal context. Built-in tools load everything; these tools load only what matters.
