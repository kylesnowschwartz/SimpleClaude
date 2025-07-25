# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-0.4.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations through specialized agents.

## Installation

```bash
# Clone the repository
git clone https://github.com/kylesnowschwartz/SimpleClaude.git
cd SimpleClaude

# Install dependencies
npm install --include=dev

# Preview what will be installed (dry-run by default)
./install.sh

# Install SimpleClaude to your Claude configuration
./install.sh --execute
```

## Updating

```bash
# Pull latest changes
git pull

# Update dependencies
npm install --include=dev

# Update SimpleClaude (Backs up existing configuration)
./install.sh --execute
```

## Quick Start

```bash
/sc-create "REST API with authentication"
/sc-modify "improve performance"
/sc-understand "how does this work?"
/sc-fix "TypeError in production"
/sc-review "check security"
```

## Architecture

SimpleClaude uses a **specialized agent architecture** for maximum efficiency:

- **5 Core Commands**: Natural language interfaces that understand plain English
- **7 Specialized Agents**: Context-specific assistants spawned via `Task()` calls
- **Token-Efficient Design**: Agents work in isolation with focused context
- **Clean Separation**: Commands orchestrate, agents execute specialized tasks

### Agent System

Each command automatically spawns appropriate agents:

- `context-analyzer` - Understand project structure and patterns
- `system-architect` - Design solutions and create implementation plans  
- `implementation-specialist` - Write code following established patterns
- `validation-review-specialist` - Verify quality and requirements
- `research-analyst` - Investigate and analyze without code changes
- `debugging-specialist` - Systematic troubleshooting and root cause analysis
- `documentation-specialist` - Create documentation and knowledge synthesis

This replaces the previous shared framework system with cleaner, more maintainable specialized agents.

## Documentation

- [Project Vision](docs/VISION.md) - Philosophy and features
- [Development Status](docs/PHASES.md) - Current status and roadmap
- [Quick Start Guide](docs/README.md) - Examples and usage

## Development

### Token Limit Monitoring

SimpleClaude uses [token-limit](https://github.com/azat-io/token-limit) to monitor token usage across commands and specialized agents:

```bash
# Check all token limits
npm run token-check
```

### Development Workflow

1. **Make changes** to `.claude/commands/` or `.claude/agents/`
2. **Check token limits** with `npm run token-check`
3. **Test commands** in real projects
4. **Update documentation** if needed

### Project Structure

```
SimpleClaude/
├── .claude/
│   ├── commands/simpleclaude/    # 5 natural language commands
│   ├── commands/extras/          # Optional experimental commands
│   └── agents/                   # Specialized agent definitions
├── docs/                         # Documentation
├── install.sh                    # Installation/update script
├── token-limit.config.ts         # Token monitoring configuration
└── README.md                     # This file
```

## Acknowledgments

SimpleClaude was inspired by [SuperClaude](https://github.com/NomenAK/SuperClaude) which demonstrated effective patterns for natural language command interfaces. SimpleClaude builds on concepts pioneered by the SuperClaude project and I thank NomenAK for putting in the hard yards with SuperClaude - an awesome project with powerful features.

## Contributing

SimpleClaude follows a user-driven development approach:

1. Test the commands in real projects
2. Report issues with specific use cases
3. Suggest improvements based on actual needs
