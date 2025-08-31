# SimpleClaude Documentation

## Overview

SimpleClaude is a practical minimalist AI assistant framework that transforms complex AI interactions into natural conversations through specialized agents. Features 4+1 intent-based commands that understand user goals and orchestrate intelligent workflows.

## Core Philosophy

### Surface Simplicity, Deep Power

- Simple natural language interface
- Advanced capabilities emerge when needed
- Zero configuration for basic usage
- Complexity available through context, not flags

### Practical Minimalism

- Focus on real-world development patterns
- Adapt to projects, don't prescribe rules
- Keep it simple, but not simplistic
- Every feature must earn its place

## The 4+1 Intent-Based Commands

### `/sc-plan` - Strategic Planning 

"I need to think through something" - Analysis and roadmap creation:

- "How should I add authentication?" → Architecture planning
- "Plan the migration strategy" → Migration roadmap  
- "What's the best approach for this feature?" → Strategic analysis

### `/sc-work` - Universal Implementation

"I need to build/fix/modify something" - All implementation work:

- "Add JWT authentication" → Feature creation
- "Fix the memory leak" → Bug resolution
- "Refactor for performance" → Code improvement

### `/sc-explore` - Research and Understanding

"I need to understand something" - Investigation and knowledge synthesis:

- "How does authentication work here?" → Codebase exploration
- "What are GraphQL best practices?" → Technology research
- "Analyze performance bottlenecks" → System investigation

### `/sc-review` - Quality Verification

"I need to verify quality/security/performance" - Comprehensive assessment:

- "Check security vulnerabilities" → Security audit
- "Verify performance" → Performance analysis
- "Review code quality" → Quality assessment

### `/sc-workflow` - Structured Development

"I need structured, resumable task execution" - Enterprise methodology:

- INIT → SELECT → REFINE → IMPLEMENT → COMMIT lifecycle
- Persistent artifacts in todos/ structure
- Resumable tasks with clean git discipline

## Quick Start

```bash
# Plan your approach
/sc-plan "How should I add real-time notifications to this app?"

# Implement anything
/sc-work "Add WebSocket support with authentication"

# Research and understand
/sc-explore "How does the current authentication system work?"

# Verify quality and security
/sc-review "Check for security vulnerabilities in auth module"

# Structured development workflow
/sc-workflow "Start methodical development process"
```

No flags. No configuration. Just describe what you need.

## Key Innovations

### Intent Recognition

No flags needed - commands understand your goals:

- Natural language expresses intent clearly
- Commands route to appropriate execution  
- Context enhances understanding
- Agent orchestration handles complexity

#### The 4 Lightweight Agents

1. **context-analyzer** - Maps project structure, technology stack, and existing patterns
2. **repository-documentation-expert** - Finds documentation from Context7, local repos, and GitHub repositories
3. **test-runner** - Runs tests and analyzes failures without making fixes
4. **web-search-researcher** - Searches web for current information and research

Each agent is lightweight, focused, and designed for maximum token efficiency in its domain.

## Design Principles

1. **Discoverability First**: New users productive in minutes
2. **Context-Aware Intelligence**: Adapts to your project automatically
3. **Progressive Complexity**: Advanced features emerge when needed
4. **Evidence-Based Decisions**: All suggestions backed by analysis
5. **Fail Fast, Fix Fast**: Clear errors with actionable solutions

## What Makes SimpleClaude Different?

### From Previous Architectures

- 19 commands → 4+1 intent-based commands
- Task-based → Intent-based philosophy
- Flag combinations → Natural language goals
- Manual configuration → Auto-detection
- Rigid command boundaries → Flexible intent routing
- Heavyweight frameworks → Lightweight agent orchestration
- Complex configuration → Clean Task() delegation

### From Traditional Tools

- No memorizing command syntax
- No reading extensive documentation
- No complex configuration files
- No artificial limitations
- Just describe what you need

## Agent Architecture Complete

SimpleClaude's agent-based architecture is ready for real-world testing! All core features are implemented:

- ✅ Natural language understanding
- ✅ Automatic mode detection
- ✅ Zero configuration required
- ✅ **Lightweight agent system**: 5 focused agents handle specific tasks
- ✅ **Token efficiency**: Isolated agent contexts prevent bloat
- ✅ **Clean Task() delegation**: Commands orchestrate, agents execute
