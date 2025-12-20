#!/usr/bin/env bash
#
# collect-skills.sh - List active Claude Code skill names
#
# Output: Newline-delimited list of skill names from enabled plugins
#
set -euo pipefail

CLAUDE_DIR="${HOME}/.claude"
SETTINGS_FILE="${CLAUDE_DIR}/settings.json"
INSTALLED_PLUGINS="${CLAUDE_DIR}/plugins/installed_plugins.json"

# Get enabled plugins from settings
get_enabled_plugins() {
  jq -r '.enabledPlugins // {} | to_entries[] | select(.value == true) | .key' "$SETTINGS_FILE" 2>/dev/null
}

# Get install path for a plugin
get_plugin_path() {
  jq -r --arg key "$1" '.plugins[$key][0].installPath // empty' "$INSTALLED_PLUGINS" 2>/dev/null
}

# Extract skill name from SKILL.md (first line of name field, or directory name)
get_skill_name() {
  local skill_path="$1"
  local name

  # Try to get name from YAML frontmatter
  name=$(awk '/^---$/ { if (++c == 1) next; if (c == 2) exit } c == 1 && /^name:/ { sub(/^name:[[:space:]]*/, ""); print; exit }' "$skill_path")

  # Fallback to directory name
  if [[ -z "$name" ]]; then
    name=$(basename "$(dirname "$skill_path")")
  fi

  # Strip quotes if present
  name="${name#\"}"
  name="${name%\"}"

  echo "$name"
}

# Output skill with source (TSV: skill<TAB>source)
emit_skill() {
  local skill_path="$1"
  local source="$2"
  local name
  name=$(get_skill_name "$skill_path")
  printf '%s\t%s\n' "$name" "$source"
}

{
  # Collect user skills
  USER_SKILLS_DIR="${CLAUDE_DIR}/skills"
  if [[ -d "$USER_SKILLS_DIR" ]]; then
    for skill_dir in "$USER_SKILLS_DIR"/*/; do
      [[ -f "${skill_dir}SKILL.md" ]] && emit_skill "${skill_dir}SKILL.md" "user"
    done
  fi

  # Collect plugin skills
  while IFS= read -r plugin_key; do
    [[ -z "$plugin_key" ]] && continue

    install_path=$(get_plugin_path "$plugin_key")
    [[ -z "$install_path" || ! -d "$install_path" ]] && continue

    # Check both skill locations: skills/ and .claude/skills/
    for skills_dir in "${install_path}/skills" "${install_path}/.claude/skills"; do
      [[ ! -d "$skills_dir" ]] && continue

      for skill_dir in "$skills_dir"/*/; do
        [[ -f "${skill_dir}SKILL.md" ]] && emit_skill "${skill_dir}SKILL.md" "$plugin_key"
      done
    done
  done < <(get_enabled_plugins)
} | sort -t$'\t' -k2,2 -k1,1 | uniq
