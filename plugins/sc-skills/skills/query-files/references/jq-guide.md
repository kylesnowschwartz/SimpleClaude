# jq: JSON Query Reference

**Goal: Extract specific fields from JSON without reading entire file.**

## The Essential Pattern

```bash
jq 'expression' file.json
jq -r 'expression' file.json    # Raw output (no quotes on strings)
```

---

# package.json Patterns

```bash
# Version
jq -r '.version' package.json

# Name
jq -r '.name' package.json

# All scripts
jq '.scripts' package.json

# Specific script
jq -r '.scripts.build' package.json

# All dependencies (names only)
jq -r '.dependencies | keys[]' package.json

# Dependency version
jq -r '.dependencies["lodash"]' package.json

# Dev dependencies
jq -r '.devDependencies | keys[]' package.json

# Multiple fields
jq '{name, version, license}' package.json

# Count dependencies
jq '.dependencies | length' package.json

# Dependencies using ^ prefix
jq -r '.dependencies | to_entries[] | select(.value | startswith("^")) | "\(.key): \(.value)"' package.json

# Dependencies using ~ prefix
jq -r '.dependencies | to_entries[] | select(.value | startswith("~")) | "\(.key): \(.value)"' package.json

# Find a dependency across deps and devDeps
jq '{deps: .dependencies["react"], devDeps: .devDependencies["react"]}' package.json
```

---

# tsconfig.json Patterns

```bash
# Target
jq -r '.compilerOptions.target' tsconfig.json

# All compiler options
jq '.compilerOptions' tsconfig.json

# Include paths
jq '.include' tsconfig.json

# Strict mode
jq -r '.compilerOptions.strict' tsconfig.json

# Module resolution
jq -r '.compilerOptions.moduleResolution' tsconfig.json

# Path aliases
jq '.compilerOptions.paths' tsconfig.json
```

---

# API Response Patterns

```bash
# Get data array
jq '.data' response.json

# First item
jq '.data[0]' response.json

# Last item
jq '.data[-1]' response.json

# Pluck field from all items
jq -r '.data[].name' response.json

# Filter by condition
jq '.data[] | select(.status == "active")' response.json

# Count results
jq '.data | length' response.json

# Map to new shape
jq '[.data[] | {id, name}]' response.json

# Nested array access
jq '.data[0].attributes.tags[]' response.json
```

---

# Filtering and Transformation

```bash
# Select by field value
jq '.[] | select(.type == "module")' data.json

# Select by string content
jq '.[] | select(.name | contains("test"))' data.json

# Select by existence
jq '.[] | select(.email)' data.json

# Negate selection
jq '.[] | select(.status != "inactive")' data.json

# Map values
jq '[.[] | .name]' data.json

# Sort
jq 'sort_by(.name)' data.json

# Group
jq 'group_by(.type)' data.json

# Unique values
jq '[.[].type] | unique' data.json
```

---

# Output Control

```bash
# Raw string output (no quotes)
jq -r '.name' package.json

# Compact output (single line)
jq -c '.' data.json

# Tab-separated
jq -r '.[] | [.name, .version] | @tsv' data.json

# CSV
jq -r '.[] | [.name, .version] | @csv' data.json

# Custom format
jq -r '.[] | "\(.name): \(.version)"' data.json
```

---

# Common Flags

| Flag | Purpose |
|------|---------|
| `-r` | Raw output (no quotes on strings) |
| `-c` | Compact output (one line) |
| `-e` | Exit with error if output is null/false |
| `-s` | Slurp: read entire input as array |
| `--arg name val` | Pass external variable |

---

# Integration

```bash
# With curl
curl -s https://api.example.com/data | jq '.results[]'

# With yq (YAML to JSON)
yq -o=json '.' config.yaml | jq '.services | keys[]'

# With mq (Markdown to JSON)
mq -F json '.code' README.md | jq '.[0]'

# Multiple files
for f in *.json; do echo "=== $f ==="; jq -r '.version' "$f"; done
```
