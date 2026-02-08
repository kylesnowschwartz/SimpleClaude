---
name: rg
description: This skill should be used when the user asks to "search for pattern in codebase", "find all uses of function", "grep for string across files", "find TODO comments", "search in specific file types", "count occurrences", or when needing efficient text search with context, line numbers, or special flags.
---

# rg: Ripgrep Text Search

Efficient text search using ripgrep with one-shot patterns that minimize iterations.

## Tool Selection

**Grep tool (built-in)** - Use for structured searches:
- Basic pattern matching with structured output
- File type filtering with `type` parameter
- Handles 95% of search needs

**Bash(rg)** - Use when needing:
- Fixed string search (`-F`)
- Invert match (`-v`)
- Word boundaries (`-w`)
- Context lines (`-C 2`)
- Pipe composition (`| head`, `| wc -l`)
- One-shot results with line numbers

## Quick Reference

```bash
# Basic search with line numbers and context
rg -n -C 2 'pattern' .

# Case insensitive
rg -i 'pattern' .

# Fixed string (no regex)
rg -F 'console.log(' .

# Word boundaries
rg -w 'function' .

# Specific file types
rg -t js 'import' .
rg -t py 'def ' .
rg -t ts 'interface' .

# Exclude directories
rg --glob '!node_modules' 'pattern' .

# Count matches
rg -c 'TODO' .

# Files only (no content)
rg -l 'pattern' .
```

## Common Patterns

```bash
# Find function definitions
rg 'function \w+\(' -t js .
rg 'def \w+\(' -t py .
rg 'func \w+\(' -t go .

# Find imports/requires
rg "import .* from" -t js .
rg "require\(" -t js .

# Find TODOs/FIXMEs
rg 'TODO|FIXME' .

# Find console.log (for cleanup)
rg -F 'console.log' -t js .

# Find class definitions
rg 'class \w+' -t ts .

# Find API endpoints
rg "app\.(get|post|put|delete)\(" -t js .
```

## File Type Flags

```bash
-t js      # JavaScript
-t ts      # TypeScript
-t py      # Python
-t go      # Go
-t rust    # Rust
-t ruby    # Ruby
-t java    # Java
-t cpp     # C++
-t md      # Markdown
-t json    # JSON
-t yaml    # YAML
```

## Context and Output

```bash
# Lines before/after match
rg -B 3 'pattern' .     # 3 lines before
rg -A 3 'pattern' .     # 3 lines after
rg -C 3 'pattern' .     # 3 lines both

# Show line numbers
rg -n 'pattern' .

# Show column numbers
rg --column 'pattern' .

# JSON output
rg --json 'pattern' .
```

## Pipe Composition

```bash
# First 10 matches
rg 'pattern' . | head -10

# Count total matches
rg 'pattern' . | wc -l

# Sort by file
rg 'pattern' . | sort

# Unique files only
rg -l 'pattern' . | sort -u
```

## Core Principle

Get files, line numbers, and context in a single call. Minimize search iterations.
