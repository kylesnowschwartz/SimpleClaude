---
description: Set sound mode for notifications (off, glass, aoe)
arguments:
  - name: mode
    description: Sound mode - off (silent), glass (macOS default), or aoe (Age of Empires)
    required: false
allowed-tools: ["Bash", "Read", "Write"]
---

# Sound Mode Configuration

Control which plugin handles notification sounds:
- `off` - Silent notifications (visual only)
- `glass` - macOS notification sound (default)
- `aoe` - Age of Empires themed sounds

Config file: `~/.config/claude/sounds.conf`

## Current State

!`cat ~/.config/claude/sounds.conf 2>/dev/null || echo "SOUND_MODE=glass (default - file not created yet)"`

$ARGUMENTS

## Instructions

If mode argument provided:
1. Validate mode is one of: off, glass, aoe
2. Create ~/.config/claude directory if needed
3. Write SOUND_MODE={mode} to ~/.config/claude/sounds.conf
4. Confirm the change took effect

Example responses:
- "Sound mode set to `aoe` - Age of Empires sounds enabled"
- "Sound mode set to `glass` - macOS notification sounds enabled"
- "Sound mode set to `off` - All notification sounds disabled"
