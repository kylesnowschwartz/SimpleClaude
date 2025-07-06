# Simple-Claude Configuration

Simple-Claude streamlines AI assistance with intelligent defaults and natural language commands.

## Quick Start
```bash
# Basic usage - auto-detects context
/sc-understand              # Analyzes current directory
/sc-create "user auth"       # Creates with smart defaults
/sc-fix                      # Finds and fixes issues
/sc-review                   # Reviews code quality
/sc-modify "add logging"     # Modifies existing code
```

## Commands (5 total)

### `/sc-create` - Build new functionality
Merges: spawn, task, build, design, document, dev-setup
```bash
/sc-create "REST API"        # Auto-detects framework
/sc-create "UI component"    # Uses project conventions
/sc-create :planner "auth"   # Force planner mode
```

### `/sc-modify` - Change existing code
Merges: improve, migrate, cleanup, deploy, refactor
```bash
/sc-modify "add error handling"
/sc-modify "upgrade to v3"
/sc-modify :tester "security"   # Focus on security
```

### `/sc-understand` - Analyze and explain
Merges: load, analyze, explain, estimate
```bash
/sc-understand               # Full analysis
/sc-understand "auth flow"   # Specific analysis
/sc-understand :planner      # Deep research mode
```

### `/sc-fix` - Resolve issues
Focused on: troubleshoot, error resolution, git fixes
```bash
/sc-fix                      # Auto-detect issues
/sc-fix "type errors"        # Specific fixes
/sc-fix :implementer         # Quick fix mode
```

### `/sc-review` - Validate quality
Merges: review, scan, test
```bash
/sc-review                   # Comprehensive review
/sc-review "security"        # Focused review
/sc-review :tester           # Thorough validation
```

## Modes (3 adaptive)

**Auto-selected based on context, override with `:mode`**

- **:planner** - Research-first, asks questions, thorough analysis
- **:implementer** - Action-oriented, quick decisions, builds fast  
- **:tester** - Quality-focused, security-aware, best practices

## Smart Defaults

Simple-Claude auto-detects:
- Project type (React, Node, Python, etc.)
- Testing framework (Jest, pytest, etc.)
- Code style (from existing files)
- Build tools (npm, pip, cargo, etc.)
- Git workflow (branching strategy)

## Configuration

### Project Settings (Optional)
```yaml
# .claude/project.yml (auto-generated on first use)
preferences:
  default_mode: implementer    # planner|implementer|tester
  auto_test: true             # Run tests after changes
  style_guide: "existing"     # existing|strict|relaxed
```

### Advanced Usage
- Natural language overrides any defaults
- Combines multiple concerns: `/sc-create "secure API with tests"`
- Chain commands: `/sc-understand` → `/sc-modify` → `/sc-review`

## Philosophy
- **Start simple** - Basic commands work immediately
- **Smart escalation** - Complexity when needed
- **Context aware** - Learns from your codebase
- **Evidence-based** - Maintains SuperClaude's rigor

---
*Simple-Claude v1.0 - Making AI assistance feel natural*