#!/bin/bash

# SimpleClaude Hooks Install Script
# Installs Ruby-based hooks system with template-based configuration
# Handles both entrypoints and handlers with dependency management

set -e          # Exit on error
set -o pipefail # Exit on pipe failure

# Colors for output
if [[ -t 1 ]] && [[ "$(tput colors 2>/dev/null)" -ge 8 ]]; then
  readonly GREEN='\033[0;32m'
  readonly YELLOW='\033[1;33m'
  readonly RED='\033[0;31m'
  readonly BLUE='\033[0;34m'
  readonly NC='\033[0m' # No Color
else
  readonly GREEN=''
  readonly YELLOW=''
  readonly RED=''
  readonly BLUE=''
  readonly NC=''
fi

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/.claude"
DEFAULT_TARGET="$HOME/.claude"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')

# Function: show_usage
show_usage() {
  cat <<EOF
SimpleClaude Hooks Install Script

IMPORTANT: This installs Ruby-based hooks that require:
  - Ruby >= 2.7.0
  - claude_hooks gem >= 0.2.1
  - Bundler for dependency management

Usage: $0 [OPTIONS]

Options:
    --target <dir>     Target .claude directory (default: ~/.claude)
    --execute          Actually perform the installation (default: dry-run)
    --no-backup        Skip backup creation (not recommended)
    --dry-run          Show what would be installed without making changes (default)
    --force-deps       Install Ruby dependencies even if checks fail
    --help             Show this help message

Installation Behavior:
    1. Checks Ruby and gem dependencies
    2. Installs hooks as .template files (both entrypoints and handlers)
    3. Installs Gemfile and runs bundle install
    4. User copies .template files to .rb files and customizes

Examples:
    $0                                    # Preview what would be installed
    $0 --execute                         # Install hooks templates to ~/.claude
    $0 --target ~/my-claude --execute    # Install to custom location

After Installation:
    cd ~/.claude && bundle install       # Install Ruby dependencies
    cp hooks/handlers/auto_format_handler.rb.template \\
       hooks/handlers/auto_format_handler.rb
    # Edit the .rb file to customize for your environment

EOF
}

# Parse arguments
TARGET_DIR="$DEFAULT_TARGET"
CREATE_BACKUP=true
DRY_RUN=true # Default to dry-run for safety
FORCE_DEPS=false

while [[ $# -gt 0 ]]; do
  case $1 in
  --target)
    TARGET_DIR="$2"
    shift 2
    ;;
  --no-backup)
    CREATE_BACKUP=false
    shift
    ;;
  --dry-run)
    DRY_RUN=true
    shift
    ;;
  --execute)
    DRY_RUN=false
    shift
    ;;
  --force-deps)
    FORCE_DEPS=true
    shift
    ;;
  --help | -h)
    show_usage
    exit 0
    ;;
  *)
    echo -e "${RED}Unknown option: $1${NC}"
    show_usage
    exit 1
    ;;
  esac
done

# Resolve symlinks
if [[ -L "$TARGET_DIR" ]]; then
  REAL_TARGET=$(readlink "$TARGET_DIR")
  echo -e "${BLUE}Note: $TARGET_DIR is a symlink to $REAL_TARGET${NC}"
  TARGET_DIR="$REAL_TARGET"
fi

# Validate directories
if [[ ! -d "$SOURCE_DIR" ]]; then
  echo -e "${RED}Error: Source directory not found: $SOURCE_DIR${NC}"
  echo "Please run this script from the SimpleClaude repository root."
  exit 1
fi

if [[ ! -d "$TARGET_DIR" ]]; then
  echo -e "${RED}Error: Target directory not found: $TARGET_DIR${NC}"
  echo "Please specify a valid .claude directory."
  exit 1
fi

echo -e "${BLUE}=== SimpleClaude Hooks Installation ===${NC}"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
if [[ "$DRY_RUN" = true ]]; then
  echo -e "${YELLOW}Mode: DRY RUN (no changes will be made)${NC}"
  echo "Use --execute to perform actual installation"
else
  echo -e "${GREEN}Mode: EXECUTE${NC}"
fi
echo ""

# Function: check_ruby_version
check_ruby_version() {
  if ! command -v ruby &>/dev/null; then
    echo -e "${RED}✗ Ruby not found${NC}"
    return 1
  fi

  local ruby_version
  ruby_version=$(ruby -e 'puts RUBY_VERSION')
  local required_version="2.7.0"

  if [[ "$(printf '%s\n' "$required_version" "$ruby_version" | sort -V | head -n1)" != "$required_version" ]]; then
    echo -e "${RED}✗ Ruby $ruby_version found, but >= $required_version required${NC}"
    return 1
  fi

  echo -e "${GREEN}✓ Ruby $ruby_version found${NC}"
  return 0
}

# Function: check_bundler
check_bundler() {
  if ! command -v bundle &>/dev/null; then
    echo -e "${YELLOW}⚠ Bundler not found - will need to install${NC}"
    return 1
  fi
  echo -e "${GREEN}✓ Bundler found${NC}"
  return 0
}

# Function: check_claude_hooks_gem
check_claude_hooks_gem() {
  if ruby -e 'require "claude_hooks"' 2>/dev/null; then
    local gem_version
    gem_version=$(ruby -e 'require "claude_hooks"; puts ClaudeHooks::VERSION' 2>/dev/null || echo "unknown")
    echo -e "${GREEN}✓ claude_hooks gem found (version: $gem_version)${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ claude_hooks gem not found - will be installed via Gemfile${NC}"
    return 1
  fi
}

# Function: backup_hooks_directory
backup_hooks_directory() {
  local rel_path="$1"
  local backup_name="$2"

  if [[ -d "$TARGET_DIR/$rel_path" ]]; then
    echo "  Backing up $rel_path..."
    cp -r "$TARGET_DIR/$rel_path" "$BACKUP_DIR/$backup_name"
  fi
}

# Function: install_hooks_templates
# Description: Install hooks files as .template files, skipping existing .rb customizations
# Parameters:
#   $1 - source_subdir (e.g., "hooks/entrypoints")
#   $2 - target_subdir (e.g., "hooks/entrypoints")
#   $3 - display_name (e.g., "entrypoints")
install_hooks_templates() {
  local source_subdir="$1"
  local target_subdir="$2"
  local display_name="$3"

  local source_path="$SOURCE_DIR/$source_subdir"
  local target_path="$TARGET_DIR/$target_subdir"

  echo -e "${YELLOW}Installing SimpleClaude hooks $display_name...${NC}"

  if [[ ! -d "$source_path" ]]; then
    echo -e "${RED}  Warning: No $display_name found in source${NC}"
    return
  fi

  if [[ "$DRY_RUN" = false ]]; then
    mkdir -p "$target_path"
  fi

  local updated_count=0
  local added_count=0
  local unchanged_count=0
  local skipped_count=0

  for file in "$source_path"/*.rb; do
    if [[ -f "$file" ]]; then
      local basename_file
      basename_file=$(basename "$file")
      local template_file="$target_path/${basename_file%.rb}.rb.template"
      local user_file="$target_path/$basename_file"

      # Check if user has customized version
      if [[ -f "$user_file" ]]; then
        echo "    Skipping: $basename_file (user customization exists)"
        ((skipped_count++)) || true
        continue
      fi

      # Install/update template file
      if [[ -f "$template_file" ]]; then
        # Template exists, check if it's different
        local source_hash target_hash
        source_hash=$(file_hash "$file")
        target_hash=$(file_hash "$template_file")

        if [[ "$source_hash" != "$target_hash" ]]; then
          if [[ "$DRY_RUN" = true ]]; then
            echo "    Would update template: ${basename_file%.rb}.rb.template"
          else
            cp "$file" "$template_file"
            echo "    Updated template: ${basename_file%.rb}.rb.template"
          fi
          ((updated_count++)) || true
        else
          ((unchanged_count++)) || true
        fi
      else
        # New template file
        if [[ "$DRY_RUN" = true ]]; then
          echo "    Would add template: ${basename_file%.rb}.rb.template"
        else
          cp "$file" "$template_file"
          echo "    Added template: ${basename_file%.rb}.rb.template"
        fi
        ((added_count++)) || true
      fi
    fi
  done

  # Summary
  echo -e "${GREEN}  $display_name: $added_count new templates, $updated_count updated templates, $unchanged_count unchanged, $skipped_count skipped (user files)${NC}"
}

# Function: file_hash
# Description: Get SHA256 hash of a file
file_hash() {
  local file="$1"
  if [[ -f "$file" ]]; then
    if command -v sha256sum &>/dev/null; then
      sha256sum "$file" | cut -d' ' -f1
    elif command -v shasum &>/dev/null; then
      shasum -a 256 "$file" | cut -d' ' -f1
    else
      # Fallback to cksum if no SHA256 available
      cksum "$file" | cut -d' ' -f1
    fi
  fi
}

# Function: install_gemfile
install_gemfile() {
  local source_gemfile="$SOURCE_DIR/../Gemfile"
  local target_gemfile="$TARGET_DIR/Gemfile"

  if [[ ! -f "$source_gemfile" ]]; then
    echo -e "${RED}  Warning: Gemfile not found in source${NC}"
    return
  fi

  echo -e "${YELLOW}Installing Gemfile...${NC}"

  if [[ -f "$target_gemfile" ]]; then
    local source_hash target_hash
    source_hash=$(file_hash "$source_gemfile")
    target_hash=$(file_hash "$target_gemfile")

    if [[ "$source_hash" != "$target_hash" ]]; then
      if [[ "$DRY_RUN" = true ]]; then
        echo "    Would update: Gemfile"
      else
        cp "$source_gemfile" "$target_gemfile"
        echo "    Updated: Gemfile"
      fi
    else
      echo "    Unchanged: Gemfile"
    fi
  else
    if [[ "$DRY_RUN" = true ]]; then
      echo "    Would add: Gemfile"
    else
      cp "$source_gemfile" "$target_gemfile"
      echo "    Added: Gemfile"
    fi
  fi
}

# Function: run_bundle_install
run_bundle_install() {
  if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}Would run bundle install in $TARGET_DIR${NC}"
    return
  fi

  echo -e "${YELLOW}Running bundle install...${NC}"

  if ! command -v bundle &>/dev/null; then
    echo "  Installing bundler..."
    gem install bundler
  fi

  cd "$TARGET_DIR"
  if bundle install --quiet; then
    echo -e "${GREEN}  ✓ Bundle install completed${NC}"
  else
    echo -e "${RED}  ✗ Bundle install failed${NC}"
    echo "  You may need to run 'cd $TARGET_DIR && bundle install' manually"
  fi
}

# Check dependencies
echo -e "${BLUE}Checking dependencies...${NC}"
ruby_ok=true
if ! check_ruby_version; then
  ruby_ok=false
fi

bundler_ok=true
if ! check_bundler; then
  bundler_ok=false
fi

gems_ok=true
if ! check_claude_hooks_gem; then
  gems_ok=false
fi

if [[ "$ruby_ok" = false ]] || [[ "$bundler_ok" = false ]]; then
  if [[ "$FORCE_DEPS" = false ]]; then
    echo ""
    echo -e "${RED}Dependency check failed. Please install required dependencies:${NC}"
    [[ "$ruby_ok" = false ]] && echo "  - Ruby >= 2.7.0: https://ruby-lang.org/en/downloads/"
    [[ "$bundler_ok" = false ]] && echo "  - Bundler: gem install bundler"
    echo ""
    echo "Or use --force-deps to proceed anyway (not recommended)"
    exit 1
  else
    echo -e "${YELLOW}Proceeding with --force-deps despite dependency issues${NC}"
  fi
fi

echo ""

# Create backups
if [[ "$CREATE_BACKUP" = true ]] && [[ "$DRY_RUN" = false ]]; then
  BACKUP_DIR="$TARGET_DIR/backups/hooks-install-$TIMESTAMP"
  echo -e "${YELLOW}Creating backup...${NC}"

  mkdir -p "$BACKUP_DIR"

  # Backup existing hooks components
  backup_hooks_directory "hooks" "hooks"
  backup_hooks_directory "Gemfile" "Gemfile"
  backup_hooks_directory "Gemfile.lock" "Gemfile.lock"

  echo -e "${GREEN}Backup created at: $BACKUP_DIR${NC}"
  echo ""
fi

# Install hooks templates
install_hooks_templates "hooks/entrypoints" "hooks/entrypoints" "entrypoints"
install_hooks_templates "hooks/handlers" "hooks/handlers" "handlers"

# Install Gemfile
install_gemfile

# Run bundle install
if [[ "$ruby_ok" = true ]] && [[ "$bundler_ok" = true ]]; then
  run_bundle_install
else
  echo -e "${YELLOW}Skipping bundle install due to dependency issues${NC}"
fi

# Final summary and user guidance
echo ""
if [[ "$DRY_RUN" = true ]]; then
  echo -e "${YELLOW}Dry run complete. No changes were made.${NC}"
  echo "Run with --execute to apply installation."
else
  echo -e "${GREEN}✓ Hooks installation complete!${NC}"
  echo ""
  echo -e "${BLUE}SimpleClaude hooks have been installed as templates.${NC}"
  echo ""
  echo -e "${BLUE}To activate hooks:${NC}"
  echo "  1. Copy template files to working files:"
  echo "     cd $TARGET_DIR/hooks/handlers"
  echo "     cp auto_format_handler.rb.template auto_format_handler.rb"
  echo ""
  echo "  2. Edit the .rb files to customize for your environment"
  echo ""
  echo -e "${BLUE}  3. Configure Claude Code settings.json to use the hooks:${NC}"
  echo ""
  echo -e "${YELLOW}     Example: Enable auto-formatting after tool use${NC}"
  echo '     {'
  echo '       "hooks": {'
  echo '         "PostToolUse": [{'
  echo '           "matcher": "",'
  echo '           "hooks": [{'
  echo '             "type": "command",'
  echo '             "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/post_tool_use.rb"'
  echo '           }]'
  echo '         }]'
  echo '       }'
  echo '     }'
  echo ""
  echo -e "${YELLOW}     Example: Run hooks on specific user prompts${NC}"
  echo '     {'
  echo '       "hooks": {'
  echo '         "UserPromptSubmit": [{'
  echo '           "matcher": "help.*implement",'
  echo '           "hooks": [{'
  echo '             "type": "command",'
  echo '             "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/user_prompt_submit.rb"'
  echo '           }]'
  echo '         }]'
  echo '       }'
  echo '     }'
  echo ""
  echo -e "${YELLOW}     Example: Multiple hook types (session + notifications)${NC}"
  echo '     {'
  echo '       "hooks": {'
  echo '         "SessionStart": [{'
  echo '           "matcher": "",'
  echo '           "hooks": [{'
  echo '             "type": "command",'
  echo '             "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/session_start.rb"'
  echo '           }]'
  echo '         }],'
  echo '         "Notification": [{'
  echo '           "matcher": "",'
  echo '           "hooks": [{'
  echo '             "type": "command",'
  echo '             "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/entrypoints/notification.rb"'
  echo '           }]'
  echo '         }]'
  echo '       }'
  echo '     }'
  echo ""
  echo -e "${BLUE}Available hook templates:${NC}"

  if [[ -d "$TARGET_DIR/hooks/handlers" ]]; then
    for template in "$TARGET_DIR/hooks/handlers"/*.template; do
      if [[ -f "$template" ]]; then
        basename_template=$(basename "$template" .template)
        echo "  • $basename_template"
      fi
    done
  fi

  echo ""
  echo -e "${YELLOW}Remember: Future SimpleClaude updates will only update .template files,${NC}"
  echo -e "${YELLOW}preserving your customized .rb files.${NC}"
fi
