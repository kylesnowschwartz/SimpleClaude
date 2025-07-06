# SimpleClaude - Standalone AI Assistant Framework

**🚨 CRITICAL**: SimpleClaude is a completely **STANDALONE** project. It does
NOT depend on, import from, or route to SuperClaude. SuperClaude is used only as
a reference for design patterns and best practices.

## What is SimpleClaude?

SimpleClaude is a streamlined AI assistant framework that consolidates complex
command structures into 5 intuitive commands. It implements its own logic while
being inspired by SuperClaude's proven patterns.

## Standalone Architecture

- **SimpleClaude**: Self-contained implementation with its own commands and
  patterns
- **SuperClaude**: Reference project for design inspiration only
- **No Dependencies**: SimpleClaude runs independently without any external
  routing

## The 5 Core Commands

1. `/sc-create` - Unified creation interface (consolidates 6 concepts)
2. `/sc-modify` - Intelligent modifications (consolidates 5 concepts)
3. `/sc-understand` - Comprehensive analysis (consolidates 5 concepts)
4. `/sc-fix` - Problem resolution (consolidates 3 concepts)
5. `/sc-review` - Quality assurance (consolidates 3 concepts)

Each command implements consolidated functionality internally - there is no
routing to external commands.

## Project Structure

```
SimpleClaude/
├── .claude/
│   ├── commands/simpleclaude/    # SimpleClaude's own commands
│   └── shared/simpleclaude/      # SimpleClaude's own patterns
├── README.md                     # This file
├── PHASES.md                     # Development phases
└── CHECKPOINTS.md                # Progress tracking
```

## Development Philosophy

SimpleClaude takes inspiration from SuperClaude's architecture but implements
everything independently. We reference SuperClaude's patterns to understand what
works well, then implement our own streamlined version.

Remember: **SimpleClaude stands alone**.
