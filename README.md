# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations through specialized agents.

## Installation

```bash
# Clone the repository
git clone https://github.com/kylesnowschwartz/SimpleClaude.git
cd SimpleClaude

# Preview what will be installed (dry-run by default)
./install.sh

# Install SimpleClaude to your Claude configuration
./install.sh --execute
```

## Updating

```bash
# Pull latest changes
git pull

# Update SimpleClaude (Backs up existing configuration)
./install.sh --execute
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
- **4 Specialized Agents**: Context-specific assistants spawned via `Task()` calls  
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands understand intent, agents execute specialized tasks

### Agent System

Each command automatically spawns appropriate agents:

- `context-analyzer` - Maps project structure, technology stack, and existing patterns
- `repository-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `test-runner` - Runs tests and analyzes failures without making fixes
- `web-search-researcher` - Searches web for current information and research

This lightweight approach replaces previous heavyweight framework systems with focused, token-efficient specialized agents.

## Documentation

- [Project Vision](docs/VISION.md) - Philosophy and features
- [Development Status](docs/PHASES.md) - Current status and roadmap
- [Quick Start Guide](docs/README.md) - Examples and usage

## Development

### Development Workflow

1. **Make changes** to `.claude/commands/` or `.claude/agents/`
2. **Test commands** in real projects
3. **Update documentation** if needed

### Project Structure

```
SimpleClaude/
├── .claude/
│   ├── commands/simpleclaude/    # 4+1 intent-based commands
│   ├── commands/extras/          # Optional experimental commands  
│   └── agents/                   # Lightweight agent definitions
├── docs/                         # Documentation
├── install.sh                    # Installation/update script
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.

## Contributing

SimpleClaude follows a user-driven development approach:

1. Test the commands in real projects
2. Report issues with specific use cases
3. Suggest improvements based on actual needs
