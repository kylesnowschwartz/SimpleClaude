# sc-pre-commit-setup: automate pre-commit framework setup

**Purpose**: Intelligently automate pre-commit framework setup with dynamic research and repository-tailored configuration. Analyze the current repository and setup comprehensive pre-commit configuration. Use the provided examples and additional research via mcp servers within a dedicated @research-analyst agent to ensure idiomatic and up to date pre-commit configuration.
**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution of research, configuration, and validation.
**Context Detection:** Repository analysis → Language detection → Hook research → Configuration generation → Validation

## Quick Reference for AI Agents

### Essential Commands
1. **Repository Analysis**: `basename "$(git rev-parse --show-toplevel)"` + language detection
2. **Version Research**: `gh api repos/pre-commit/pre-commit-hooks/releases/latest`
3. **Hook Installation**: `pre-commit install`
4. **Configuration Test**: `pre-commit validate-config`
5. **Full Validation**: `pre-commit run --all-files`

### Critical Success Path
1. Generate base configuration → 2. Add language-specific hooks → 3. Test incrementally → 4. Install wrapper if needed → 5. Final validation

### Common Failures & Solutions
- **YAML syntax errors**: Use `pre-commit validate-config` to identify issues
- **Hook repository not found**: Use `pre-commit try-repo <url>` to verify accessibility  
- **Performance issues**: Add file filters or remove problematic hooks
- **Staging issues**: Implement staging-aware wrapper for file-modifying hooks

## Research & Configuration Protocol

<repository_analysis> Use TodoWrite to track this systematic analysis:

1. **Repository Discovery**

   - Extract repository name: `basename "$(git rev-parse --show-toplevel)"`
   - Detect project languages via file analysis and package manifests
   - Identify existing `.pre-commit-config.yaml`, `.git/hooks/pre-commit`, or additional setup requirements

2. **EditorConfig Standards Integration**

   **Critical**: Analyze dotfiles EditorConfig standards and enforce through pre-commit hooks:
   
   - **Indentation Standards**: 2-space default, 4-space for Python files, tab for Go files
   - **Line Endings**: LF (Unix-style) enforced across all files
   - **Encoding**: UTF-8 validation required
   - **Whitespace**: Trailing whitespace trimmed (except Markdown for line breaks)
   - **Final Newline**: Must be present in all files
   
   **Hook Configuration Priority**: Configure hooks to respect these exact standards:
   ```yaml
   # Enforce EditorConfig standards
   - id: trailing-whitespace
     exclude: '\.md$'  # Preserve markdown line break formatting
   - id: mixed-line-ending
     args: ['--fix=lf']  # Force LF line endings
   - id: end-of-file-fixer  # Ensure final newline
   ```

3. **Git Workflow Integration**

   **Compatibility Requirements**: Ensure hooks work with existing git configuration:
   
   - **Delta Integration**: Hooks should produce diff-compatible output for Delta pager
   - **Auto-rebase Workflow**: Compatible with `pull.rebase = true` setting
   - **Commit Template**: Respect existing commit message conventions
   - **Verbose Commits**: Work with `commit.verbose = true` setting
   
   **Performance Targets**: Sub-10 second execution to complement fast git workflow

4. **Language Detection Logic**

   **Enhanced Detection with EditorConfig Awareness**:
   
   ```bash
   # Use the List() tool to view directory structure
   # Priority: Configuration files (fast detection)
   [[ -f "package.json" ]] && languages+=("javascript")
   [[ -f "pyproject.toml" || -f "requirements.txt" ]] && languages+=("python")
   [[ -f "go.mod" ]] && languages+=("go")
   [[ -f "Cargo.toml" ]] && languages+=("rust")
   
   # Secondary: File extensions (optimized scanning)
   find . -maxdepth 2 -name "*.sh" -o -name "*.bash" | head -1 && languages+=("shell")
   find . -maxdepth 2 -name "*.ts" -o -name "*.tsx" | head -1 && languages+=("typescript")
   
   # Language-specific indentation detection for hook configuration
   [[ " ${languages[@]} " =~ " python " ]] && python_indent="4"
   [[ " ${languages[@]} " =~ " go " ]] && go_indent="tab"
   # Default 2-space for other languages (JavaScript, TypeScript, YAML, etc.)
   ```
   
   **Hook Configuration by Language**:
   - **Python**: Use 4-space indentation, add Python-specific linting
   - **Go**: Use tab indentation, add `gofmt` equivalent hooks
   - **Shell**: Add ShellCheck with 2-space formatting via `shfmt -i 2`
   - **JavaScript/TypeScript**: 2-space indentation, consider Prettier integration
   - **Documentation**: Add markdownlint with pragmatic exclusions for technical docs

</repository_analysis>

<version_research> Use `mcp__context7` and GitHub API (`gh ...`) for authoritative version discovery:

1. **Primary Research Sources**

   - `mcp__context7__resolve-library-id "pre-commit hooks"` for latest documentation
   - GitHub API: `gh api repos/pre-commit/pre-commit-hooks/releases/latest` or `gh api repos/shellcheck-py/shellcheck-py/tags` or `gh repo view scop/pre-commit-shfmt`
   - Context7 queries for best practices and current examples

2. **Repository Validation**

   - Test each repository with: `pre-commit try-repo <repo-url> --verbose`
   - Only include validated, accessible repositories in configuration
   - Document any repositories that fail validation

3. **Fallback Strategy**
   - If GitHub API fails: use `pre-commit sample-config` as reference with the knowledge that the sample-config is out-of-date
   - If specific repositories fail: use alternative mirrors or skip with warning
   - Comprehensively report failures to setup specific repos or hooks

</version_research>

<configuration_generation> Progressive configuration building with validation at each step:

1. **Base Configuration Template**

   ```yaml
   # {repository_name} Pre-commit Configuration
   # Auto-generated for detected languages: {detected_languages}
   # Configured for EditorConfig standards: 2-space default, 4-space Python, tabs Go
   default_install_hook_types: [pre-commit]
   default_stages: [pre-commit]
   fail_fast: false

   repos:
     # Core file hygiene (Essential - Priority 1)
     # Enforces dotfiles EditorConfig standards
     - repo: https://github.com/pre-commit/pre-commit-hooks
       rev: { researched_version }
       hooks:
         - id: trailing-whitespace
           exclude: '\.md$' # Preserve markdown line break formatting
         - id: end-of-file-fixer  # Ensure final newline (EditorConfig requirement)
         - id: mixed-line-ending
           args: ['--fix=lf']  # Force LF line endings (EditorConfig standard)
         - id: check-merge-conflict
         - id: check-added-large-files
           args: [--maxkb=1024]  # 1MB limit for reasonable file sizes
         - id: check-yaml
         - id: check-json
         - id: check-case-conflict  # Case sensitivity for cross-platform compatibility
         - id: check-executables-have-shebangs
         - id: detect-private-key  # Security requirement
   ```

2. **Complete Example Configuration**

   ```yaml
   # `.pre-commit-config.yaml` - Complete Working Example
   # Global Configuration
   default_install_hook_types: [pre-commit]
   default_stages: [pre-commit]
   fail_fast: false
   
   repos:
     # Standard pre-commit hooks for file hygiene and basic validation
     - repo: https://github.com/pre-commit/pre-commit-hooks
       rev: v5.0.0
       hooks:
         - id: trailing-whitespace
           exclude: '\.md$'
         - id: end-of-file-fixer
         - id: check-merge-conflict
         - id: check-added-large-files
           args: [--maxkb=1024]
         - id: check-yaml
         - id: check-json
         - id: check-toml
         - id: check-case-conflict
         - id: mixed-line-ending
         - id: check-executables-have-shebangs
         - id: check-symlinks
         - id: detect-private-key
   
     # Shell script quality assurance
     - repo: https://github.com/koalaman/shellcheck-precommit
       rev: v0.10.0
       hooks:
         - id: shellcheck
           args: [--severity=warning]
   
     # Shell script formatting (EditorConfig compliant: 2-space indentation)
     - repo: https://github.com/scop/pre-commit-shfmt
       rev: v3.12.0-2
       hooks:
         - id: shfmt
           args: [-w, -i, "2"]  # Matches EditorConfig 2-space default
   
     # Documentation hooks (Priority 3 - Optional)
     - repo: https://github.com/igorshubovych/markdownlint-cli
       rev: v0.45.0
       hooks:
         - id: markdownlint
           args: [
               --fix,
               --disable,
               MD013, # Line length (disabled for long technical content)
               MD041, # First line H1 (disabled for purpose/command docs) 
               MD026, # Trailing punctuation in headings (disabled for "Variables:")
               MD012, # Multiple blank lines (disabled for visual spacing)
             ]
           # Note: Preserves trailing whitespace in .md files per EditorConfig
   ```

3. **Language-Specific Addition Logic**

   **Critical**: Configure language-specific hooks to match EditorConfig indentation standards:
   
   - **Shell detected**: Add ShellCheck + shfmt with 2-space indentation
     ```yaml
     # Shell script formatting (matches EditorConfig 2-space default)
     - repo: https://github.com/scop/pre-commit-shfmt
       hooks:
         - id: shfmt
           args: [-w, -i, "2"]  # 2-space indentation
     ```
   
   - **Python detected**: Configure for 4-space indentation (EditorConfig override)
     ```yaml
     # Python formatting (matches EditorConfig 4-space for Python)
     - repo: https://github.com/psf/black
       hooks:
         - id: black
           args: [--line-length=88, --target-version=py38]
     ```
   
   - **Go detected**: Configure for tab indentation (EditorConfig standard)
     ```yaml
     # Go formatting (matches EditorConfig tab indentation)
     - repo: https://github.com/dnephin/pre-commit-golang
       hooks:
         - id: go-fmt  # Uses tabs by default
     ```
   
   - **JavaScript/TypeScript detected**: Add Prettier for formatting
     **Detection**: Check if `prettier` exists in `package.json` devDependencies
     **Action**: Add local hook configuration:
     ```yaml
     # JavaScript/TypeScript formatting (EditorConfig compliant: 2-space)
     - repo: local
       hooks:
         - id: prettier
           name: prettier
           entry: npx prettier --write
           language: node
           files: \.(js|jsx|ts|tsx|css|json|yaml|yml)$
           # Requires prettier in package.json devDependencies
     ```
     **Fallback**: If prettier not installed, skip with warning message
   
   - **Documentation (.md files) detected**: Add markdownlint with fix capability
     **Action**: Add comprehensive markdownlint configuration:
     ```yaml
     # Documentation linting and formatting
     - repo: https://github.com/igorshubovych/markdownlint-cli
       rev: v0.41.0  # Use latest from GitHub API research
       hooks:
         - id: markdownlint-fix
           args: [
             --disable,
             MD013, # Line length (disabled for technical content)
             MD041, # First line H1 (disabled for command docs)
             MD026, # Trailing punctuation (disabled for "Variables:")
             MD012, # Multiple blank lines (visual spacing)
           ]
           # Automatically fixes issues while preserving content intent
     ```

4. **Validation After Each Addition**
   - Test configuration: `pre-commit run --files <sample-file>`
   - If hook fails: investigate, fix, or remove with documented reasoning
   - Ensure minimal working configuration always available

</configuration_generation>

## Progressive Validation Protocol

### Step 1: Installation Verification
1. **Check pre-commit availability**: `pre-commit --version`
   - **Expected**: Version number displayed
   - **If fails**: Install pre-commit via `pip install pre-commit`

2. **Install hooks**: `pre-commit install`
   - **Expected**: "pre-commit installed at .git/hooks/pre-commit"
   - **If fails**: Check git repository status and permissions

3. **Validate configuration**: `pre-commit validate-config`
   - **Expected**: No errors, configuration valid
   - **If fails**: Fix YAML syntax errors before proceeding

### Step 2: Incremental Hook Testing
1. **Test core hygiene hooks first**:
   ```bash
   pre-commit run trailing-whitespace --all-files
   pre-commit run end-of-file-fixer --all-files
   pre-commit run check-merge-conflict --all-files
   ```
   - **Action**: Fix any issues found
   - **Backup**: `cp .pre-commit-config.yaml .pre-commit-config.yaml.bak` before adding language hooks

2. **Add language-specific hooks one at a time**:
   - **Test each addition**: `pre-commit run <new-hook-id> --all-files`
   - **If hook fails**: Remove from config, restore backup, document failure
   - **If hook succeeds**: Create new backup with working configuration

### Step 3: Performance Validation
1. **Measure execution time**:
   ```bash
   time pre-commit run --all-files
   ```
   - **Target**: < 10 seconds total execution
   - **If slower**: Investigate specific hooks, add file filters, or remove problematic hooks

2. **Test on representative files**:
   - Create sample files for each detected language
   - Run hooks on samples to verify behavior
   - Remove test files after validation

### Step 4: Final Integration Test
1. **Comprehensive validation**:
   ```bash
   pre-commit run --all-files
   ```
   - **Expected**: All hooks pass or make expected fixes
   - **Action**: Commit any auto-formatting changes

2. **Simulate commit workflow**:
   ```bash
   echo "test change" >> README.md
   git add README.md
   git commit -m "Test pre-commit integration"
   ```
   - **Expected**: Hooks run successfully, commit proceeds or fails appropriately

3. **Generate summary report**: Document active hooks, their purpose, and any configuration notes

## Success Criteria & Human QA

**Minimum Success (Required)**

- ✅ Valid `.pre-commit-config.yaml` with working core hooks
- ✅ `pre-commit install` completes successfully
- ✅ Security hooks active (detect-private-key, check-merge-conflict)
- ✅ Basic file hygiene (trailing-whitespace, end-of-file-fixer)
- ✅ **EditorConfig compliance**: LF line endings, proper indentation, final newlines

**Optimal Success (Target)**

- ✅ Language-specific hooks for detected project types
- ✅ Current versions from GitHub API research
- ✅ Repository-specific customization and comments
- ✅ Performance optimized (sub-10 second execution)
- ✅ Comprehensive validation with error-free test run
- ✅ **Dotfiles integration**: Hooks respect EditorConfig standards (2/4-space, tabs, UTF-8)
- ✅ **Git workflow compatibility**: Works with Delta pager, auto-rebase, commit templates

## Error Handling & Recovery

## Staging-Aware Hook Wrapper Implementation

**Purpose**: Preserve user's original staging intent when auto-formatting hooks modify files in-place.

### Step 1: Detection Criteria
**When to implement**: Configuration contains ANY of these file-modifying hooks:
- Formatters: `shfmt`, `black`, `prettier`, `go-fmt`
- Fix hooks: `markdownlint-fix`, hooks with `--fix` arguments  
- File hygiene: `trailing-whitespace`, `end-of-file-fixer`

### Step 2: Wrapper Implementation
**After** `pre-commit install` completes successfully:

1. **Backup original hook**:
   ```bash
   mv .git/hooks/pre-commit .git/hooks/pre-commit.original
   ```

2. **Create wrapper script** at `.git/hooks/pre-commit`:
   ```bash
   #!/usr/bin/env bash
   # Staging-aware pre-commit wrapper
   
   # Determine against-ref for initial commits
   if git rev-parse --verify HEAD >/dev/null 2>&1; then
     against="HEAD"
   else
     against=$(git hash-object -t tree /dev/null)
   fi
   
   # Capture originally staged files
   original_staged_files=$(git diff --cached --name-only --diff-filter=ACM "$against")
   
   # Run original pre-commit hooks
   "$(dirname "$0")/pre-commit.original" "$@"
   exit_code=$?
   
   # Handle different exit codes
   case $exit_code in
     0) exit 0 ;;  # Success - proceed with commit
     1) # Files were modified - re-stage only original files
        git reset HEAD --quiet
        if [ -n "$original_staged_files" ]; then
          echo "$original_staged_files" | while IFS= read -r file; do
            [ -f "$file" ] && git add "$file"
          done
        fi
        echo "Files auto-formatted and re-staged. Please review and commit again."
        exit 0
        ;;
     *) exit $exit_code ;;  # Other errors - block commit
   esac
   ```

3. **Make executable**:
   ```bash
   chmod +x .git/hooks/pre-commit
   ```

### Step 3: Validation Protocol
1. **Create test scenario**:
   ```bash
   echo "hello " > test-format.txt  # Trailing space
   echo "clean content" > clean.txt
   git add test-format.txt clean.txt
   ```

2. **Test wrapper behavior**:
   ```bash
   git commit -m "Test staging preservation"
   ```

3. **Expected outcome**: 
   - Commit fails with formatting message
   - Both files remain staged with formatting applied
   - Any unstaged files remain unstaged

4. **Cleanup test**:
   ```bash
   git reset HEAD test-format.txt clean.txt
   rm test-format.txt clean.txt
   ```

### Step 4: Error Recovery
**If wrapper causes issues**:
1. Restore original: `mv .git/hooks/pre-commit.original .git/hooks/pre-commit`
2. Document failure in setup summary
3. Continue with standard pre-commit behavior


---

## Dotfiles Integration Analysis

**Configuration Standards Detected from ~/Code/dotfiles**:

### EditorConfig Standards (`/Users/kyle/Code/dotfiles/editorconfig`)
- **Indentation**: 2-space (default), 4-space (Python), tabs (Go)
- **Line Endings**: LF (Unix-style) enforced
- **Encoding**: UTF-8 required
- **Whitespace**: Trim trailing (except Markdown line breaks)
- **Final Newline**: Required for all files

### Git Integration (`/Users/kyle/Code/dotfiles/.gitconfig`)
- **Delta Pager**: Enhanced diff viewing - hooks must be Delta-compatible
- **Auto-rebase**: `pull.rebase = true` - hooks must support rebase workflow
- **Commit Templates**: Existing templates - hooks should respect conventions
- **Verbose Commits**: `commit.verbose = true` - hooks work with detailed commits

### Terminal Environment
- **Starship Prompt**: Git status integration shows branch/status indicators
- **Kitty Terminal**: Hyperlink support for Delta integration
- **Claude Code Settings**: Auto-staging hooks with git integration

### Hook Configuration Priorities
1. **Core Standards**: Enforce EditorConfig exactly (indentation, line endings, encoding)
2. **Git Workflow**: Compatible with Delta, auto-rebase, commit templates
3. **Performance**: Sub-10 second execution for fast development workflow
4. **Language-Specific**: Python (4-space), Go (tabs), Shell (2-space), others (2-space)

---

## Agent Execution Checklist

### Prerequisites Verification
- [ ] Git repository exists: `git rev-parse --git-dir`
- [ ] Pre-commit tool available: `pre-commit --version` 
- [ ] GitHub CLI available: `gh --version` (for research)
- [ ] Package manifests readable for language detection

### Core Workflow
- [ ] 1. Extract repository name and detect languages
- [ ] 2. Research latest hook versions via GitHub API
- [ ] 3. Generate base configuration with EditorConfig standards
- [ ] 4. Add language-specific hooks with proper indentation settings
- [ ] 5. Test configuration incrementally with rollback capability
- [ ] 6. Install staging-aware wrapper if file-modifying hooks detected
- [ ] 7. Perform final validation with actual commit simulation

### Success Validation
- [ ] `.pre-commit-config.yaml` exists and validates
- [ ] `pre-commit install` completes without errors
- [ ] All hooks execute in < 10 seconds
- [ ] EditorConfig standards enforced (LF endings, proper indentation)
- [ ] Staging behavior preserves user intent
- [ ] Test commit workflow succeeds

### Error Recovery Actions
- [ ] Configuration backup created before each major change
- [ ] Failed hooks documented with reasons
- [ ] Fallback to minimal working configuration if needed
- [ ] Staging wrapper can be disabled if causing issues

---

**Generated Configuration Location**: `.pre-commit-config.yaml`  
**Maintenance Commands**: `pre-commit autoupdate`, `pre-commit run --all-files`  
**Documentation**: All hook purposes explained in configuration comments  
**EditorConfig Compliance**: Hooks configured to match dotfiles standards exactly
