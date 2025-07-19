# Context Detection

_Auto-detect project context and adapt to existing patterns_

## Project Detection

- **JavaScript**: package.json → React (JSX), Vue (.vue), Angular (@angular), Next.js
- **Python**: requirements.txt → Django (manage.py), Flask, FastAPI
- **Go**: go.mod
- **Rust**: Cargo.toml
- **Ruby**: Gemfile → Rails (MVC)

Auto-detect: package managers, version managers, testing frameworks, build tools, CI/CD

## Code Style

- Analyze existing patterns, linter configs (.eslintrc, .prettierrc)
- Match naming (camelCase, snake_case), imports, documentation style

## Library Validation

**JS**: `import .* from` → check package.json **Python**: `import/from` → check requirements **Ruby**: `include` or `require` → check module inclusion

- use `mcp__context7` to verify up to date library code examples

## Smart Defaults

Detect rather than dictate, adapt to existing patterns, start minimal, respect configurations
