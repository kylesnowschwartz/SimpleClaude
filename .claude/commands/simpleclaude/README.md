# Simple-Claude Commands

This directory contains the 5 core Simple-Claude commands:

1. **sc-create.md** - Build new functionality (merges spawn, task, build, design, document)
2. **sc-modify.md** - Change existing code (merges improve, migrate, cleanup, deploy)
3. **sc-understand.md** - Analyze and explain (merges load, analyze, explain, estimate)
4. **sc-fix.md** - Resolve issues (focused on troubleshooting and fixes)
5. **sc-review.md** - Validate quality (merges review, scan, test)

Each command:
- Auto-detects context and chooses appropriate mode
- Accepts natural language arguments instead of complex flags
- Routes to existing SuperClaude logic for proven functionality
- Provides helpful suggestions when intent is unclear

## Command Structure
Commands follow a consistent pattern:
1. Parse natural language input
2. Detect context (project type, files, current state)
3. Select appropriate mode (or use override)
4. Route to consolidated SuperClaude functionality
5. Use sub-agents for token-intensive operations

## Implementation Note
These commands will be created in Phase 2, building on the foundation established in Phase 1.