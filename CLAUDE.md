# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- NEVER modify `.claude/` directory without explicit user permission - it's the template source
- Command changes: update TEMPLATE.md first, then apply to all 5 core-commands (sc-create, sc-modify, sc-understand, sc-fix, sc-review)
- Maintain consistency across all commands - no deviations from template unless instructed otherwise

## Build Commands

- Test installation: `./install.sh` (dry-run by default)
- Install: `./install.sh --execute` (preserves user customizations)
- No build/compile steps - SimpleClaude is pure configuration

## Architecture

- SimpleClaude: 5 natural language commands that transform requests into structured AI workflows
- Commands use 3-mode system: Planner (decompose), Implementer (execute), Tester (validate)
- Token-efficient through shared YAML patterns loaded via @include directives
- Sub-agent architecture spawns specialized assistants per task

## Development Workflow

- Test changes: try commands with real examples before committing
- Documentation: update docs/PHASES.md for completed work only
- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Feature additions: wait for user feedback - no speculative features
