#!/bin/bash
# Vendor claude_hooks from GitHub fork
#
# This script fetches the claude_hooks library source and vendors it into
# plugins/vendor/ for use by all hook-enabled plugins. Run when updating.
#
# Usage: ./scripts/vendor-claude-hooks.sh [--check]
#   --check   Only check if update is available, don't vendor

set -euo pipefail

REPO_URL="https://github.com/kylesnowschwartz/claude_hooks.git"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENDOR_DIR="$REPO_ROOT/plugins/vendor/claude_hooks"

check_only=false
if [[ "${1:-}" == "--check" ]]; then
  check_only=true
fi

# Get current vendored version
current_version="none"
if [[ -f "$VENDOR_DIR/lib/claude_hooks/version.rb" ]]; then
  current_version=$(grep -oE "VERSION = '[^']+'" "$VENDOR_DIR/lib/claude_hooks/version.rb" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
fi

# Get latest version from GitHub
latest_version=$(curl -sL "https://raw.githubusercontent.com/kylesnowschwartz/claude_hooks/main/lib/claude_hooks/version.rb" | grep -oE "VERSION = '[^']+'" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+" || echo "unknown")

echo "Current vendored version: $current_version"
echo "Latest version on GitHub: $latest_version"

if [[ "$current_version" == "$latest_version" ]]; then
  echo "Already up to date."
  exit 0
fi

if [[ "$check_only" == true ]]; then
  echo "Update available: $current_version -> $latest_version"
  exit 1
fi

echo ""
echo "Updating claude_hooks..."

# Clean existing vendor
rm -rf "$VENDOR_DIR"
mkdir -p "$(dirname "$VENDOR_DIR")"

# Clone fresh (shallow)
git clone --depth 1 "$REPO_URL" "$VENDOR_DIR"

# Remove git metadata - this is now plain source
rm -rf "$VENDOR_DIR/.git"

# Remove dev/test files we don't need at runtime
rm -rf "$VENDOR_DIR/.github"
rm -rf "$VENDOR_DIR/test"
rm -rf "$VENDOR_DIR/docs"
rm -rf "$VENDOR_DIR/example_dotclaude"
rm -f "$VENDOR_DIR/.gitignore"
rm -f "$VENDOR_DIR/Gemfile"
rm -f "$VENDOR_DIR/Gemfile.lock"
rm -f "$VENDOR_DIR/claude_hooks.gemspec"
rm -f "$VENDOR_DIR/Rakefile"
rm -f "$VENDOR_DIR/.rubocop.yml"
rm -f "$VENDOR_DIR/.rspec"

# Verify
new_version=$(grep -oE "VERSION = '[^']+'" "$VENDOR_DIR/lib/claude_hooks/version.rb" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
echo ""
echo "Vendored claude_hooks $new_version"
echo "Files:"
find "$VENDOR_DIR" -type f | sed "s|$REPO_ROOT/||" | sort
