# Project: SimpleClaude

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations through specialized agents. Features 4+1 intent-based commands that understand user goals and orchestrate intelligent workflows with a lightweight agent architecture.

## Features

- 4+1 intent-based commands (sc-plan, sc-work, sc-explore, sc-review, sc-workflow) that understand user goals
- Lightweight agent architecture with token-efficient execution through Task() calls
- 5 specialized agents for context analysis, documentation retrieval, testing, and research
- Installation system with backup and dry-run capabilities
- Template-driven consistency across all commands
- Smart selection process that handles tasks directly when possible, uses agents only when needed
- Intent recognition that understands user goals and routes to appropriate execution
- Integration with Claude Code platform maintaining backward compatibility

## Tech Stack

- Shell Script installation system with comprehensive error handling
- Markdown-based command and agent definitions with YAML frontmatter
- Claude Code integration as target platform
- Git-based version control with SemVer practices (current: v1.0.0)

## Structure

- `.claude/commands/simpleclaude/` - 4+1 intent-based commands
- `.claude/agents/` - 5 specialized agents spawned via Task() calls
- `.claude/commands/extras/` - 8 optional experimental commands
- `install.sh` → `scripts/install.sh` (symlink) - main installation entry point
- `VERSION` - current version file
- `.pre-commit-config.yaml` - quality assurance hooks

## Architecture

Commands follow agent orchestration pattern: Request Analysis → Scope Identification → Approach Selection → Agent Spawning → Parallel Execution → Result Synthesis. Each command uses 4-option decision tree to determine if direct handling or agent delegation is needed. Agents work in isolated contexts for token efficiency, with minimal viable agent sets deployed per task.

## Commands

- Build: N/A (markdown-based configuration)
- Test: Integration testing via real-world validation in development projects
- Test Individual Command: `claude -p "/simpleclaude:sc-[command] [arguments]"` (e.g., `claude -p "/simpleclaude:sc-plan How should I make a peanut butter and jelly sandwich?"`)
- Lint: Pre-commit hooks configured
- Install: `./install.sh --execute` (with `./install.sh` for dry-run preview)
- Install Extras: `./install.sh --extras --execute`

## Testing

Testing approach focuses on real-world validation in actual development projects rather than unit tests. Quality assurance through pre-commit hooks, backup system in installer, and dry-run capability for safe preview of changes. Command consistency ensured through shared template structure from `.claude/commands/simpleclaude/TEMPLATE.md`.
