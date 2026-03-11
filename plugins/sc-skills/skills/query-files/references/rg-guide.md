# rg: Ripgrep Text Search Reference

**Goal: Efficient text search with features beyond the built-in Grep tool.**

## When to Use rg Over Built-in Grep

The built-in Grep tool handles 95% of search needs with structured output. Use `rg` via Bash when needing:

- Fixed string search (`-F`) — no regex interpretation of special characters
- Invert match (`-v`) — lines NOT matching pattern
- Word boundaries (`-w`) — whole-word only
- Context lines (`-C`, `-B`, `-A`) — surrounding code for understanding
- Pipe composition (`| head`, `| wc -l`, `| sort`)
- One-shot results with line numbers and file paths

---

# Common Patterns

## Find Function Definitions

```bash
rg 'function \w+\(' -t js .
rg 'def \w+\(' -t py .
rg 'func \w+\(' -t go .
rg 'fn \w+\(' -t rust .
rg 'def \w+' -t ruby .
```

## Find Imports/Requires

```bash
rg "import .* from" -t js .
rg "require\(" -t js .
rg "^import " -t py .
rg "^from .* import" -t py .
rg '^import \(' -t go .
```

## Find TODOs/FIXMEs

```bash
rg 'TODO|FIXME|HACK|XXX' .
rg -c 'TODO' .                    # Count per file
rg 'TODO' . | wc -l               # Total count
```

## Find Debug Statements

```bash
rg -F 'console.log' -t js .
rg -F 'binding.pry' -t ruby .
rg -F 'print(' -t py .
rg -F 'fmt.Println' -t go .
```

## Find Class/Interface Definitions

```bash
rg 'class \w+' -t ts .
rg 'interface \w+' -t ts .
rg 'type \w+ struct' -t go .
rg 'class \w+' -t ruby .
```

## Find API Endpoints

```bash
rg "app\.(get|post|put|delete)\(" -t js .
rg "@(Get|Post|Put|Delete)Mapping" -t java .
rg "router\.(GET|POST|PUT|DELETE)" -t go .
```

---

# File Type Flags

```bash
-t js        # JavaScript (.js, .jsx, .mjs)
-t ts        # TypeScript (.ts, .tsx)
-t py        # Python
-t go        # Go
-t rust      # Rust
-t ruby      # Ruby
-t java      # Java
-t cpp       # C++
-t c         # C
-t md        # Markdown
-t json      # JSON
-t yaml      # YAML
-t html      # HTML
-t css       # CSS
-t sh        # Shell scripts
```

List all types: `rg --type-list`

---

# Context and Output Control

```bash
# Lines before match
rg -B 3 'pattern' .

# Lines after match
rg -A 3 'pattern' .

# Lines before and after
rg -C 3 'pattern' .

# Line numbers
rg -n 'pattern' .

# Column numbers
rg --column 'pattern' .

# Files only (no content)
rg -l 'pattern' .

# Files NOT matching
rg --files-without-match 'pattern' .

# Count matches per file
rg -c 'pattern' .

# JSON output
rg --json 'pattern' .
```

---

# Search Modifiers

```bash
# Case insensitive
rg -i 'pattern' .

# Fixed string (no regex)
rg -F 'console.log(' .

# Word boundaries
rg -w 'function' .

# Invert match
rg -v 'test' .

# Multiline
rg -U 'start.*\n.*end' .

# Max depth
rg --max-depth 2 'pattern' .

# Exclude directories
rg --glob '!node_modules' 'pattern' .
rg --glob '!{node_modules,dist,build}' 'pattern' .

# Include only specific paths
rg --glob 'src/**' 'pattern' .
```

---

# Pipe Composition

```bash
# First N matches
rg 'pattern' . | head -10

# Count total matches
rg 'pattern' . | wc -l

# Sort by file
rg 'pattern' . | sort

# Unique files only
rg -l 'pattern' . | sort -u

# Feed to xargs
rg -l 'old_name' -t js . | xargs sed -i '' 's/old_name/new_name/g'

# With fzf
rg -l 'pattern' . | fzf
```

---

# Common Flag Combinations

```bash
# "Show me where this is used, with context"
rg -n -C 2 'functionName' -t js .

# "Find exact string, not regex"
rg -nF 'obj.method()' .

# "Whole-word search in Python files"
rg -nw 'class' -t py .

# "Everything except tests"
rg --glob '!*test*' --glob '!*spec*' 'pattern' .

# "Count by file type"
rg -c 'TODO' -t js . && rg -c 'TODO' -t py .
```
