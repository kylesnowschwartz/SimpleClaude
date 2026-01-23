---
name: sc-pre-commit-setup
description: Set up pre-commit framework with language-specific hooks
---

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

# Get repository languages and suggest appropriate hooks
REPO_LANGS=$(gh repo view --json languages | jq -r '.languages | map(.node.name) | join(" ")')
echo "Detected languages: $REPO_LANGS"
echo ""
echo "Recommended hooks based on detected languages:"

# Universal (always include)
echo "  - pre-commit/pre-commit-hooks (file hygiene, always include)"

# Python
if echo "$REPO_LANGS" | grep -q "Python"; then
  echo "  - astral-sh/ruff-pre-commit (Python linting & formatting)"
fi

# JavaScript/TypeScript
if echo "$REPO_LANGS" | grep -qE "JavaScript|TypeScript"; then
  echo "  - pre-commit/mirrors-prettier (JS/TS formatting)"
  echo "  - pre-commit/mirrors-eslint (JS/TS linting)"
fi

# Ruby
if echo "$REPO_LANGS" | grep -q "Ruby"; then
  echo "  - pre-commit/mirrors-rubocop (Ruby linting & formatting)"
fi

# Shell
if echo "$REPO_LANGS" | grep -q "Shell"; then
  echo "  - koalaman/shellcheck-precommit (Shell linting)"
  echo "  - scop/pre-commit-shfmt (Shell formatting)"
fi

echo ""
echo "Configuration files present:"
find . -maxdepth 2 \( -name ".git" -o -name "node_modules" \) -prune -o -type f \( -name "package.json" -o -name "requirements.txt" -o -name "Gemfile" -o -name "pyproject.toml" -o -name "tsconfig.json" -o -name ".pre-commit-config.yaml" \) -print
```

Select appropriate hook repositories from the recommendations above.

## Step 3: Create Configuration

**⚠️ Important**: The version numbers in the examples below are illustrative only and may be outdated. Always fetch the latest versions using the commands shown at the end of this section before creating your configuration.

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
  # Example for Python (modern approach using Ruff):
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.8.4
    hooks:
      - id: ruff
        args: [--fix]
      - id: ruff-format

  # Example for Ruby:
  - repo: https://github.com/pre-commit/mirrors-rubocop
    rev: v1.70.0
    hooks:
      - id: rubocop
        args: [--auto-correct]

  # Example for Shell scripts:
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
# Core hooks
gh api repos/pre-commit/pre-commit-hooks/releases/latest | jq -r '.tag_name'

# Python
gh api repos/astral-sh/ruff-pre-commit/releases/latest | jq -r '.tag_name'

# Ruby
gh api repos/pre-commit/mirrors-rubocop/tags | jq -r '.[0].name'

# Shell
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

1. Ensure `pre-commit install` has been run (from Step 1). This generates `.git/hooks/pre-commit` which we'll now enhance with auto-restaging capability.

2. Extract system-specific values from the generated hook:

```bash
# Backup the generated hook
cp .git/hooks/pre-commit .git/hooks/pre-commit.original

# Extract the templated values (these are system-specific)
grep "INSTALL_PYTHON=" .git/hooks/pre-commit.original
grep "ARGS=(" .git/hooks/pre-commit.original
```

3. Create the staging-aware wrapper using YOUR extracted values:

```bash
#!/usr/bin/env bash
# Staging-aware pre-commit wrapper
# Preserves original staging intent while using pre-commit framework

# start templated (REPLACE these lines with YOUR extracted values from step 2)
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
original_staged_files=$(git diff --cached --name-only --diff-filter=ACDMRT "$against")

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
# restore proper staging to only include originally staged files.
# Exit codes: 0=success, 1=failures/fixes applied, >1=actual errors
if [ $result -eq 1 ] && [ -n "$original_staged_files" ]; then
  # Reset staging area completely
  git reset HEAD --quiet

  # Re-stage only originally staged files (which now include hook modifications)
  echo "$original_staged_files" | while IFS= read -r file; do
    if [ -f "$file" ]; then
      git add "$file"
    else
      # File was deleted - stage the deletion
      git rm --cached --ignore-unmatch "$file" 2>/dev/null || true
    fi
  done

  echo "Pre-commit: Auto-formatted files and preserved original staging intent"
  exit 0
fi

# Pass through original exit code for other scenarios
exit $result
```

4. Write the complete wrapper to `.git/hooks/pre-commit` and make it executable:

```bash
# Copy your complete wrapper script to .git/hooks/pre-commit
# (After editing the templated section with your extracted values)
chmod +x .git/hooks/pre-commit
```

## Step 6: Final Verification

Test the complete setup:

```bash
# Create test scenario
echo "test content " > test-format.txt  # Trailing space
git add test-format.txt

# Test commit (should auto-format and succeed with wrapper, or fail without)
git commit -m "Test pre-commit setup"

# Cleanup
git restore --staged test-format.txt
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

# Ruby
gh api repos/pre-commit/mirrors-rubocop/tags | jq -r '.[0].name'    # Ruby linting & formatting

# JavaScript/TypeScript
gh api repos/pre-commit/mirrors-prettier/tags | jq -r '.[0].name'  # JS/TS formatting
gh api repos/pre-commit/mirrors-eslint/tags | jq -r '.[0].name'    # JS/TS linting

# Shell
gh api repos/koalaman/shellcheck-precommit/tags | jq -r '.[0].name' # Shell linting
gh api repos/scop/pre-commit-shfmt/tags | jq -r '.[0].name'         # Shell formatting

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
pre-commit autoupdate --repo https://github.com/astral-sh/ruff-pre-commit
```
