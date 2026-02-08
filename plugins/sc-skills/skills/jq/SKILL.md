---
name: jq
description: This skill should be used when the user asks to "get the version from package.json", "what dependencies are in this project", "extract field from JSON", "check tsconfig settings", "parse API response", "get scripts from package.json", or when needing specific fields from JSON files without loading the entire file.
---

# jq: JSON Query Tool

Extract specific fields from JSON files without reading entire contents into context.

## When to Use

**Use jq when:**
- Need specific field(s) from JSON config
- File is large (>50 lines) and only need subset
- Querying nested structures
- Working with package.json, tsconfig.json, lock files, API responses

**Just use Read when:**
- File is small (<50 lines)
- Need to understand overall structure
- Making edits (need full context anyway)

## Common Files

- `package.json` - dependencies, scripts, version
- `tsconfig.json` - compiler options
- `package-lock.json` - locked versions
- `*.json` API responses
- `.eslintrc.json`, `prettierrc.json` - tool configs

## Quick Reference

```bash
# Get specific field
jq -r '.version' package.json
jq -r '.name' package.json

# Get nested field
jq -r '.dependencies.react' package.json
jq -r '.compilerOptions.target' tsconfig.json

# Get all keys
jq -r '.scripts | keys[]' package.json
jq -r '.dependencies | keys[]' package.json

# Get multiple fields
jq '{name, version}' package.json

# Filter array
jq '.items[] | select(.active == true)' data.json

# Count items
jq '.dependencies | length' package.json
```

## package.json Patterns

```bash
# Version
jq -r '.version' package.json

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
```

## tsconfig.json Patterns

```bash
# Target
jq -r '.compilerOptions.target' tsconfig.json

# All compiler options
jq '.compilerOptions' tsconfig.json

# Include paths
jq '.include' tsconfig.json

# Strict mode
jq -r '.compilerOptions.strict' tsconfig.json
```

## API Response Patterns

```bash
# Get data array
jq '.data' response.json

# First item
jq '.data[0]' response.json

# Pluck field from all items
jq '.data[].name' response.json

# Filter by condition
jq '.data[] | select(.status == "active")' response.json

# Count results
jq '.data | length' response.json
```

## Core Principle

Extract exactly what's needed in one command. Saves 80-95% context vs reading entire JSON files.
