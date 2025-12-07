# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-2.5.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations. Comes with a set of user-commands, sub-agents, hooks, and utilities designed for real-world software development tasks.

## Installation

### Option 1: Direct from GitHub (Recommended)

Install SimpleClaude plugins directly without cloning:

```bash
# Add SimpleClaude marketplace from GitHub
claude plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude

# Install core framework (required)
# Installs 4+1 commands and 6 specialized agents
claude plugin install simpleclaude

# Install hooks (optional but recommended)
claude plugin install sc-hooks

# Install output styles (optional but recommended)
claude plugin install sc-output-styles

# Install extra utilities (optional)
claude plugin install sc-extras

# Install Age of Empires sounds (optional, fun)
claude plugin install sc-age-of-claude
```

Or from within Claude Code:

```bash
/plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude
/plugin install simpleclaude
/plugin install sc-hooks
/plugin install sc-output-styles
/plugin install sc-extras
/plugin install sc-age-of-claude
```

**What's included:**
- **simpleclaude**: 4+1 core commands and 6 specialized agents
- **sc-hooks** _(optional)_: Session management, tool monitoring, and notification hooks
- **sc-output-styles** _(optional)_: 8 curated output styles (personality-driven: Linus, Austen, Starfleet; structured: HTML, JSON, Markdown, Semantic Markdown, YAML)
- **sc-extras** _(optional)_: 7 advanced utility commands for debugging, GitHub workflows, git worktrees, task validation, command creation, feature discovery, and pre-commit setup
- **sc-age-of-claude** _(optional)_: Age of Empires sound effects for Claude Code events

### Option 2: Clone and Install with Ruby Script

Clone the repository and run the interactive installer for additional components like status lines:

```bash
# Clone the repository
git clone https://github.com/kylesnowschwartz/SimpleClaude.git
cd SimpleClaude

# Preview what will be installed
./scripts/install.rb --dry-run

# Run interactive installer (installs plugins + status-lines)
./scripts/install.rb
```

**Additional components via script:**
- Status line for session information display
- Settings template _(manual configuration required)_

**Note:** Output styles are now installed via the `sc-output-styles` plugin (Option 1 above).

## Updating

### Via Claude Code CLI

```bash
# Pull latest changes
cd SimpleClaude
git pull

# Update marketplace registration
claude plugin marketplace update simpleclaude

# Update installed plugins
claude plugin install simpleclaude@simpleclaude
claude plugin install sc-hooks@simpleclaude         # if installed
claude plugin install sc-output-styles@simpleclaude # if installed
claude plugin install sc-extras@simpleclaude        # if installed

# Update auxiliary components (optional)
./scripts/install.rb
```

### Via Claude Code Interactive UI

1. Open Claude Code
2. `/plugin`
3. Follow prompts to update installed plugins and marketplace registration

## Quick Start

```bash
/simpleclaude:sc-plan "How should I add authentication to this app? Use the Code code-explorer and code-architect agents to help plan it out."
/simpleclaude:sc-work "Add JWT authentication with login/logout. First use the code-architect agent to design the architecture, then implement it."
/simpleclaude:sc-explore "How does the current database layer work? Use the code-explorer agent to analyze it." 
/simpleclaude:sc-review "Check security vulnerabilities in auth module. Use the code-reviewer agent to help find issues."
/simpleclaude:sc-workflow "Start structured development process for adding OAuth support. Use code-explorer, code-architect, and code-reviewer agents as needed."

/sc-extras:sc-create-command
/sc-extras:sc-eastereggs
/sc-extras:sc-five-whys
/sc-extras:sc-pr-comments
/sc-extras:sc-pre-commit-setup
/sc-extras:sc-validate-task
/sc-extras:sc-worktrees

/sc-hooks:sc-sounds aoe   # Switch to Age of Empires notification sounds
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

### Project Structure

```
SimpleClaude/
├── plugins/
│   ├── simpleclaude/             # Core plugin: 4+1 commands & 6 agents
│   ├── sc-hooks/                 # Hooks plugin: session management & notifications
│   ├── sc-output-styles/         # Output styles plugin: 8 curated styles
│   ├── sc-extras/                # Extras plugin: 7 utility commands
│   ├── sc-age-of-claude/         # Sound effects plugin: AoE themed audio
│   └── vendor/                   # Shared vendored dependencies
├── scripts/
│   └── install.rb                # Installation/update script
├── docs/                         # Documentation
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.
