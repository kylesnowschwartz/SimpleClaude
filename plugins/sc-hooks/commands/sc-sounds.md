---
name: sc-sounds
description: Set sound notification mode
argument-hint: "[mode: off|glass]"
allowed-tools: ["Bash", "Read", "Write"]
---

# Sound Mode Configuration

Control notification sounds:
- `off` - Silent notifications (visual only)
- `glass` - macOS notification sound (default)

Config file: `~/.config/claude/sounds.conf`

$ARGUMENTS

## Instructions

1. First, read current state: `cat ~/.config/claude/sounds.conf 2>/dev/null || echo "(not set - defaults to glass)"`

2. If mode argument provided:
   - Validate mode is one of: off, glass
   - Create ~/.config/claude directory if needed
   - Write SOUND_MODE={mode} to ~/.config/claude/sounds.conf
   - Confirm the change took effect

Example responses:
- "Sound mode set to `glass` - macOS notification sounds enabled"
- "Sound mode set to `off` - All notification sounds disabled"
