# SimpleClaude

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/kylesnowschwartz/SimpleClaude) [![GitHub issues](https://img.shields.io/github/issues/kylesnowschwartz/SimpleClaude)](https://github.com/kylesnowschwartz/SimpleClaude/issues)

A practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations.

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/SimpleClaude.git
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

# Update SimpleClaude (preserves your customizations)
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

## Documentation

- [Project Vision](docs/VISION.md) - Philosophy and features
- [Development Status](docs/PHASES.md) - Current status and roadmap
- [Quick Start Guide](docs/README.md) - Examples and usage

## Project Structure

```
SimpleClaude/
├── .claude/
│   ├── commands/simpleclaude/    # 5 natural language commands
│   ├── shared/simpleclaude/      # Shared patterns and modes
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

We build based on real usage, not theoretical features.
