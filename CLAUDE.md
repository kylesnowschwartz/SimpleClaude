# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `.claude/` is the template source for SimpleClaude's commands
- Feature additions: ALWAYS wait for user feedback - no speculative features
- Command changes: update TEMPLATE.md first, then apply to all 5 core-commands (sc-create, sc-modify, sc-understand, sc-fix, sc-review)
- Maintain consistency across all commands - no deviations from template unless instructed otherwise

## Build Commands

- Test installation: `./install.sh` (dry-run by default)
- Install: `./install.sh --execute` (Backs up existing configuration)
- No build/compile steps - SimpleClaude is pure configuration

## Architecture

- SimpleClaude: 5 natural language commands that transform requests into structured AI workflows
- Commands use 3-mode system: Planner (decompose), Implementer (execute), Tester (validate)
- Token-efficient through shared YAML patterns loaded via @include directives
- Sub-agent architecture spawns specialized assistants per task

## Versioning

- Current version: 0.2.1 (beta)
- Follow [SemVer](https://semver.org/): fix = patch, feat = minor, breaking = major
- **Assess each commit: does it warrant a release?** Bug fixes and new features should trigger releases
- Release process: update README badge → commit → `git tag vX.X.X` → push with tags

## Development Workflow

- Test changes: try commands with real examples before committing
- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
