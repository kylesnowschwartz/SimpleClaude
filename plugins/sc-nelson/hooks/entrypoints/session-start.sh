#!/usr/bin/env bash
# Nelson SessionStart hook: detect active missions and inject resumption context.
#
# Reads cwd from stdin JSON, scans for mission-state.json files that aren't
# in stand_down phase, and provides resumption instructions if found.

set -euo pipefail

INPUT=$(cat)
CWD=$(echo "$INPUT" | jq -r '.cwd // empty')

if [ -z "$CWD" ]; then
  echo '{"continue": true, "suppressOutput": true}'
  exit 0
fi

NELSON_DIR="$CWD/.agent-history/nelson"

if [ ! -d "$NELSON_DIR" ]; then
  echo '{"continue": true, "suppressOutput": true}'
  exit 0
fi

# Find active missions (phase != stand_down)
ACTIVE_MISSIONS=""
for STATE_FILE in "$NELSON_DIR"/*/mission-state.json; do
  [ -f "$STATE_FILE" ] || continue
  PHASE=$(jq -r '.phase // "stand_down"' "$STATE_FILE" 2>/dev/null)
  if [ "$PHASE" != "stand_down" ]; then
    MISSION_NAME=$(jq -r '.mission_name // "unknown"' "$STATE_FILE" 2>/dev/null)
    MISSION_SLUG=$(jq -r '.mission_slug // "unknown"' "$STATE_FILE" 2>/dev/null)
    if [ -n "$ACTIVE_MISSIONS" ]; then
      ACTIVE_MISSIONS="$ACTIVE_MISSIONS\n"
    fi
    ACTIVE_MISSIONS="${ACTIVE_MISSIONS}- ${MISSION_NAME} (phase: ${PHASE}, slug: ${MISSION_SLUG})"
  fi
done

if [ -z "$ACTIVE_MISSIONS" ]; then
  echo '{"continue": true, "suppressOutput": true}'
  exit 0
fi

# Active mission found — inject resumption context
CONTEXT=$(
  cat <<EOF
Active Nelson mission detected:
$(echo -e "$ACTIVE_MISSIONS")

To resume, follow the session resumption procedure in references/damage-control/session-resumption.md:
1. Read .agent-history/nelson/<slug>/mission-state.json for current phase
2. Read the latest quarterdeck-NNN.md for last known state
3. Run TaskList() to get current task statuses
4. Re-issue sailing orders from .agent-history/nelson/<slug>/sailing-orders.md
EOF
)

jq -n --arg ctx "$CONTEXT" '{"continue": true, "additionalContext": $ctx}'
