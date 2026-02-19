#!/usr/bin/env bash
# Nelson Stop hook: prevent session stop if an active mission hasn't logged action.
#
# Allows stop if:
#   - stop_hook_active is true (retry guard — prevents infinite loop)
#   - No active mission exists
#   - Active mission already has a captains-log.md (Step 6 completed)
#
# Blocks stop if:
#   - Active mission exists but captain's log hasn't been written

set -euo pipefail

INPUT=$(cat)
STOP_HOOK_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false')
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

# Retry guard: if stop hook already fired once this turn, allow stop
if [ "$STOP_HOOK_ACTIVE" = "true" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

if [ -z "$CWD" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

NELSON_DIR="$CWD/.agent-history/nelson"

if [ ! -d "$NELSON_DIR" ]; then
  echo '{"decision": "approve"}'
  exit 0
fi

# Find active missions (phase != stand_down)
for STATE_FILE in "$NELSON_DIR"/*/mission-state.json; do
  [ -f "$STATE_FILE" ] || continue
  PHASE=$(jq -r '.phase // "stand_down"' "$STATE_FILE" 2>/dev/null)
  if [ "$PHASE" != "stand_down" ]; then
    MISSION_DIR=$(dirname "$STATE_FILE")
    MISSION_NAME=$(jq -r '.mission_name // "unknown"' "$STATE_FILE" 2>/dev/null)

    # Check if captain's log exists (Step 6 completed)
    if [ -f "$MISSION_DIR/captains-log.md" ]; then
      continue
    fi

    # Active mission without captain's log — block stop
    jq -n --arg name "$MISSION_NAME" '{
      "decision": "block",
      "reason": ("Active Nelson mission \"" + $name + "\" has not completed Step 6 (Stand Down And Log Action). Write the captain\u0027s log to .agent-history/nelson/<slug>/captains-log.md and update mission-state.json phase to \"stand_down\" before stopping.")
    }'
    exit 0
  fi
done

# No active mission without a captain's log
echo '{"decision": "approve"}'
