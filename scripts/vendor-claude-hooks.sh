#!/bin/bash
# Vendor claude_hooks from GitHub fork
#
# This script fetches the claude_hooks library source and vendors it into
# each hook-enabled plugin's vendor/ directory. Run when updating.
#
# Usage: ./scripts/vendor-claude-hooks.sh [--check]
#   --check   Only check if update is available, don't vendor

set -euo pipefail

REPO_URL="https://github.com/kylesnowschwartz/claude_hooks.git"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Plugins that need claude_hooks vendored
HOOK_PLUGINS=("sc-hooks")

check_only=false
if [[ "${1:-}" == "--check" ]]; then
  check_only=true
fi

# Get current vendored version (check first plugin)
first_plugin_vendor="$REPO_ROOT/plugins/${HOOK_PLUGINS[0]}/vendor/claude_hooks"
current_version="none"
if [[ -f "$first_plugin_vendor/lib/claude_hooks/version.rb" ]]; then
  current_version=$(grep -oE "VERSION = '[^']+'" "$first_plugin_vendor/lib/claude_hooks/version.rb" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
fi

# Get latest version and commit SHA from GitHub
github_api_response=$(curl -sL "https://api.github.com/repos/kylesnowschwartz/claude_hooks/branches/main")
expected_sha=$(echo "$github_api_response" | grep -o '"sha": "[^"]*"' | head -1 | cut -d'"' -f4)
if [[ -z "$expected_sha" ]]; then
  echo "ERROR: Failed to fetch expected commit SHA from GitHub API"
  exit 1
fi

latest_version=$(curl -sL "https://raw.githubusercontent.com/kylesnowschwartz/claude_hooks/main/lib/claude_hooks/version.rb" | grep -oE "VERSION = '[^']+'" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
if [[ -z "$latest_version" ]]; then
  echo "ERROR: Failed to fetch latest version from GitHub"
  exit 1
fi

echo "Current vendored version: $current_version"
echo "Latest version on GitHub: $latest_version"
echo "Expected commit SHA:      ${expected_sha:0:12}..."

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

# Clone to temp location
TEMP_DIR=$(mktemp -d)
trap 'rm -rf "$TEMP_DIR"' EXIT

git clone --depth 1 "$REPO_URL" "$TEMP_DIR/claude_hooks"

# Verify commit SHA matches expected (checksum verification via git integrity)
cloned_sha=$(git -C "$TEMP_DIR/claude_hooks" rev-parse HEAD)
if [[ "$cloned_sha" != "$expected_sha" ]]; then
  echo "ERROR: Checksum verification failed!"
  echo "  Expected SHA: $expected_sha"
  echo "  Cloned SHA:   $cloned_sha"
  echo "This could indicate a MITM attack or race condition. Aborting."
  exit 1
fi
echo "Checksum verified: $cloned_sha"

# Remove git metadata and dev files
rm -rf "$TEMP_DIR/claude_hooks/.git"
rm -rf "$TEMP_DIR/claude_hooks/.github"
rm -rf "$TEMP_DIR/claude_hooks/test"
rm -rf "$TEMP_DIR/claude_hooks/docs"
rm -rf "$TEMP_DIR/claude_hooks/example_dotclaude"
rm -f "$TEMP_DIR/claude_hooks/.gitignore"
rm -f "$TEMP_DIR/claude_hooks/Gemfile"
rm -f "$TEMP_DIR/claude_hooks/Gemfile.lock"
rm -f "$TEMP_DIR/claude_hooks/claude_hooks.gemspec"
rm -f "$TEMP_DIR/claude_hooks/Rakefile"
rm -f "$TEMP_DIR/claude_hooks/.rubocop.yml"
rm -f "$TEMP_DIR/claude_hooks/.rspec"

# Copy to each hook-enabled plugin
for plugin in "${HOOK_PLUGINS[@]}"; do
  vendor_dir="$REPO_ROOT/plugins/$plugin/vendor/claude_hooks"
  echo "Vendoring into $plugin..."
  rm -rf "$vendor_dir"
  mkdir -p "$(dirname "$vendor_dir")"
  cp -r "$TEMP_DIR/claude_hooks" "$vendor_dir"
done

# Verify
new_version=$(grep -oE "VERSION = '[^']+'" "$first_plugin_vendor/lib/claude_hooks/version.rb" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+")
echo ""
echo "Vendored claude_hooks $new_version into ${#HOOK_PLUGINS[@]} plugins"
