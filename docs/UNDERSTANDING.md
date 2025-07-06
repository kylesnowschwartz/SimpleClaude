# SimpleClaude: Comprehensive Understanding Document

## Executive Summary

SimpleClaude is a **standalone** AI assistant framework that consolidates ~19
SuperClaude commands into 5 intuitive commands. It achieves the same
functionality as SuperClaude but with a dramatically simplified interface
focused on discoverability and practical minimalism.

**Key Distinction**: SimpleClaude does NOT route to or depend on SuperClaude. It
implements its own consolidated functionality, using SuperClaude only as a
reference for design patterns and best practices.

## Core Vision and Philosophy

### 1. Practical Minimalism

- **Surface Simplicity, Deep Power**: Simple interface with advanced
  capabilities accessible when needed
- **Fewer, More Flexible Commands**: 5 commands that adapt based on context vs
  19 specific commands
- **Natural Language Arguments**: No complex flags - just describe what you want
- **Progressive Complexity**: Basic usage requires zero configuration

### 2. Discoverability First

- Commands should be intuitive and self-documenting
- New users understand the system within minutes
- Help is built into the commands themselves
- Examples accessible via `/command help`

### 3. Context-Aware Intelligence

- Auto-detects project type, frameworks, and conventions
- Adapts to existing code style and patterns
- Makes smart decisions without manual configuration
- Learns from user corrections and choices

### 4. Token Efficiency Through Sub-Agents

- Heavy use of Claude Code's Task tool for parallel operations
- Delegates token-intensive work to specialized sub-agents
- Maintains focused main conversation
- Synthesizes sub-agent results into coherent responses

## The 5 SimpleClaude Commands

### 1. `/sc-create` - Universal Creation Command

**Consolidates**: spawn, task, build, design, document, dev-setup

**Pattern**: Analyzes keywords to determine creation type:

- "project/app/system" → Full project creation
- "documentation/docs" → Documentation generation
- "architecture/design" → Design workflow
- "environment/setup" → Development setup
- "api/service" → API/service creation
- "component/function" → Code generation

**Implementation**: Under 100 lines, uses keyword detection to route to
appropriate workflow.

### 2. `/sc-modify` - Intelligent Modification Command

**Consolidates**: improve, migrate, cleanup, deploy, refactor

**Pattern**: Detects modification intent:

- "improve/optimize" → Performance and quality improvements
- "refactor/cleanup" → Code organization and cleanup
- "migrate/upgrade" → Version migrations
- "deploy/release" → Deployment workflows
- "update/enhance" → Feature enhancements

### 3. `/sc-understand` - Comprehensive Analysis Command

**Consolidates**: load, analyze, explain, estimate, index

**Pattern**: Determines analysis type:

- "how does X work" → Code explanation
- "analyze performance" → Performance analysis
- "estimate effort" → Effort estimation
- "explore codebase" → Codebase indexing
- "understand architecture" → System analysis

### 4. `/sc-fix` - Focused Problem Resolution

**Consolidates**: troubleshoot (fix mode), git fixes, error resolution

**Pattern**: Specializes in problem-solving:

- Error messages → Debug workflow
- "git issues" → Git problem resolution
- "broken tests" → Test fixing
- "performance issues" → Performance debugging

### 5. `/sc-review` - Quality Assurance Command

**Consolidates**: review, scan, test

**Pattern**: Quality-focused operations:

- "review code" → Code review workflow
- "security scan" → Security analysis
- "test coverage" → Test creation/analysis
- "quality check" → Quality metrics

## Implementation Pattern

Each command follows this structure:

```markdown
**Purpose**: [Smart description of consolidated functionality]

---

@include shared/simpleclaude/core-patterns.yml#patterns

## Command Execution

Execute: immediate. --plan→show plan first Purpose: "[Action] $ARGUMENTS"

[Description of consolidated functionality]

@include shared/simpleclaude/workflows.yml#workflows

Examples:

- [Natural language examples]

**[Category] Logic:**

IF $ARGUMENTS contains "[keywords]" → Execute [specific] workflow → Include
[relevant patterns]

ELSIF $ARGUMENTS contains "[other keywords]" → Execute [different] workflow

ELSE → Default to [sensible default]

**Keyword Detection:**

- **Category1**: keyword1, keyword2, keyword3
- **Category2**: keyword4, keyword5, keyword6

**Pass-through Flags:** All flags passed unmodified

@include shared/simpleclaude/core-patterns.yml#git_conventions
```

## Key Differences from SuperClaude

### 1. Command Structure

- **SuperClaude**: 19 specific commands with explicit flags
- **SimpleClaude**: 5 versatile commands with natural language

### 2. Configuration

- **SuperClaude**: Multiple configuration files, explicit setup
- **SimpleClaude**: Single SIMPLE.md, auto-detection, zero config

### 3. Personas/Modes

- **SuperClaude**: 9 distinct personas that switch completely
- **SimpleClaude**: 3 adaptive modes that blend naturally

### 4. Workflow Activation

- **SuperClaude**: Manual flag selection
- **SimpleClaude**: Keyword detection and context awareness

### 5. Sub-Agent Usage

- **SuperClaude**: Optional optimization
- **SimpleClaude**: Core architecture pattern

## Implementation Approach for Phase 2

### 1. Command Creation Process

For each of the 5 commands:

1. **Create command file** in `.claude/commands/simpleclaude/`
2. **Keep under 100 lines** using @include directives
3. **Implement keyword detection** using simple IF/ELSIF logic
4. **Pass $ARGUMENTS** to appropriate workflow
5. **Include examples** showing natural language usage

### 2. Keyword Detection Strategy

- Simple pattern matching on $ARGUMENTS
- Look for primary keywords that indicate intent
- Route to consolidated workflow based on detection
- Default to most common use case when ambiguous

### 3. Workflow Execution

- Each keyword category maps to a specific workflow
- Workflows defined in shared YAML files
- Heavy use of sub-agents for complex operations
- Mode selection happens automatically based on task

### 4. Integration Patterns

- **Context Detection**: Automatic before any operation
- **Mode Selection**: Based on task keywords and context
- **Sub-Agent Delegation**: For file analysis, research, parallel ops
- **Error Handling**: Fail fast with clear, actionable messages

### 5. Testing Strategy

- Each command tested with natural language inputs
- Verify correct workflow activation
- Ensure sub-agent delegation works properly
- Validate mode blending behavior

## Technical Architecture

### File Organization

```
.claude/
├── SIMPLE.md                          # Main config (under 1000 tokens)
├── commands/
│   ├── simpleclaude/                  # All SimpleClaude commands
│   │   ├── sc-create.md              # Prefixed with 'sc-'
│   │   ├── sc-modify.md
│   │   ├── sc-understand.md
│   │   ├── sc-fix.md
│   │   └── sc-review.md
│   └── [user custom commands]         # User's additions
└── shared/
    ├── simpleclaude/                  # SimpleClaude patterns
    │   ├── core-patterns.yml
    │   ├── modes.yml
    │   ├── workflows.yml
    │   └── context-detection.yml
    └── [user patterns]                # User's patterns
```

### Core Components

1. **Commands**: Entry points that detect intent and route
2. **Workflows**: Reusable patterns for common tasks
3. **Modes**: Adaptive behavior profiles that blend
4. **Context Detection**: Auto-configuration system
5. **Core Patterns**: Essential development principles

## Success Metrics

- **80% reduction** in command learning curve
- **90% functionality** preserved from SuperClaude
- **50% reduction** in average command length
- **Zero configuration** required for basic usage
- **95% accuracy** in understanding natural language commands

## Key Implementation Notes

1. **Standalone System**: SimpleClaude implements its own logic
2. **Reference Only**: SuperClaude used for patterns, not dependencies
3. **Simple Detection**: Basic keyword matching, not complex parsing
4. **$ARGUMENTS Pattern**: Pass full user input for maximum flexibility
5. **Under 100 Lines**: Commands stay concise through @include usage
6. **Consolidation Focus**: Merge related concepts, don't just route

## Next Steps for Phase 2

1. Implement remaining 4 commands following sc-create pattern
2. Each command uses keyword detection → workflow execution
3. Test natural language understanding
4. Verify sub-agent delegation patterns
5. Ensure mode blending works correctly
6. Document common usage patterns

The goal is to make AI assistance feel like working with a helpful colleague who
understands what you need without requiring complex commands or configuration.
