# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-6.8.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations. Comes with a set of user-commands, sub-agents, hooks, and utilities designed for real-world software development tasks. Completely dogfooded by its creator for building production software in the workplace and for personal projects. Expect frequent updates, enhancements, and breaking changes.

## Installation

### Option 1: Direct from GitHub (Recommended)

Install SimpleClaude plugins directly from the commandline:

```bash
claude plugin marketplace add https://github.com/kylesnowschwartz/SimpleClaude
claude plugin install sc-core
claude plugin install sc-hooks
claude plugin install sc-output-styles
claude plugin install sc-extras
claude plugin install sc-skills
claude plugin install sc-refactor
```

**What's included:**
- **sc-core**: Intent-based commands and specialized agents for planning, implementation, exploration, and review
- **sc-hooks** _(optional)_: Session management, tool monitoring, plan review gating, and notification hooks
- **sc-output-styles** _(optional)_: Curated output styles — personality-driven (Linus, Austen, Lovelace, Ousterhout, Starfleet, Mayo Clinic) and structured formats (HTML, JSON, Markdown, Semantic Markdown, YAML)
- **sc-extras** _(optional)_: Utility commands for root cause analysis, claim verification, adversarial analysis, and context wizards
- **sc-skills** _(optional)_: Mermaid diagrams, codebase pattern detection, hypothesis testing, Socratic thinking, file querying, frontend design, image generation, and command generation
- **sc-refactor** _(optional)_: PR review with ticket integration, codebase health checks, and specialized analysis agents for refactoring workflows

## Updating

### Via Claude Code CLI

```bash
claude plugin marketplace update simpleclaude
claude plugin install sc-core@simpleclaude
claude plugin install sc-hooks@simpleclaude
claude plugin install sc-output-styles@simpleclaude
claude plugin install sc-extras@simpleclaude
claude plugin install sc-skills@simpleclaude
claude plugin install sc-refactor@simpleclaude
```

## Quick Start

```bash
# Core development commands
/sc-core:sc-plan "How should I add authentication to this app?"
/sc-core:sc-work "Add JWT authentication with login/logout"
/sc-core:sc-explore "How does the current database layer work?"
/sc-core:sc-review "Check security vulnerabilities in auth module"
/sc-core:sc-workflow "Start structured development for OAuth support"

# PR review and refactoring
/sc-refactor:sc-review-pr 42              # Full PR review with ticket context
/sc-refactor:sc-pr-comments 42            # Fetch unresolved PR comments
/sc-refactor:sc-resolve-pr-parallel 42    # Batch resolve PR feedback
/sc-refactor:sc-cleanup src/              # Post-AI session cleanup
/sc-refactor:sc-codebase-health src/      # Full codebase health analysis

# Utilities
/sc-extras:sc-five-whys                   # Root cause analysis
/sc-skills:sc-mermaid flowchart auth      # Generate architecture diagrams
/sc-extras:sc-validate-task               # Validate completed work
/sc-skills:sc-worktrees                   # Manage git worktrees

/sc-hooks:sc-sounds                       # Configure notification sounds
```

## Architecture

SimpleClaude uses a **lightweight agent architecture** with intent-based commands:

- **Command Structure**: Intent-based interfaces that understand user goals (plan, work, explore, review, workflow)
- **Specialized Agents**: Context-specific assistants spawned via `Task()` calls
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands understand intent, agents execute specialized tasks

### Agent System

Each command automatically spawns appropriate agents:

- `sc-code-explorer` - Traces execution paths and maps architecture
- `sc-code-architect` - Designs feature architectures from existing patterns
- `sc-code-reviewer` - Reviews code for bugs, security, and convention adherence
- `sc-research-github` - Searches across GitHub to compare libraries, evaluate projects, and find issues/PRs
- `sc-research-repo` - Clones and searches a specific library's repo for docs, APIs, and source code
- `sc-research-web` - Searches the web for news, blogs, tutorials, and community discussions

### Project Structure

```
SimpleClaude/
├── plugins/
│   ├── sc-core/        # Core plugin: commands & agents
│   ├── sc-hooks/                 # Hooks plugin: session management & notifications
│   ├── sc-output-styles/         # Output styles plugin: personality & structured formats
│   ├── sc-extras/                # Extras plugin: utility commands
│   ├── sc-skills/                # Skills plugin: diagrams, patterns, design, querying
│   └── sc-refactor/              # Refactor plugin: PR review & analysis agents
├── scripts/
│   └── install.rb                # Installation/update script
├── docs/                         # Documentation
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.
