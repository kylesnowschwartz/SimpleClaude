#!/bin/bash

# SimpleClaude Install Script
# Installs/updates SimpleClaude commands and shared files with backups
# Preserves all user customizations and data

set -e  # Exit on error
set -o pipefail  # Exit on pipe failure

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
    cat << EOF
SimpleClaude Install Script

Usage: $0 [OPTIONS]

Options:
    --target <dir>     Target .claude directory (default: ~/.claude)
    --execute          Actually perform the installation (default: dry-run)
    --no-backup        Skip backup creation (not recommended)
    --dry-run          Show what would be installed without making changes (default)
    --verbose, -v      Show detailed output
    --help             Show this help message

Examples:
    $0                                    # Preview changes (dry-run)
    $0 --execute                         # Actually install to ~/.claude
    $0 --target ~/code/dotfiles/claude   # Preview installation to custom location
    $0 --target ~/code/dotfiles/claude --execute  # Install to custom location

EOF
}

# Parse arguments
TARGET_DIR="$DEFAULT_TARGET"
CREATE_BACKUP=true
DRY_RUN=true  # Default to dry-run for safety
VERBOSE=false

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
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --help|-h)
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

echo -e "${BLUE}=== SimpleClaude Install ===${NC}"
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"
if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}Mode: DRY RUN (no changes will be made)${NC}"
    echo "Use --execute to perform actual installation"
else
    echo -e "${GREEN}Mode: EXECUTE${NC}"
fi
echo ""

# Create backups
if [[ "$CREATE_BACKUP" = true ]] && [[ "$DRY_RUN" = false ]]; then
    BACKUP_DIR="$TARGET_DIR/backups/simpleclaude-install-$TIMESTAMP"
    echo -e "${YELLOW}Creating backup...${NC}"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup existing SimpleClaude commands
    if [[ -d "$TARGET_DIR/commands/simpleclaude" ]]; then
        echo "  Backing up commands/simpleclaude..."
        cp -r "$TARGET_DIR/commands/simpleclaude" "$BACKUP_DIR/commands-simpleclaude"
    fi
    
    # Backup SimpleClaude shared directory
    if [[ -d "$TARGET_DIR/shared/simpleclaude" ]]; then
        echo "  Backing up shared/simpleclaude..."
        cp -r "$TARGET_DIR/shared/simpleclaude" "$BACKUP_DIR/shared-simpleclaude"
    fi
    
    
    echo -e "${GREEN}Backup created at: $BACKUP_DIR${NC}"
    echo ""
fi

# Function: file_hash
# Description: Get SHA256 hash of a file
# Parameters: $1 - file path
# Returns: hash string or empty if file doesn't exist
file_hash() {
    local file="$1"
    if [[ -f "$file" ]]; then
        if command -v sha256sum &> /dev/null; then
            sha256sum "$file" | cut -d' ' -f1
        elif command -v shasum &> /dev/null; then
            shasum -a 256 "$file" | cut -d' ' -f1
        else
            # Fallback to cksum if no SHA256 available
            cksum "$file" | cut -d' ' -f1
        fi
    fi
}

# Install SimpleClaude commands
echo -e "${YELLOW}Installing SimpleClaude commands...${NC}"
if [[ -d "$SOURCE_DIR/commands/simpleclaude" ]]; then
    if [[ "$DRY_RUN" = false ]]; then
        mkdir -p "$TARGET_DIR/commands/simpleclaude"
    fi
    
    updated_count=0
    added_count=0
    unchanged_count=0
    
    for file in "$SOURCE_DIR/commands/simpleclaude"/*.md; do
        if [[ -f "$file" ]]; then
            basename_file=$(basename "$file")
            target_file="$TARGET_DIR/commands/simpleclaude/$basename_file"
            
            if [[ -f "$target_file" ]]; then
                # File exists, check if it's different
                source_hash=$(file_hash "$file")
                target_hash=$(file_hash "$target_file")
                
                if [[ "$source_hash" != "$target_hash" ]]; then
                    if [[ "$DRY_RUN" = true ]]; then
                        echo "    Would update: $basename_file"
                    else
                        cp "$file" "$target_file"
                        echo "    Updated: $basename_file"
                    fi
                    ((updated_count++))
                else
                    if [[ "$VERBOSE" = true ]]; then
                        echo "    Unchanged: $basename_file"
                    fi
                    ((unchanged_count++))
                fi
            else
                # New file
                if [[ "$DRY_RUN" = true ]]; then
                    echo "    Would add: $basename_file"
                else
                    cp "$file" "$target_file"
                    echo "    Added: $basename_file"
                fi
                ((added_count++))
            fi
        fi
    done
    
    # Summary
    echo -e "${GREEN}  Commands: $added_count new, $updated_count updated, $unchanged_count unchanged${NC}"
else
    echo -e "${RED}  Warning: No SimpleClaude commands found in source${NC}"
fi

# Install SimpleClaude shared directory
echo -e "${YELLOW}Installing SimpleClaude shared patterns...${NC}"
if [[ -d "$SOURCE_DIR/shared/simpleclaude" ]]; then
    if [[ "$DRY_RUN" = false ]]; then
        mkdir -p "$TARGET_DIR/shared/simpleclaude"
    fi
    
    updated_count=0
    added_count=0
    unchanged_count=0
    
    for file in "$SOURCE_DIR/shared/simpleclaude"/*.yml; do
        if [[ -f "$file" ]]; then
            basename_file=$(basename "$file")
            target_file="$TARGET_DIR/shared/simpleclaude/$basename_file"
            
            if [[ -f "$target_file" ]]; then
                # File exists, check if it's different
                source_hash=$(file_hash "$file")
                target_hash=$(file_hash "$target_file")
                
                if [[ "$source_hash" != "$target_hash" ]]; then
                    if [[ "$DRY_RUN" = true ]]; then
                        echo "    Would update: $basename_file"
                    else
                        cp "$file" "$target_file"
                        echo "    Updated: $basename_file"
                    fi
                    ((updated_count++))
                else
                    if [[ "$VERBOSE" = true ]]; then
                        echo "    Unchanged: $basename_file"
                    fi
                    ((unchanged_count++))
                fi
            else
                # New file
                if [[ "$DRY_RUN" = true ]]; then
                    echo "    Would add: $basename_file"
                else
                    cp "$file" "$target_file"
                    echo "    Added: $basename_file"
                fi
                ((added_count++))
            fi
        fi
    done
    
    # Summary
    echo -e "${GREEN}  Patterns: $added_count new, $updated_count updated, $unchanged_count unchanged${NC}"
else
    echo -e "${RED}  Warning: No SimpleClaude shared patterns found in source${NC}"
fi


# Final summary
echo ""
if [[ "$DRY_RUN" = true ]]; then
    echo -e "${YELLOW}Dry run complete. No changes were made.${NC}"
    echo "Run with --execute to apply installation."
else
    echo -e "${GREEN}✓ Installation complete!${NC}"
    echo ""
    echo -e "${BLUE}SimpleClaude has been installed while preserving:${NC}"
    echo "  • Your custom commands and patterns"
    echo "  • All other Claude configuration files"
    echo ""
    if [[ "$CREATE_BACKUP" = true ]]; then
        echo -e "${BLUE}Backups saved to:${NC}"
        echo "  $BACKUP_DIR"
        echo ""
        echo -e "${BLUE}To restore if needed:${NC}"
        echo "  cp -r $BACKUP_DIR/commands-simpleclaude/* $TARGET_DIR/commands/simpleclaude/"
        echo "  cp -r $BACKUP_DIR/shared-simpleclaude/* $TARGET_DIR/shared/simpleclaude/"
    fi
    echo ""
    echo -e "${GREEN}Try a command:${NC} /sc-create a React component"
fi