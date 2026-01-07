#!/usr/bin/env bash
set -euo pipefail

# Playwright MCP Wrapper
# Allows configurable Chrome profile via PLAYWRIGHT_USER_DATA_DIR environment variable

ARGS=("@playwright/mcp@latest" "--extension")

# Add user data dir if specified
if [ -n "${PLAYWRIGHT_USER_DATA_DIR:-}" ]; then
  ARGS+=("--user-data-dir=$PLAYWRIGHT_USER_DATA_DIR")
fi

# Launch Playwright MCP server
exec npx "${ARGS[@]}"
