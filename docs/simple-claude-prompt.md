# Simple-Claude: Streamlined AI Assistant Framework

**CRITICAL CLARIFICATION**: SimpleClaude is a STANDALONE project that takes
inspiration from SuperClaude but does NOT depend on it. SuperClaude is our
reference for design patterns, but SimpleClaude implements its own consolidated
functionality.

Create a modular AI assistant framework called "Simple-Claude" by learning from
SuperClaude's patterns and consolidating its concepts into a simpler, standalone
system. This is NOT routing to SuperClaude - it's implementing consolidated
versions of SuperClaude's functionality.

## Starting Point

You have access to the complete SuperClaude codebase including:

- All YAML templates in `.claude/commands/shared/` and `.claude/shared/`
- All 19 existing commands in `.claude/commands/superclaude/`
- The @include reference system and template engine
- Proven patterns for sub-agent orchestration, error handling, and MCP
  integration

Your task is to consolidate and simplify this existing functionality, NOT
rebuild it.

## Core Design Principles

1. **Discoverability First**: Commands should be intuitive and self-documenting.
   A new user should understand what's available within minutes.

2. **Fewer, More Flexible Commands**: Consolidate similar commands into
   versatile tools that adapt based on context rather than requiring explicit
   flags.

3. **Smart Defaults**: The system should make intelligent decisions about
   approach based on context, reducing the need for manual flag selection.

4. **Progressive Complexity**: Basic usage should require zero configuration,
   with advanced features available when needed.

5. **Preserve Core Strengths**: Maintain SuperClaude's evidence-based
   methodology, token optimization, and systematic approaches while simplifying
   the interface.

## Simplification Strategy

From SuperClaude's 19 commands → 5-6 versatile commands From 9 personas → 3
adaptive modes  
From flag combinations → natural language arguments From manual configuration →
context-aware defaults

Keep: Evidence-based methodology, token efficiency through sub-agents, quality
standards, @include system

## Command Architecture

Consolidate SuperClaude's 19 commands into 5-6 core commands by:

- `/create` - Merge: `/spawn` `/task` `/build`, `/design`, `/document`
  functionality
- `/modify` - Merge: `/improve`, `/migrate`, `/cleanup` functionality
- `/understand` - Merge: `/load /analyze`, `/explain`, `/troubleshoot`,
  `/estimate` functionality
- `/fix` - Keep focused on: `/troubleshoot` (fix mode), error resolution
- `/review` - Merge: `/review`, `/scan`, `/test` functionality

Reuse the existing command logic, just route it through simpler entry points.

Each command should:

- Auto-detect context (file types, project structure, error patterns)
- Use natural language arguments instead of complex flag combinations
- Provide helpful suggestions when unclear about user intent
- Include built-in examples accessible via `/command help`
- Show common workflows when called without arguments (like git does)

## Simplified Persona System

Replace the 9-persona system with 3 flexible modes:

- **Planner**: Research-focused, asks clarifying questions, thorough analysis
- **Implementer**: Action-oriented, makes decisions quickly, focuses on
  implementation
- **Tester**: Quality-focused, emphasizes best practices, QA, and security

These modes should:

- Auto-activate based on command and context
- Be overrideable with simple syntax: `/understand :planner`
- Blend naturally rather than completely switching behavior

## Configuration Approach

- Single `SIMPLE.md` configuration file (under 1000 tokens)
- Auto-detection of project type and preferences
- Learning from user corrections and choices
- Minimal required setup - works out of the box

## Technical Architecture

### Implementation Strategy

1. **Copy SuperClaude's structure** as the starting point
2. **Reuse YAML templates** from `shared/` directories - don't rewrite them
3. **Merge command files** rather than creating new ones from scratch
4. **Keep the @include system** exactly as it is - it already works perfectly
5. **Consolidate personas** by grouping existing persona definitions
6. **Simplify interfaces** by creating new routing commands that call existing
   logic

### File Organization

Use a clear namespace to separate Simple-Claude from user customizations:

```
.claude/
├── SIMPLE.md                          # Main Simple-Claude config
├── commands/
│   ├── simpleclaude/                  # All Simple-Claude commands
│   │   ├── sc-create.md              # Prefixed with 'sc-'
│   │   ├── sc-modify.md
│   │   ├── sc-understand.md
│   │   ├── sc-fix.md
│   │   └── sc-review.md
│   └── my-custom-command.md           # User's custom commands (loose files)
└── shared/
    ├── simpleclaude/                  # Simple-Claude templates
    │   └── *.yml                      # Reused from SuperClaude
    └── my-patterns.yml                # User's custom templates (loose files)
```

This ensures:

- Clean separation between framework and user files
- Easy updates without conflicts
- Clear ownership of commands with `sc-` prefix
- Ability to have both SuperClaude and Simple-Claude installed

### Claude Code Integration

Leverage Claude Code's advanced capabilities:

- **Sub-Agent Architecture**: Commands should heavily utilize the Task tool to
  spawn specialized sub-agents for token-intensive operations (file analysis,
  codebase exploration, research)
- **Parallel Processing**: Use multiple sub-agents concurrently for independent
  tasks (e.g., analyzing different modules simultaneously)
- **Context Isolation**: Each sub-agent operates in its own context window,
  preventing token overflow in the main conversation
- **Result Aggregation**: Main agent synthesizes sub-agent findings into
  coherent responses

### Command Implementation Patterns

Each command should intelligently delegate work to sub-agents for
token-intensive operations, then synthesize results based on the active mode.

### Design Philosophy

When simplicity conflicts with power, follow these principles:

1. **Surface Simplicity, Deep Power**: Make the default path simple while
   keeping advanced capabilities accessible
2. **Intelligent Escalation**: Start simple, but recognize when complexity is
   needed and guide users there
3. **Context-Aware Defaults**: Use project structure, file types, and recent
   actions to make smart decisions
4. **Learn from Usage**: Adapt to user preferences without requiring
   configuration

Remember: The goal is not to remove SuperClaude's power, but to make it more
accessible. Simple-Claude should feel like a senior developer who knows when to
keep things simple and when to dive deep.

Focus on making AI assistance feel like a helpful colleague rather than a
complex tool. Every interaction should feel natural and require minimal
cognitive overhead to achieve the desired outcome.
