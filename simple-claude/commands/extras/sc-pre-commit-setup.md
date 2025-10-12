# sc-pre-commit-setup-2: Streamlined Pre-commit Framework Setup

**Purpose**: Set up pre-commit framework with repository-specific hooks and intelligent auto-restaging behavior for seamless development workflow.

## Step 1: Verify Pre-commit Installation

Before configuring hooks, ensure pre-commit is properly installed:

```bash
# Check if pre-commit is available
if ! command -v pre-commit >/dev/null; then
  echo "Installing pre-commit via Homebrew..."
  brew install pre-commit
fi

# Verify installation
pre-commit --version

# Install git hooks (creates .git/hooks/pre-commit)
pre-commit install
```

**Expected Output**: `pre-commit installed at .git/hooks/pre-commit`

## Step 2: Repository Analysis

Use GitHub CLI to detect repository technologies and appropriate hooks:

```bash
# Verify required tools are installed
if ! command -v gh &> /dev/null || ! command -v jq &> /dev/null; then
    echo "Error: Missing dependencies. Please install 'gh' and 'jq'" >&2
    exit 1
fi

# Get repository languages
REPO_LANGS=$(gh repo view --json languages | jq -r '.languages | map(.node.name) | join(" ")')
echo "Detected languages: $REPO_LANGS"

# Check for common configuration files
find . -maxdepth 2 \( -name ".git" -o -name "node_modules" \) -prune -o -type f \( -name "package.json" -o -name "requirements.txt" -o -name "go.mod" -o -name "Cargo.toml" -o -name "pyproject.toml" -o -name "tsconfig.json" -o -name ".pre-commit-config.yaml" \) -print
```

Based on detected languages, select appropriate hook repositories:

- **Python**: `psf/black`, `PyCQA/flake8`
- **JavaScript/TypeScript**: `pre-commit/mirrors-prettier`
- **Shell**: `koalaman/shellcheck-precommit`, `scop/pre-commit-shfmt`
- **Go**: `dnephin/pre-commit-golang`
- **Universal**: `pre-commit/pre-commit-hooks` (always include)

## Step 3: Create Configuration

Generate `.pre-commit-config.yaml` based on detected languages:

```yaml
# Pre-commit configuration for [REPOSITORY_NAME]
repos:
  # Core file hygiene (always include)
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v5.0.0 # Use latest from: gh api repos/pre-commit/pre-commit-hooks/releases/latest
    hooks:
      - id: trailing-whitespace
        exclude: '\.md$'
      - id: end-of-file-fixer
      - id: check-merge-conflict
      - id: check-added-large-files
        args: [--maxkb=1024]
      - id: check-yaml
      - id: check-json
      - id: detect-private-key

  # Language-specific hooks (add based on repository analysis)
  # Example for shell scripts:
  - repo: https://github.com/koalaman/shellcheck-precommit
    rev: v0.10.0
    hooks:
      - id: shellcheck
        args: [--severity=warning]

  - repo: https://github.com/scop/pre-commit-shfmt
    rev: v3.12.0-2
    hooks:
      - id: shfmt
        args: [-w, -i, "2"] # 2-space indentation
```

**Get latest versions**:

```bash
# Get latest versions (using releases for repos that have them, tags for others)
gh api repos/pre-commit/pre-commit-hooks/releases/latest | jq -r '.tag_name'
gh api repos/koalaman/shellcheck-precommit/tags | jq -r '.[0].name'
gh api repos/scop/pre-commit-shfmt/tags | jq -r '.[0].name'
```

## Step 4: Test Configuration

Validate and test the configuration incrementally:

```bash
# Validate YAML syntax
pre-commit validate-config

# Test core hooks first
pre-commit run trailing-whitespace --all-files
pre-commit run end-of-file-fixer --all-files

# Run all hooks
pre-commit run --all-files
```

**If hooks modify files**: They will exit with code 1 and require manual re-staging.

## Step 5: Add Auto-restaging Wrapper (Optional)

Pre-commit **does not** have built-in auto-restaging. If your hooks modify files (formatters, fixers), add a custom wrapper to preserve staging intent.

**Detection**: Your config contains file-modifying hooks like:

- `shfmt`, `black`, `prettier` (formatters)
- `trailing-whitespace`, `end-of-file-fixer` (fixers)
- Hooks with `--fix` arguments

**Implementation**:

1. Backup the generated hook: `cp .git/hooks/pre-commit .git/hooks/pre-commit.original`

2. Replace with staging-aware wrapper:

```bash
#!/usr/bin/env bash
# Staging-aware pre-commit wrapper
# Preserves original staging intent while using pre-commit framework

# start templated (preserve this section from original)
INSTALL_PYTHON=/usr/local/opt/pre-commit/libexec/bin/python3.13
ARGS=(hook-impl --config=.pre-commit-config.yaml --hook-type=pre-commit)
# end templated

HERE="$(cd "$(dirname "$0")" && pwd)"
ARGS+=(--hook-dir "$HERE" -- "$@")

# Check if this is an initial commit
if git rev-parse --verify HEAD >/dev/null 2>&1; then
  against=HEAD
else
  against=$(git hash-object -t tree /dev/null)
fi

# Store originally staged files BEFORE pre-commit runs
original_staged_files=$(git diff --cached --name-only --diff-filter=ACDMRT $against)

# Run original pre-commit framework logic
if [ -x "$INSTALL_PYTHON" ]; then
  "$INSTALL_PYTHON" -mpre_commit "${ARGS[@]}"
  result=$?
elif command -v pre-commit >/dev/null; then
  pre-commit "${ARGS[@]}"
  result=$?
else
  echo '`pre-commit` not found.  Did you forget to activate your virtualenv?' 1>&2
  exit 1
fi

# If pre-commit failed due to file modifications (exit code 1),
# restore proper staging to only include originally staged files
if [ $result -eq 1 ] && [ -n "$original_staged_files" ]; then
  # Reset staging area completely
  git reset HEAD --quiet

  # Re-stage only originally staged files (which now include hook modifications)
  echo "$original_staged_files" | while IFS= read -r file; do
    git add "$file"
  done

  echo "Pre-commit: Auto-formatted files and preserved original staging intent"
  exit 0
fi

# Pass through original exit code for other scenarios
exit $result
```

3. Make executable: `chmod +x .git/hooks/pre-commit`

## Step 6: Final Verification

Test the complete setup:

```bash
# Create test scenario
echo "test content " > test-format.txt  # Trailing space
git add test-format.txt

# Test commit (should auto-format and succeed with wrapper, or fail without)
git commit -m "Test pre-commit setup"

# Cleanup
git reset HEAD test-format.txt
rm test-format.txt
```

## Common Hook Repositories

Research latest versions using GitHub CLI:

```bash
# Core hooks
gh api repos/pre-commit/pre-commit-hooks/releases/latest   # Basic file checks

# Python (2025 recommended: Ruff replaces Black, isort, Flake8, pyupgrade)
gh api repos/astral-sh/ruff-pre-commit/releases/latest     # Python linting & formatting
gh api repos/RobertCraigie/pyright-python/releases/latest # Python type checking

# JavaScript/TypeScript
gh api repos/pre-commit/mirrors-prettier/tags | jq -r '.[0].name'  # JS/TS formatting
gh api repos/pre-commit/mirrors-eslint/tags | jq -r '.[0].name'    # JS/TS linting

# Shell
gh api repos/koalaman/shellcheck-precommit/tags | jq -r '.[0].name' # Shell linting
gh api repos/scop/pre-commit-shfmt/tags | jq -r '.[0].name'         # Shell formatting

# Go
gh api repos/tekwizely/pre-commit-golang/releases/latest  # Go hooks (monorepo support)

# Rust
gh api repos/doublify/pre-commit-rust/releases/latest     # Rust hooks

# Security & General
gh api repos/zricethezav/gitleaks/releases/latest         # Secret detection
gh api repos/codespell-project/codespell/releases/latest  # Typo detection
```

## Success Criteria

- ✅ `pre-commit --version` works
- ✅ `pre-commit install` completes without errors
- ✅ `pre-commit validate-config` passes
- ✅ `pre-commit run --all-files` executes (may modify files)
- ✅ Repository-specific hooks included for detected languages
- ✅ Auto-restaging wrapper installed if needed
- ✅ Test commit workflow succeeds

## Troubleshooting

**Config validation fails**: Check YAML syntax and hook repository accessibility  
**Hooks fail to run**: Verify repository URLs and versions with `pre-commit try-repo <url>`  
**Performance issues**: Add file exclusions or remove problematic hooks  
**Staging issues**: Verify auto-restaging wrapper is correctly installed and executable

## Maintenance

```bash
# Update hook versions
pre-commit autoupdate

# Run hooks manually
pre-commit run --all-files

# Update specific hook
pre-commit autoupdate --repo https://github.com/psf/black
```
