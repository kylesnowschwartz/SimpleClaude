**Purpose**: Intelligently setup and enhance pre-commit configurations for any repository with context-aware analysis

Intelligent pre-commit configuration system that analyzes existing setups and repository characteristics to create or enhance `.pre-commit-config.yaml` with appropriate hooks, preserving customizations while adding missing essential validations.

---

## Command Execution

- Analyze existing @.pre-commit-config.yaml configuration
- Analyze existing @.git/hooks/pre-commit configuration
- Install pre-commit hooks if not already installed
- Run validation tests on all files
- Display status and recommendations

**Auto-Spawning:** Spawns specialized sub-agents for parallel task execution.  
**Context Detection:** Analyze existing configuration → Detect project type and file patterns → Select appropriate hooks → Generate enhanced configuration → Install pre-commit

## Core Principle: Use Standard Battle-Tested Configurations

**CRITICAL**: Always use official remote repository hooks from well-maintained sources. NEVER create custom local implementations unless absolutely necessary for project-specific requirements.

### Standard Hook Sources (Preferred)

- `https://github.com/pre-commit/pre-commit-hooks` - Core file hygiene and validation hooks
- `https://github.com/koalaman/shellcheck-precommit` - Shell script analysis
- `https://github.com/mvdan/sh` - Shell script formatting
- `https://github.com/igorshubovych/markdownlint-cli` - Markdown linting

### Why Standard Hooks Are Better

- **Environment Isolation**: Pre-commit manages hook dependencies automatically
- **Version Management**: Stable, tested versions with clear upgrade paths
- **Community Maintenance**: Regular updates and bug fixes from maintainers
- **Reliability**: Battle-tested across thousands of repositories
- **Documentation**: Comprehensive docs and community support

### Avoid Local Implementations

- `repo: local` hooks should be used sparingly and only for truly project-specific needs
- Never use local implementations for standard tools like shellcheck, shfmt, markdownlint
- Local hooks require system-wide tool installation and are more brittle

## Dotfiles-Specific Hook Categories

### File Hygiene Hooks

- `trailing-whitespace` - Remove trailing whitespace (exclude .md files)
- `end-of-file-fixer` - Ensure files end with newline
- `check-merge-conflict` - Check for merge conflict markers
- `check-added-large-files` - Prevent large file commits

### Configuration File Validation

- `check-yaml` - Validate YAML syntax (starship.toml, workflows)
- `check-json` - Validate JSON syntax (settings, configs)
- `check-toml` - Validate TOML syntax (starship.toml, cargo configs)

### Shell Script Quality

- `shellcheck` - Shell script static analysis
- `shfmt` - Shell script formatting
- `check-executables-have-shebangs` - Ensure executable scripts have shebangs

### Git Repository Hygiene

- `check-case-conflict` - Check for case conflicts
- `mixed-line-ending` - Check for mixed line endings
- `check-symlinks` - Check for broken symlinks

### Documentation Quality

- `markdownlint` - Markdown linting and formatting
- `check-docstring-first` - Python docstring validation (if Python files exist)

### Security and Safety Hooks

- `detect-private-key` - Prevent committing private keys or sensitive data
- `check-ast` - Validate Python syntax (if Python files exist)

## Global Configuration Options

### Default Hook Types

- `default_install_hook_types: [pre-commit, pre-push]` - Install hooks for both commit and push stages
- Allows running quick checks on commit and comprehensive validation on push

### Fail-Fast Behavior

- `fail_fast: false` - Run all hooks even if some fail, providing complete feedback
- Set to `true` for faster feedback cycles during active development

### Stage Configuration

- `default_stages: [pre-commit]` - Most hooks run during pre-commit stage
- Individual hooks can override with specific `stages` configuration

## Default Pre-commit Configuration Template

```yaml
# Global Configuration
default_install_hook_types: [pre-commit, pre-push]
default_stages: [pre-commit]
fail_fast: false

repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0
    hooks:
      - id: trailing-whitespace
        exclude: '\.md$'
        stages: [pre-commit]
      - id: end-of-file-fixer
        stages: [pre-commit]
      - id: check-merge-conflict
        stages: [pre-commit]
      - id: check-added-large-files
        stages: [pre-commit]
        args: [--maxkb=1024]
      - id: check-yaml
        stages: [pre-commit]
      - id: check-json
        stages: [pre-commit]
      - id: check-toml
        stages: [pre-commit]
      - id: check-case-conflict
        stages: [pre-commit]
      - id: mixed-line-ending
        stages: [pre-commit]
      - id: check-executables-have-shebangs
        stages: [pre-commit]
      - id: check-symlinks
        stages: [pre-commit]
      - id: detect-private-key
        stages: [pre-commit]
      - id: check-ast
        types: [python]
        stages: [pre-commit]

  - repo: https://github.com/koalaman/shellcheck-precommit
    rev: v0.10.0
    hooks:
      - id: shellcheck
        args: [--severity=warning]
        stages: [pre-commit]

  - repo: https://github.com/mvdan/sh
    rev: v3.8.0
    hooks:
      - id: shfmt
        args: [-w, -i, "2"]
        stages: [pre-commit]

  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: v0.41.0
    hooks:
      - id: markdownlint
        args: [--fix]
        stages: [pre-commit]
```

## Enhanced Installation Process

### Phase 1: Discovery and Analysis

1. **Existing Configuration Analysis**:

   - Check for existing `.pre-commit-config.yaml` file
   - Parse current hooks, versions, and custom configurations
   - Identify user customizations and exclusion patterns
   - Assess hook performance and staging setup

2. **Project Type Detection**:
   - Scan for language indicators (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.)
   - Detect frameworks and build tools
   - Identify file patterns and repository structure
   - Determine CI/CD integration requirements

### Phase 2: Intelligent Configuration

3. **Configuration Enhancement Strategy**:

   - Preserve existing hooks and user customizations
   - Suggest missing hooks based on project type
   - Recommend version updates for outdated hooks
   - Identify conflicting or redundant hooks

4. **Incremental Configuration Generation**:
   - Merge existing configuration with recommended enhancements
   - Maintain user-specified exclusion patterns and arguments
   - Add missing global configuration options (fail_fast, stages)
   - Generate backup of original configuration

### Phase 3: Installation and Validation

5. **Pre-commit Environment Validation**:

   - Verify `pre-commit --version` is available and functional
   - Check `pre-commit --help` for supported commands and options
   - Validate system dependencies and installation integrity
   - Exit gracefully if pre-commit is not properly installed

6. **Hook Installation**:

   - Run `pre-commit install` to setup default hook types (pre-commit, pre-push)
   - Install any additional hook types based on project needs

7. **Progressive Validation**:

   - Test existing hooks first to ensure no regressions
   - Run new hooks incrementally to identify conflicts
   - Execute `pre-commit run --all-files` for comprehensive validation
   - Test both pre-commit and pre-push stages

8. **Configuration Optimization**:
   - Analyze hook execution performance
   - Suggest staging optimizations (pre-commit vs pre-push)
   - Generate usage documentation and maintenance commands

## Advanced Configuration Options

### Custom Fail-Fast Setup

```bash
# For development - fail fast for quick feedback
pre-commit install --config .pre-commit-config-dev.yaml
```

### Hook Stage Management

- **pre-commit**: Fast checks for immediate feedback (syntax, formatting)

### Environment Validation Commands

```bash
pre-commit --version               # Verify installation and version
pre-commit --help                  # Check available commands and options
which pre-commit                   # Locate pre-commit binary
```

### Maintenance Commands

```bash
pre-commit autoupdate              # Update hook versions
pre-commit run --all-files         # Run on all files manually
pre-commit install --hook-type pre-push  # Add additional hook types
pre-commit uninstall              # Remove hooks
```

### Installation Validation Workflow

```bash
# 1. Environment check
pre-commit --version || { echo "ERROR: pre-commit not installed"; exit 1; }

# 2. Display available functionality
pre-commit --help

# 3. Setup hooks
pre-commit install
pre-commit install --hook-type pre-push

# 4. Validate configuration
pre-commit run --files .pre-commit-config.yaml
```
