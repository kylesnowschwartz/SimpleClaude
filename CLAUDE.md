# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `.claude/` is the source directory for SimpleClaude's commands and agents
- Command changes: update commands consistently across all 4+1 core-commands (sc-plan, sc-work, sc-explore, sc-review, sc-workflow)

## Build Commands

- Test installation: `./install.sh` (dry-run by default)
- Install: `./install.sh --execute` (Backs up existing configuration)
- Extras: `./install.sh --extras --execute` (Install the 'extra' commands)

## Architecture

- SimpleClaude: 4+1 intent-based commands that understand user goals and orchestrate intelligent workflows
- **Lightweight agent architecture**: Commands spawn focused agents via `Task()` calls for token-efficient execution
- **5 lightweight agents**: Each handles specific responsibilities (context analysis, documentation retrieval, testing, research)
- Token-efficient through isolated agent contexts and focused task delegation

## Versioning

- Current version: 1.0.0
- Follow [SemVer](https://semver.org/): fix = patch, feat = minor, breaking = major
- **Assess each commit: does it warrant a release?** Bug fixes and new features should trigger releases
- Release process: update README badge → update CLAUDE.md version → update VERSION file → commit → `git tag vX.X.X` → push with tags

## Development Workflow

- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
- Reference ./docs/AI_SLASH_COMMAND_CREATION_GUIDE.md if creating a new slash (/) command
