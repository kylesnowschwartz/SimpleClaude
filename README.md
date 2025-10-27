# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations through specialized agents.

## Installation

### Option 1: Direct from GitHub (Plugins Only)

Install SimpleClaude plugins directly without cloning:

```bash
# Add SimpleClaude marketplace from GitHub
claude plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude

# Install core framework (required)
claude plugin install simpleclaude

# Install hooks (optional but recommended)
claude plugin install sc-hooks

# Install extra utilities (optional)
claude plugin install sc-extras
```

Or from within Claude Code:

```bash
/plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude
/plugin install simpleclaude
/plugin install sc-hooks
/plugin install sc-extras
```

**What's included:**
- **simpleclaude**: 4+1 core commands and 6 specialized agents
- **sc-hooks** _(optional)_: Session management, tool monitoring, and notification hooks
- **sc-extras** _(optional)_: 7 advanced utility commands for debugging, GitHub workflows, git worktrees, task validation, command creation, feature discovery, and pre-commit setup

### Option 2: Full Installation (Plugins + Auxiliary Components)

Clone the repository and run the interactive installer to also get output styles, status lines, and settings template:

```bash
# Clone the repository
git clone https://github.com/kylesnowschwartz/SimpleClaude.git
cd SimpleClaude

# Preview what will be installed
./scripts/install.rb --dry-run

# Run interactive installer (installs plugins + auxiliary components)
./scripts/install.rb
```

**Additional components:**
- Output styles for custom response formatting
- Status line for session information display
- Settings template

## Updating

```bash
# Pull latest changes
cd SimpleClaude
git pull

# Update marketplace registration
claude plugin marketplace update simpleclaude

# Update installed plugins
claude plugin update simpleclaude
claude plugin update sc-hooks     # if installed
claude plugin update sc-extras    # if installed

# Update auxiliary components (optional)
./scripts/install.rb
```

## Quick Start

```bash
/sc-plan "How should I add authentication to this app?"
/sc-work "Add JWT authentication with login/logout"
/sc-explore "How does the current database layer work?"
/sc-review "Check security vulnerabilities in auth module"
/sc-workflow "Start structured development process"
```

## Architecture

SimpleClaude uses a **lightweight agent architecture** with intent-based commands:

- **4+1 Command Structure**: Intent-based interfaces that understand user goals
- **6 Core Agents**: Context-specific assistants spawned via `Task()` calls
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands understand intent, agents execute specialized tasks

### Agent System

Each command automatically spawns appropriate agents:

- `code-explorer` - Deeply analyzes existing codebase features by tracing execution paths and mapping architecture
- `code-architect` - Designs feature architectures by analyzing existing patterns and providing implementation blueprints
- `code-reviewer` - Reviews code for bugs, security vulnerabilities, and adherence to project conventions
- `repo-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `test-runner` - Runs tests and analyzes failures without making fixes
- `web-search-researcher` - Searches web for current information and research

This lightweight approach replaces previous heavyweight framework systems with focused, token-efficient specialized agents.

## Documentation

- [Project Vision](docs/VISION.md) - Philosophy, features, and architecture
- [Command Creation Guide](docs/AI_SLASH_COMMAND_CREATION_GUIDE.md) - How to create new slash commands
- [Hooks Usage Guide](docs/HOOKS_GUIDE.md) - How to create new slash commands

## Development

### Development Workflow

1. **Make changes** to `simple-claude/commands/` or `simple-claude/agents/`
2. **Test commands** in real projects
3. **Update documentation** if needed

### Project Structure

```
SimpleClaude/
├── simple-claude/
│   ├── commands/simpleclaude/    # 4+1 intent-based commands
│   ├── commands/extras/          # Optional experimental commands
│   ├── agents/                   # Lightweight agent definitions
│   ├── hooks/                    # Claude Code hook system
│   ├── output-styles/            # Custom output formatting styles
│   └── settings.example.json     # Example settings configuration
├── scripts/
│   └── install.rb                # Installation/update script
├── docs/                         # Documentation
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.

## Contributing

SimpleClaude follows a user-driven development approach:

1. Test the commands in real projects
2. Report issues with specific use cases
3. Suggest improvements based on actual needs
