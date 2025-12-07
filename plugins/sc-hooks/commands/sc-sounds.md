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

$ARGUMENTS

## Instructions

1. First, read current state: `cat ~/.config/claude/sounds.conf 2>/dev/null || echo "(not set - defaults to glass)"`

2. If mode argument provided:
   - Validate mode is one of: off, glass, aoe
   - Create ~/.config/claude directory if needed
   - Write SOUND_MODE={mode} to ~/.config/claude/sounds.conf
   - Confirm the change took effect

Example responses:
- "Sound mode set to `aoe` - Age of Empires sounds enabled"
- "Sound mode set to `glass` - macOS notification sounds enabled"
- "Sound mode set to `off` - All notification sounds disabled"
