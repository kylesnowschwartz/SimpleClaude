# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-4.4.1-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations. Comes with a set of user-commands, sub-agents, hooks, and utilities designed for real-world software development tasks. Completely dogfooded by its creator for building production software in the workplace and for personal projects. Expect frequent updates, enhancements, and breaking changes.

## Installation

### Option 1: Direct from GitHub (Recommended)

Install SimpleClaude plugins directly from the commandline:

```bash
claude plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude
claude plugin install simpleclaude-core
claude plugin install sc-hooks
claude plugin install sc-output-styles
claude plugin install sc-extras
claude plugin install sc-skills
claude plugin install sc-refactor
```

Or from within Claude Code:

```bash
/plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude
/plugin install simpleclaude-core
/plugin install sc-hooks
/plugin install sc-output-styles
/plugin install sc-extras
/plugin install sc-skills
/plugin install sc-refactor
```

**What's included:**
- **simpleclaude-core**: 4+1 core commands and 6 specialized agents
- **sc-hooks** _(optional)_: Session management, tool monitoring, and notification hooks
- **sc-output-styles** _(optional)_: 8 curated output styles (personality-driven: Linus, Austen, Starfleet; structured: HTML, JSON, Markdown, Semantic Markdown, YAML)
- **sc-extras** _(optional)_: 11 utility commands for mermaid diagrams, root cause analysis, claim verification, pre-commit setup, git worktrees, task validation, and more
- **sc-skills** _(optional)_: Playwright testing, frontend design iteration, Gemini image generation, and command generation tools
- **sc-refactor** _(optional)_: PR review with ticket integration, codebase health checks, and 9 specialized analysis agents for refactoring workflows

## Updating

### Via Claude Code CLI

```bash
claude plugin marketplace update simpleclaude
claude plugin install simpleclaude-core@simpleclaude
claude plugin install sc-hooks@simpleclaude
claude plugin install sc-output-styles@simpleclaude
claude plugin install sc-extras@simpleclaude
claude plugin install sc-skills@simpleclaude
claude plugin install sc-refactor@simpleclaude
```

## Quick Start

```bash
# Core development commands
/simpleclaude-core:sc-plan "How should I add authentication to this app?"
/simpleclaude-core:sc-work "Add JWT authentication with login/logout"
/simpleclaude-core:sc-explore "How does the current database layer work?"
/simpleclaude-core:sc-review "Check security vulnerabilities in auth module"
/simpleclaude-core:sc-workflow "Start structured development for OAuth support"

# PR review and refactoring
/sc-refactor:sc-review-pr 42              # Full PR review with ticket context
/sc-refactor:sc-pr-comments 42            # Fetch unresolved PR comments
/sc-refactor:sc-resolve-pr-parallel 42    # Batch resolve PR feedback
/sc-refactor:sc-cleanup src/              # Post-AI session cleanup
/sc-refactor:sc-codebase-health src/      # Full codebase health analysis

# Utilities
/sc-extras:sc-five-whys                   # Root cause analysis
/sc-extras:sc-mermaid-flowchart           # Generate architecture diagrams
/sc-extras:sc-pre-commit-setup            # Set up pre-commit hooks
/sc-extras:sc-validate-task               # Validate completed work
/sc-extras:sc-worktrees                   # Manage git worktrees

/sc-hooks:sc-sounds                       # Configure notification sounds
```

## Architecture

SimpleClaude uses a **lightweight agent architecture** with intent-based commands:

- **4+1 Command Structure**: Intent-based interfaces that understand user goals
- **6 Core Agents**: Context-specific assistants spawned via `Task()` calls
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands understand intent, agents execute specialized tasks

### Agent System

Each command automatically spawns appropriate agents:

- `sc-code-explorer` - Deeply analyzes existing codebase features by tracing execution paths and mapping architecture
- `sc-code-architect` - Designs feature architectures by analyzing existing patterns and providing implementation blueprints
- `sc-code-reviewer` - Reviews code for bugs, security vulnerabilities, and adherence to project conventions
- `sc-repo-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `sc-test-runner` - Runs tests and analyzes failures without making fixes
- `sc-web-search-researcher` - Searches web for current information and research

This lightweight approach replaces previous heavyweight framework systems with focused, token-efficient specialized agents.

### Project Structure

```
SimpleClaude/
├── plugins/
│   ├── simpleclaude-core/        # Core plugin: 4+1 commands & 6 agents
│   ├── sc-hooks/                 # Hooks plugin: session management & notifications
│   ├── sc-output-styles/         # Output styles plugin: 8 curated styles
│   ├── sc-extras/                # Extras plugin: 11 utility commands
│   ├── sc-skills/                # Skills plugin: Playwright, design iteration, image gen
│   └── sc-refactor/              # Refactor plugin: PR review & 9 analysis agents
├── scripts/
│   └── install.rb                # Installation/update script
├── docs/                         # Documentation
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.
