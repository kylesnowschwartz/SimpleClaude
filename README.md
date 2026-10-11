# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-7.13.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

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
claude plugin install sc-research
claude plugin install sc-skills
claude plugin install sc-docs
claude plugin install sc-mods
```

**What's included:**

- **sc-core**: Intent-based commands and specialized agents for planning, implementation, exploration, and review
- **sc-hooks** _(optional)_: Auto-formatting and lint checks on stop, plus tool monitoring (steers GitHub WebFetch to the `gh` CLI)
- **sc-output-styles** _(optional)_: Curated output styles — personality-driven (Linus, Austen, Lovelace, Ousterhout, Starfleet, Mayo Clinic) and structured formats (HTML, JSON, Markdown, Semantic Markdown, YAML)
- **sc-extras** _(optional)_: The `sc-review-and-refactor` skill, which routes review and refactoring work to a named technique (safe refactoring, test-quality review, verifying findings and claims, root-cause analysis, PR review threads); general diff review goes to the built-in `/code-review`. Also adversarial analysis, context wizards, and clean-room design
- **sc-research** _(optional)_: Research agents for library source (via opensrc), GitHub search (via gh), and web research
- **sc-skills** _(optional)_: Codebase pattern detection, hypothesis testing, Socratic thinking, file querying, frontend design, image generation, and command generation
- **sc-docs** _(optional)_: Writing and diagram skills: `human-writing` for plain prose in Slack messages, emails, PRs, issues, and docs, and `sc-mermaid` for flowchart and sequence diagrams
- **sc-mods** _(optional)_: Claude Code mods. Draws mermaid diagrams in replies as Unicode text in the terminal, adds prompt-jump buttons above the prompt, and a copy button under each reply. See [`plugins/sc-mods/README.md`](plugins/sc-mods/README.md)

## Updating

### Via Claude Code CLI

```bash
claude plugin marketplace update simpleclaude
claude plugin install sc-core@simpleclaude
claude plugin install sc-hooks@simpleclaude
claude plugin install sc-output-styles@simpleclaude
claude plugin install sc-extras@simpleclaude
claude plugin install sc-research@simpleclaude
claude plugin install sc-skills@simpleclaude
claude plugin install sc-docs@simpleclaude
claude plugin install sc-mods@simpleclaude
```

## Quick Start

```bash
# Core development commands
/sc-core:sc-plan "How should I add authentication to this app?"
/sc-core:sc-work "Add JWT authentication with login/logout"
/sc-core:sc-explore "How does the current database layer work?"
/sc-core:sc-review "Check security vulnerabilities in auth module"
/sc-core:sc-workflow "Start structured development for OAuth support"

# Review and refactoring
/code-review high my-branch               # Built-in general review: level first, then target
/sc-extras:sc-review-and-refactor did this branch do everything the ticket asked?   # Requirements trace
/sc-extras:sc-review-and-refactor resolve the review threads on PR 42              # PR review threads
/sc-extras:sc-review-and-refactor why does the login test fail?                     # Root-cause analysis

# Utilities
/sc-docs:sc-mermaid flowchart auth        # Generate architecture diagrams
/sc-skills:sc-worktrees                   # Manage git worktrees
```

## Architecture

SimpleClaude uses a **lightweight agent architecture** with intent-based commands:

- **Command Structure**: Intent-based interfaces that understand user goals (plan, work, explore, review, workflow)
- **Specialized Agents**: Context-specific assistants spawned via `Task()` calls
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands understand intent, agents execute specialized tasks

> Runtime configuration (environment variables) for sc-hooks is documented at [`plugins/sc-hooks/README.md`](plugins/sc-hooks/README.md).

### Agent System

Each command automatically spawns appropriate agents:

- `sc-code-explorer` - Traces execution paths and maps architecture
- `sc-code-architect` - Designs feature architectures from existing patterns
- `sc-code-reviewer` - Reviews code for bugs, security, and convention adherence

The optional `sc-research` plugin adds research agents that Claude picks by description:

- `sc-research-github` - Searches across GitHub to compare libraries, evaluate projects, and find issues/PRs
- `sc-research-repo` - Fetches a library's source with opensrc and searches it for docs, APIs, and source code
- `sc-research-web` - Searches the web for news, blogs, tutorials, and community discussions

### Project Structure

```
SimpleClaude/
├── plugins/
│   ├── sc-core/        # Core plugin: commands & agents
│   ├── sc-hooks/                 # Hooks plugin: auto-format, lint, tool monitoring
│   ├── sc-output-styles/         # Output styles plugin: personality & structured formats
│   ├── sc-extras/                # Extras plugin: review-and-refactor skill, utility commands
│   ├── sc-research/              # Research plugin: library source, GitHub, and web agents
│   ├── sc-skills/                # Skills plugin: patterns, design, querying
│   ├── sc-docs/                  # Docs plugin: writing and mermaid diagram skills
│   └── sc-mods/                  # Mods plugin: mermaid diagrams, prompt jumps, reply copy
├── scripts/
│   ├── install.rb                # Installation/update script
│   └── update-merman.sh          # Pins the merman release sc-mods downloads
├── docs/                         # Documentation
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.
