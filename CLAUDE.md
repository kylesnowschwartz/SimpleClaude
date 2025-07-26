# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `.claude/` is the template source for SimpleClaude's commands and agents
- Feature additions: ALWAYS wait for user feedback - no speculative features
- Command changes: update commands consistently across all 5 core-commands (sc-create, sc-modify, sc-understand, sc-fix, sc-review)
- Agent changes: maintain consistency across all 7 specialized agents in `.claude/agents/`
- Maintain consistency across all commands and agents - no deviations unless instructed otherwise

## Build Commands

- Test installation: `./install.sh` (dry-run by default)
- Install: `./install.sh --execute` (Backs up existing configuration)
- No build/compile steps - SimpleClaude is pure configuration

## Architecture

- SimpleClaude: 5 natural language commands that transform requests into structured AI workflows
- Commands use 3-mode system: Planner (decompose), Implementer (execute), Tester (validate)
- **Agent-based architecture**: Commands spawn specialized agents via `Task()` calls for focused execution
- **7 specialized agents**: Each handles specific responsibilities (context analysis, implementation, validation, etc.)
- Token-efficient through isolated agent contexts and focused task delegation
- Replaces previous shared framework system with cleaner, more maintainable agent specialization

## Versioning

- Current version: 0.4.0 (beta)
- Follow [SemVer](https://semver.org/): fix = patch, feat = minor, breaking = major
- **Assess each commit: does it warrant a release?** Bug fixes and new features should trigger releases
- Release process: update README badge → update CLAUDE.md version → update package.json version → update VERSION file → commit → `git tag vX.X.X` → push with tags

## Development Workflow

- Test changes: try commands with real examples before committing
- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
