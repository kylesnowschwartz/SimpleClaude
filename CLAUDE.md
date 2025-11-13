# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `simple-claude/` is the source directory for SimpleClaude's commands and agents
- Command changes: update commands consistently across all 4+1 core-commands (sc-plan, sc-work, sc-explore, sc-review, sc-workflow)

## Build Commands

- Preview installation: `./scripts/install.rb --dry-run`
- Install: `./scripts/install.rb` (Interactive with prompts, backs up existing configuration)

## Architecture

- SimpleClaude: 4+1 intent-based commands that understand user goals and orchestrate intelligent workflows
- **Lightweight agent architecture**: Commands spawn focused agents via `Task()` calls for token-efficient execution
- **5 lightweight agents**: Each handles specific responsibilities (context analysis, documentation retrieval, testing, research)
- Token-efficient through isolated agent contexts and focused task delegation
- Command template is located at `simple-claude/commands/simpleclaude/TEMPLATE.md`

## Versioning

- Current version: 2.1.0
- Follow [SemVer](https://semver.org/): fix = patch, feat = minor, breaking = major
- **Assess each commit: does it warrant a release?** Bug fixes and new features should trigger releases
- Release process:
  1. Update README.md badge version
  2. Update CLAUDE.md version
  3. Update VERSION file
  4. Update `.claude-plugin/marketplace.json` (top-level version + affected plugin versions in plugins array)
  5. Update `plugins/<plugin-name>/.claude-plugin/plugin.json` for affected plugins
  6. Commit: `git commit -m "chore: Bump version to vX.X.X"`
  7. Tag: `git tag vX.X.X`
  8. Push: `git push && git push --tags`

## Development Workflow

- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
- Reference ./docs/AI_SLASH_COMMAND_CREATION_GUIDE.md if creating a new slash (/) command
