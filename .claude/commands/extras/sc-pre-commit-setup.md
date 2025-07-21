**Purpose**: Intelligently setup and enhance pre-commit configurations with dynamic version resolution and robust error handling

Advanced pre-commit configuration system that dynamically discovers working repository versions, validates hook availability, and creates reliable `.pre-commit-config.yaml` configurations with automatic fallback strategies.

## Template Variables

- `{{PROJECT_LANGUAGES}}`: **NEW** - Comma-separated list of all detected languages (e.g., "javascript,shell,typescript")
- `{{PROJECT_TYPE}}`: **LEGACY** - Primary language for backwards compatibility (e.g., "typescript")
- `{{HOOKS_VERSION}}`: Dynamically discovered pre-commit-hooks version
- `{{SHELLCHECK_VERSION}}`: Latest shellcheck-py version from GitHub API
- `{{SHFMT_VERSION}}`: Latest shfmt version for shell formatting
- `{{MARKDOWNLINT_VERSION}}`: Latest markdownlint version for documentation
- `{{REPOSITORY_NAME}}`: Current repository name for configuration comments
- `{{FAIL_FAST}}`: Project-appropriate fail-fast setting (false for dev, true for CI)
- `{{MAX_FILE_SIZE}}`: Maximum file size limit based on primary language
- `{{HOOK_STAGES}}`: Optimized hook stages based on project characteristics

---

## Command Execution Strategy

**CRITICAL WORKFLOW**: Always follow this exact sequence for reliable setup:

1. **Environment Validation**: Verify pre-commit installation and basic functionality
2. **Dynamic Version Discovery**: Query repositories for latest working versions
3. **Repository Validation**: Test each repo URL and hook availability before configuration
4. **Incremental Configuration**: Build configuration step-by-step with validation
5. **Progressive Installation**: Install and test hooks incrementally with rollback capability

## Core Principle: Dynamic Version Resolution

**NEVER use hardcoded versions in configurations**. Always discover current working versions dynamically.

### Version Discovery Strategy

```bash
# STEP 1: Discover repository name for personalized configuration
{{REPOSITORY_NAME}}=$(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "repository")

# STEP 2: Always check repo availability and get latest tags
pre-commit try-repo https://github.com/pre-commit/pre-commit-hooks --all-files
pre-commit try-repo https://github.com/shellcheck-py/shellcheck-py --all-files

# STEP 3: Query GitHub API for latest release tags (preferred method)
{{HOOKS_VERSION}}=$(curl -s https://api.github.com/repos/pre-commit/pre-commit-hooks/releases/latest | jq -r .tag_name 2>/dev/null)
{{SHELLCHECK_VERSION}}=$(curl -s https://api.github.com/repos/shellcheck-py/shellcheck-py/releases/latest | jq -r .tag_name 2>/dev/null)
{{SHFMT_VERSION}}=$(curl -s https://api.github.com/repos/mvdan/sh/releases/latest | jq -r .tag_name 2>/dev/null)

# STEP 4: Use pre-commit sample-config as FALLBACK version reference ONLY
# CRITICAL: Always prioritize GitHub API versions over sample config (which may be stale)
pre-commit sample-config > .pre-commit-sample.yaml
SAMPLE_HOOKS_VERSION=$(grep -A 1 "pre-commit-hooks" .pre-commit-sample.yaml | grep "rev:" | awk '{print $2}' | head -1)
{{HOOKS_VERSION}}=${{{HOOKS_VERSION}}:-$SAMPLE_HOOKS_VERSION}

# STEP 5: Cross-validate versions and warn about discrepancies
if [[ "${{HOOKS_VERSION}}" != "$SAMPLE_HOOKS_VERSION" ]]; then
    echo "⚠️  Version mismatch detected:"
    echo "   GitHub API: ${{HOOKS_VERSION}}"
    echo "   Sample config: $SAMPLE_HOOKS_VERSION"
    echo "   Using GitHub API version (recommended)"
fi
```

### Repository Validation Protocol

**MANDATORY**: Test each repository before adding to configuration:

```bash
# Test repository accessibility and hook availability
pre-commit try-repo <REPO_URL> --verbose --all-files

# Only add repositories that pass validation
# If repo fails, use alternative or skip that hook category
# If repo fails, report to the User the repo and the failure
```

## Project Type Detection and Template Variable Assignment

```bash
# Multi-language project detection (replacing rigid hierarchy)
detect_project_languages() {
    local detected_langs=()

    # Check for manual override file first
    if [[ -f ".pre-commit-project-type" ]]; then
        {{PROJECT_LANGUAGES}}=$(head -n1 .pre-commit-project-type)
        echo "🔧 Using manual project type override: ${{PROJECT_LANGUAGES}}"
    else
        # High-priority config files (fast detection)
        [[ -f "package.json" ]] && detected_langs+=("javascript")
        [[ -f "pyproject.toml" || -f "requirements.txt" || -f "setup.py" ]] && detected_langs+=("python")
        [[ -f "go.mod" ]] && detected_langs+=("go")
        [[ -f "Cargo.toml" ]] && detected_langs+=("rust")
        [[ -f "pom.xml" || -f "build.gradle" ]] && detected_langs+=("java")
        [[ -f "Gemfile" ]] && detected_langs+=("ruby")

        # File extension scanning (performance optimized)
        [[ -n "$(find . -maxdepth 2 -name "*.sh" -o -name "*.bash" -print -quit)" ]] && detected_langs+=("shell")
        [[ -n "$(find . -maxdepth 2 -name "*.ts" -o -name "*.tsx" -print -quit)" ]] && detected_langs+=("typescript")
        [[ -n "$(find . -maxdepth 2 -name "*.php" -print -quit)" ]] && detected_langs+=("php")

        # Set PROJECT_LANGUAGES
        if [[ ${#detected_langs[@]} -eq 0 ]]; then
            {{PROJECT_LANGUAGES}}="unknown"
        else
            {{PROJECT_LANGUAGES}}=$(IFS=,; echo "${detected_langs[*]}")
        fi
    fi

    # Determine primary language for backwards compatibility
    get_primary_language "${{PROJECT_LANGUAGES}}"
}

# Expert-recommended priority-based primary language selection
get_primary_language() {
    local languages="$1"
    local priority_order=("typescript" "javascript" "python" "go" "rust" "java" "ruby" "shell" "php")

    # Convert comma-separated string to array
    IFS=',' read -ra lang_array <<< "$languages"

    # Find highest priority language
    for priority_lang in "${priority_order[@]}"; do
        for detected_lang in "${lang_array[@]}"; do
            if [[ "$detected_lang" == "$priority_lang" ]]; then
                {{PROJECT_TYPE}}="$priority_lang"
                return
            fi
        done
    done

    # Fallback to first detected language or unknown
    if [[ ${#lang_array[@]} -gt 0 ]]; then
        {{PROJECT_TYPE}}="${lang_array[0]}"
    else
        {{PROJECT_TYPE}}="unknown"
    fi
}

# Multi-language configuration mapping
configure_for_languages() {
    local languages="${{PROJECT_LANGUAGES}}"
    local primary="${{PROJECT_TYPE}}"

    # Base defaults
    {{FAIL_FAST}}="false"
    {{MAX_FILE_SIZE}}="1024"
    {{HOOK_STAGES}}="[pre-commit]"

    # Language-specific optimizations (expert "specific-over-general" strategy)
    case "$primary" in
        "typescript")
            {{FAIL_FAST}}="false"  # Conservative for mixed projects
            {{MAX_FILE_SIZE}}="2048"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
        "javascript")
            {{FAIL_FAST}}="false"  # Changed from true - safer for polyglot projects
            {{MAX_FILE_SIZE}}="2048"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
        "python")
            {{FAIL_FAST}}="false"
            {{MAX_FILE_SIZE}}="1024"
            {{HOOK_STAGES}}="[pre-commit, pre-push]"
            ;;
        "go")
            {{FAIL_FAST}}="false"
            {{MAX_FILE_SIZE}}="1024"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
        "rust")
            {{FAIL_FAST}}="false"
            {{MAX_FILE_SIZE}}="1024"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
        "shell")
            {{FAIL_FAST}}="false"
            {{MAX_FILE_SIZE}}="512"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
        *)
            # Conservative defaults for unknown/mixed
            {{FAIL_FAST}}="false"
            {{MAX_FILE_SIZE}}="1024"
            {{HOOK_STAGES}}="[pre-commit]"
            ;;
    esac

    # Multi-language adjustments
    if [[ "$languages" =~ "python" ]]; then
        {{HOOK_STAGES}}="[pre-commit, pre-push]"  # Python benefits from pre-push
    fi
}

# Execute the new detection and configuration logic
detect_project_languages
configure_for_languages
```

## Hook Repository Matrix (with Validation Commands)

### Core Repositories (Priority 1 - Essential)

**pre-commit/pre-commit-hooks** (File hygiene and validation):

```bash
# Validation command with template variables
pre-commit try-repo https://github.com/pre-commit/pre-commit-hooks --all-files
# Version: {{HOOKS_VERSION}}

# Available hooks (verify before adding):
- trailing-whitespace, end-of-file-fixer, check-merge-conflict
- check-added-large-files (max: {{MAX_FILE_SIZE}}kb), check-yaml, check-json, check-toml
- check-case-conflict, mixed-line-ending, detect-private-key
```

### Shell Script Repositories (Priority 2 - Language Specific)

**shellcheck-py/shellcheck-py** (Shell script analysis - PREFERRED): _Note: Despite the `-py` suffix, this lints SHELL scripts (.sh), not Python files. It's a Python wrapper around the Haskell ShellCheck tool._

```bash
# Validation command with template variables
pre-commit try-repo https://github.com/shellcheck-py/shellcheck-py --all-files
# Version: {{SHELLCHECK_VERSION}}
# Only include if: {{PROJECT_TYPE}} in ["shell", "mixed"] AND .sh files detected
# CLARIFICATION: shellcheck-py = Python package wrapper for shell script linting

# Alternative if main fails
pre-commit try-repo https://github.com/koalaman/shellcheck-precommit --all-files
```

**pre-commit/mirrors-shfmt** (Shell formatting - PREFERRED):

```bash
# Validation command with template variables
pre-commit try-repo https://github.com/pre-commit/mirrors-shfmt --all-files
# Version: {{SHFMT_VERSION}}
# Only include if: {{PROJECT_TYPE}} in ["shell", "mixed"]

# Alternative if mirrors fail
pre-commit try-repo https://github.com/mvdan/sh --all-files
```

### Documentation Repositories (Priority 3 - Optional)

**igorshubovych/markdownlint-cli** (Markdown linting):

```bash
# Validation command with template variables (may fail due to network issues)
pre-commit try-repo https://github.com/igorshubovych/markdownlint-cli --all-files
# Version: {{MARKDOWNLINT_VERSION}}
# Only include if: markdown files detected in repository

# Skip if validation fails - not critical for {{PROJECT_TYPE}} projects
```

## Dynamic Configuration Generation Process

### Phase 1: Environment and Repository Discovery

```bash
# CRITICAL: Execute these validation steps in sequence

# 1. Verify pre-commit installation
pre-commit --version || exit 1

# 2. Test repository accessibility with sample config
pre-commit sample-config > .pre-commit-sample.yaml
pre-commit -c .pre-commit-sample.yaml run --all-files --verbose

# 3. Extract working versions from sample config
grep -A 1 "repo:" .pre-commit-sample.yaml | grep "rev:" | head -3
```

### Phase 2: Incremental Configuration Building

**Build configuration incrementally, testing each addition**:

```yaml
# {{REPOSITORY_NAME}} Pre-commit Configuration
# Generated for {{PROJECT_TYPE}} project (detected: {{PROJECT_LANGUAGES}})
default_install_hook_types: {{HOOK_STAGES}}
default_stages: [pre-commit]
fail_fast: {{FAIL_FAST}}

repos:
  # Core file hygiene hooks (Priority 1 - Essential)
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: {{HOOKS_VERSION}}
    hooks:
      - id: trailing-whitespace
        exclude: '\.md$'
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb={{MAX_FILE_SIZE}}]
      - id: check-yaml
      - id: check-json
      - id: check-case-conflict
      - id: detect-private-key
```

### Phase 3: Progressive Hook Addition

**Add additional repositories only after validating previous ones work**:

```bash
# Test current configuration before adding more
pre-commit run --files README.md --verbose

# If successful, add next repository category
# If failed, diagnose and fix before proceeding
```

## Error Handling and Fallback Strategies

### Network Connectivity Issues

**COMMON PROBLEM**: GitHub access failures due to authentication or network issues

**SOLUTION HIERARCHY**:

1. **Primary**: Use pre-commit mirrors when available (`pre-commit/mirrors-*`)
2. **Secondary**: Use alternative repositories (shellcheck-py instead of koalaman)
3. **Fallback**: Create minimal configuration with only core hooks
4. **Emergency**: Skip problematic hook categories entirely

### Repository Access Failures

```bash
# If specific repo fails validation:
pre-commit try-repo https://github.com/problematic/repo --all-files
# ERROR: Could not access repository

# RESPONSE: Skip that category and continue
echo "NOTICE: Skipping shell linting hooks due to network issues"
echo "Add manually later: https://github.com/shellcheck-py/shellcheck-py"
```

### Version Compatibility Issues

```bash
# If hooks fail with version errors:
pre-commit run --all-files --verbose
# ERROR: InvalidManifestError or hook failures

# RESPONSE: Cross-validate GitHub API vs sample config versions
echo "GitHub API version: $(curl -s https://api.github.com/repos/pre-commit/pre-commit-hooks/releases/latest | jq -r .tag_name)"
pre-commit sample-config | grep -A 2 "pre-commit-hooks"

# Use sample config version as fallback only if GitHub API fails completely
```

## Robust Installation Workflow

### Step-by-Step Installation Protocol

```bash
#!/bin/bash
set -e

echo "=== Pre-commit Setup Phase 1: Environment Validation ==="
pre-commit --version || { echo "ERROR: Install pre-commit first"; exit 1; }
pre-commit --help >/dev/null || { echo "ERROR: Pre-commit not functional"; exit 1; }

echo "=== Phase 2: Template Variable Discovery ==="
# Discover repository name for personalized configuration
{{REPOSITORY_NAME}}=$(basename "$(git rev-parse --show-toplevel)" 2>/dev/null || echo "repository")
echo "📁 Repository: ${{REPOSITORY_NAME}}"

# Use the new multi-language detection logic
detect_project_languages
configure_for_languages

echo "🔍 Languages detected: ${{PROJECT_LANGUAGES}}"
echo "🎯 Primary language: ${{PROJECT_TYPE}}"

echo "=== Phase 3: Version Discovery ==="
# Generate sample config to get working versions
pre-commit sample-config > .pre-commit-reference.yaml
echo "✅ Generated reference configuration"

# Extract working version for pre-commit-hooks as FALLBACK only
SAMPLE_HOOKS_VERSION=$(grep -A 1 "pre-commit-hooks" .pre-commit-reference.yaml | grep "rev:" | awk '{print $2}' | head -1)
echo "🔍 Sample config hooks version: $SAMPLE_HOOKS_VERSION"

# Query GitHub API for latest versions (PREFERRED - more current than sample config)
{{HOOKS_VERSION}}=$(curl -s https://api.github.com/repos/pre-commit/pre-commit-hooks/releases/latest | jq -r .tag_name 2>/dev/null || echo "$SAMPLE_HOOKS_VERSION")
{{SHELLCHECK_VERSION}}=$(curl -s https://api.github.com/repos/shellcheck-py/shellcheck-py/releases/latest | jq -r .tag_name 2>/dev/null || echo "v0.10.0.1")
{{SHFMT_VERSION}}=$(curl -s https://api.github.com/repos/mvdan/sh/releases/latest | jq -r .tag_name 2>/dev/null || echo "v3.8.0")
{{MARKDOWNLINT_VERSION}}=$(curl -s https://api.github.com/repos/igorshubovych/markdownlint-cli/releases/latest | jq -r .tag_name 2>/dev/null || echo "v0.39.0")

# Cross-validate versions and warn about discrepancies
if [[ "${{HOOKS_VERSION}}" != "$SAMPLE_HOOKS_VERSION" ]]; then
    echo "⚠️  Version mismatch detected:"
    echo "   GitHub API: ${{HOOKS_VERSION}}"
    echo "   Sample config: $SAMPLE_HOOKS_VERSION"
    echo "   Using GitHub API version (recommended for currency)"
fi
echo "🔍 Final hooks version: ${{HOOKS_VERSION}}"

echo "=== Phase 4: Configuration Generation ==="
# Create personalized configuration with template variables
cat > .pre-commit-config.yaml << EOF
# ${{REPOSITORY_NAME}} Pre-commit Configuration
# Generated for ${{PROJECT_TYPE}} project (detected: ${{PROJECT_LANGUAGES}})
default_install_hook_types: ${{HOOK_STAGES}}
default_stages: [pre-commit]
fail_fast: ${{FAIL_FAST}}

repos:
  # Core file hygiene hooks (Priority 1 - Essential)
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: ${{HOOKS_VERSION}}
    hooks:
      - id: trailing-whitespace
        exclude: '\.md$'
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb=${{MAX_FILE_SIZE}}]
      - id: check-yaml
      - id: check-json
      - id: check-case-conflict
      - id: detect-private-key
EOF

echo "=== Phase 4: Installation and Validation ==="
pre-commit install || { echo "ERROR: Failed to install hooks"; exit 1; }

echo "=== Phase 5: Testing Core Configuration ==="
pre-commit run --files .pre-commit-config.yaml || {
    echo "WARNING: Core hooks failed, using absolute minimal config"
    # Create emergency fallback configuration
    cat > .pre-commit-config.yaml << EOF
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: $HOOKS_VERSION
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
EOF
    pre-commit run --files .pre-commit-config.yaml
}

echo "=== Phase 6: Project-Specific Hook Addition ==="
# Add hooks based on detected project type
if [[ "${{PROJECT_LANGUAGES}}" =~ "shell" ]] && find . -name "*.sh" -o -name "*.bash" | head -1 | grep -q "sh"; then
    echo "🔍 Shell files detected in project (${{PROJECT_LANGUAGES}}), attempting to add shell hooks..."

    # Test shellcheck repository availability with template variable
    if pre-commit try-repo https://github.com/shellcheck-py/shellcheck-py --verbose 2>/dev/null; then
        echo "  - Adding shellcheck with version: ${{SHELLCHECK_VERSION}}"

        # Add shell hooks to existing configuration with template variables
        cat >> .pre-commit-config.yaml << EOF

  # Shell script analysis and formatting (Priority 2 - Language Specific)
  - repo: https://github.com/shellcheck-py/shellcheck-py
    rev: ${{SHELLCHECK_VERSION}}
    hooks:
      - id: shellcheck
        args: [--severity=warning]

  - repo: https://github.com/pre-commit/mirrors-shfmt
    rev: ${{SHFMT_VERSION}}
    hooks:
      - id: shfmt
        args: [-w, -i, "2"]
EOF
    else
        echo "⚠️  Shell linting skipped (network issues for ${{PROJECT_LANGUAGES}} project)"
    fi
fi

# Add documentation hooks if markdown files detected
if find . -name "*.md" | head -1 | grep -q "md"; then
    echo "📚 Markdown files detected, attempting to add documentation hooks..."

    if pre-commit try-repo https://github.com/igorshubovych/markdownlint-cli --verbose 2>/dev/null; then
        echo "  - Adding markdownlint with version: ${{MARKDOWNLINT_VERSION}}"

        cat >> .pre-commit-config.yaml << EOF

  # Documentation hooks (Priority 3 - Optional)
  - repo: https://github.com/igorshubovych/markdownlint-cli
    rev: ${{MARKDOWNLINT_VERSION}}
    hooks:
      - id: markdownlint
        args: [
          --fix,
          --disable,
          MD013,  # Line length (disabled for long technical content)
          MD041,  # First line H1 (disabled for purpose/command docs)
          MD026,  # Trailing punctuation in headings (disabled for "Variables:")
          MD012   # Multiple blank lines (disabled for visual spacing)
        ]
        exclude: 'node_modules/.*\.md$'
EOF
    else
        echo "⚠️  Markdown linting skipped (network issues)"
    fi
fi

echo "✅ Pre-commit setup completed successfully!"
echo ""
echo "TEMPLATE VARIABLE SUMMARY:"
echo "- Repository: ${{REPOSITORY_NAME}}"
echo "- Languages Detected: ${{PROJECT_LANGUAGES}}"
echo "- Primary Language: ${{PROJECT_TYPE}}"
echo "- Fail Fast: ${{FAIL_FAST}}"
echo "- Max File Size: ${{MAX_FILE_SIZE}}kb"
echo "- Hook Stages: ${{HOOK_STAGES}}"
echo ""
echo "CONFIGURATION SUMMARY:"
echo "- Core file hygiene hooks: ✅ (version: ${{HOOKS_VERSION}})"
echo "- Security hooks: ✅"
echo "- Repository validation: ✅"
echo "- Shell hooks: $(if grep -q shellcheck .pre-commit-config.yaml; then echo "✅ (version: ${{SHELLCHECK_VERSION}})"; else echo "⚠️ Skipped"; fi)"
echo "- Documentation hooks: $(if grep -q markdownlint .pre-commit-config.yaml; then echo "✅ (version: ${{MARKDOWNLINT_VERSION}})"; else echo "⚠️ Skipped"; fi)"

echo ""
echo "USAGE COMMANDS:"
echo "- pre-commit run --all-files     # Test all files"
echo "- pre-commit autoupdate          # Update template variable versions"
echo "- git commit                     # Hooks run automatically"

echo ""
echo "MAINTENANCE:"
echo "- Configuration optimized for: ${{PROJECT_TYPE}} (from detected: ${{PROJECT_LANGUAGES}})"
echo "- To add more hooks: pre-commit try-repo <repo-url> --all-files"
echo "- Configuration file: .pre-commit-config.yaml"
echo "- Template variables can be updated by re-running this setup"

# Cleanup temporary files
rm -f .pre-commit-reference.yaml .pre-commit-sample.yaml
```

## Success Criteria and Validation

### Minimum Success Requirements

1. **✅ Core file hygiene hooks working** (trailing-whitespace, end-of-file-fixer)
2. **✅ Security hooks active** (detect-private-key, check-merge-conflict)
3. **✅ Configuration validates** (pre-commit validate-config passes)
4. **✅ Installation successful** (pre-commit run executes without fatal errors)

### Enhanced Success Criteria

1. **✅ Language-specific hooks** (shellcheck-py for .sh files, explained naming)
2. **✅ Documentation hooks** (markdownlint with documented disabled rules)
3. **✅ Current versions** (GitHub API prioritized over potentially stale sample config)
4. **✅ Performance optimized** (hooks complete in <10 seconds)
5. **✅ Network resilient** (works offline after initial setup)

## Troubleshooting and Recovery

### Common Error Patterns and Solutions

**Error**: `InvalidManifestError: .pre-commit-hooks.yaml is not a file` **Solution**: Repository version incompatibility - use `pre-commit sample-config` versions

**Error**: `fatal: could not read Username for 'https://github.com'` **Solution**: Network/auth issues - use mirrors or skip optional hooks

**Error**: `CalledProcessError: command: ('git', 'fetch', 'origin', '--tags')` **Solution**: Firewall/proxy issues - create minimal config without network-dependent hooks

### Recovery Commands

```bash
# Reset to minimal working configuration
pre-commit sample-config > .pre-commit-config.yaml
pre-commit install --overwrite

# Test with absolute minimal setup
echo "repos: []" > .pre-commit-config.yaml
pre-commit install

# Add hooks one by one with validation
pre-commit try-repo https://github.com/pre-commit/pre-commit-hooks trailing-whitespace
```

## Template Variable Reference

### Variable Definitions and Usage

| Variable | Purpose | Auto-Detection Method | Example Values |
| --- | --- | --- | --- |
| `{{REPOSITORY_NAME}}` | Personalized config comments | `basename $(git rev-parse --show-toplevel)` | `SimpleClaude`, `my-project` |
| `{{PROJECT_LANGUAGES}}` | **NEW** Multi-language list | File presence + extension detection | `javascript,shell,typescript`, `python` |
| `{{PROJECT_TYPE}}` | **LEGACY** Primary language | Priority-based selection from languages | `typescript`, `javascript`, `python` |
| `{{HOOKS_VERSION}}` | Core hooks version | GitHub API + sample config fallback | `v5.0.0`, `v4.6.0` |
| `{{SHELLCHECK_VERSION}}` | Shell linting version | GitHub API + fallback | `v0.10.0.1` |
| `{{SHFMT_VERSION}}` | Shell formatting version | GitHub API + fallback | `v3.8.0` |
| `{{MARKDOWNLINT_VERSION}}` | Markdown linting version | GitHub API + fallback | `v0.39.0` |
| `{{FAIL_FAST}}` | Performance optimization | Primary language mapping | `true`, `false` |
| `{{MAX_FILE_SIZE}}` | File size limits | Primary language mapping | `512`, `1024`, `2048` |
| `{{HOOK_STAGES}}` | Installation stages | Multi-language complexity | `[pre-commit]`, `[pre-commit, pre-push]` |

### Project Type Detection Logic

```bash
# Multi-language detection (all languages found):
1. Configuration files: package.json, pyproject.toml, go.mod, Cargo.toml, etc.
2. Source files: *.sh, *.ts, *.tsx, *.php (performance optimized with maxdepth)
3. Manual override: .pre-commit-project-type file (highest priority)

# Primary language selection (expert priority order):
typescript > javascript > python > go > rust > java > ruby > shell > php

# Configuration mapping per primary language:
- TypeScript/JavaScript: Conservative for mixed projects (fail_fast=false, large file limits)
- Python: Comprehensive stages (pre-commit + pre-push)
- Shell: Conservative (small file limits for script-focused projects)
- Others: Balanced defaults with smart multi-language adjustments
```
