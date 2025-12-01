# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `plugins/` contains all SimpleClaude plugins (simpleclaude, sc-hooks, sc-output-styles, sc-extras)
- Command changes: update commands consistently across all 4+1 core-commands (sc-plan, sc-work, sc-explore, sc-review, sc-workflow)
- Plugin structure: Each plugin in `plugins/` has `.claude-plugin/plugin.json`, plus optional `commands/`, `agents/`, `hooks/`, `output-styles/` directories

## Build Commands

- Preview installation: `./scripts/install.rb --dry-run`
- Install: `./scripts/install.rb` (Interactive with prompts, backs up existing configuration)

## Testing

SimpleClaude has Ruby-based tests in the `test/` directory:

```bash
# Run detector consistency tests (unit tests)
./test/test_detector_consistency.rb

# Run reflexive agreement analysis (requires backup directory)
./test/test_reflexive_agreement.rb /path/to/backups

# Install test dependencies first if needed
bundle install
```

The detector consistency test verifies reflexive agreement detection logic with predefined test cases and should pass cleanly.

## Architecture

SimpleClaude consists of 4 plugins:
- **simpleclaude**: Core framework with 4+1 intent-based commands and 6 specialized agents
- **sc-hooks**: Session management, tool monitoring, and notification system
- **sc-output-styles**: 8 curated output styles (personality-driven + structured formats)
- **sc-extras**: 7 utility commands for advanced workflows

**Lightweight agent architecture**: Commands spawn focused agents via `Task()` calls for token-efficient execution
- **6 specialized agents**: code-architect, code-explorer, code-reviewer, repo-documentation-expert, test-runner, web-search-researcher
- Token-efficient through isolated agent contexts and focused task delegation

## Versioning

- Current version: 2.2.0
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

## Vendored Dependencies

The `claude_hooks` gem is vendored into `plugins/sc-hooks/vendor/claude_hooks/` - no gem installation required for end users.

### Updating vendored claude_hooks

```bash
./scripts/vendor-claude-hooks.sh
```

This fetches the latest from the fork, strips dev files, and updates the vendor directory. Commit the changes afterward.

### Check for updates without applying

```bash
./scripts/vendor-claude-hooks.sh --check
```

## Development Workflow

- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
- Reference ./docs/AI_SLASH_COMMAND_CREATION_GUIDE.md if creating a new slash (/) command
