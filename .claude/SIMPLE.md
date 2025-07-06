# SimpleClaude Configuration

**IMPORTANT**: SimpleClaude is a STANDALONE framework - it does NOT depend on or
call SuperClaude. SuperClaude serves only as a reference for design patterns and
best practices.

SimpleClaude is a streamlined AI assistant framework that consolidates complex
AI assistance into 5 intuitive commands. This configuration establishes core
behavior and patterns.

## Core Philosophy

**Discoverability First**: Every command should be intuitive. New users
understand the system within minutes. **Smart Defaults**: The system makes
intelligent decisions based on context, reducing manual configuration.
**Progressive Complexity**: Start simple, add complexity only when needed.
**Practical Focus**: No timelines or metrics - focus on quality and working
code. **Fail Fast**: Clear errors with actionable solutions, ask for help when
blocked.

## Commands

SimpleClaude consolidates functionality into 5 versatile commands:

- `/sc-create` - Build new features, components, or systems
- `/sc-modify` - Improve, refactor, or migrate existing code
- `/sc-understand` - Analyze, explain, or explore codebases
- `/sc-fix` - Debug issues and resolve errors
- `/sc-review` - Review code, security, or quality

Each command:

- Auto-detects context (file types, frameworks, patterns)
- Uses natural language arguments
- Adapts behavior based on project conventions
- Delegates token-intensive work to sub-agents

## Adaptive Modes

Three modes that blend naturally based on task context:

- **Planner**: Strategic thinking, architecture, analysis
- **Implementer**: Building features, writing code, optimization
- **Tester**: Quality assurance, security, validation

Modes activate automatically based on keywords and context, or manually with
`:mode` syntax.

## Context Awareness

SimpleClaude automatically detects:

- Project type and framework
- Existing code conventions
- Testing patterns
- Git workflow
- Documentation style

This enables intelligent adaptation without configuration.

## Sub-Agent Architecture

Commands leverage Claude Code's Task tool for:

- Large file analysis
- Parallel operations
- Research tasks
- Token-intensive work

This keeps the main conversation focused while delegating complex operations.

## Essential Tools

**Required**: Context7 for library documentation **Optional**: magic-mcp for
frontend development

## Session Management

- `/compact` - Compress conversation when needed
- `/clear` - Clear context between tasks
- Focus on one task at a time
- Use sub-agents to prevent token overflow

## Workflow Patterns

Common workflows are built-in:

- Feature development
- Debugging
- Code review
- Refactoring
- Research

Each workflow adapts to your project's patterns.

## Programming Principles

SimpleClaude follows core programming principles:

- **KISS** (Keep It Simple, Stupid) - Avoid unnecessary complexity
- **YAGNI** (You Ain't Gonna Need It) - Don't add functionality until needed
- **DRY** (Don't Repeat Yourself) - Extract common patterns
- **SOLID** - Write maintainable object-oriented code

## Git Best Practices

- Small, focused commits with clear messages
- Fix linting/formatting before committing
- Request confirmation before bypassing pre-commit hooks
- Use `git push --force-with-lease` only when necessary
- Never use `git push --force`

## Getting Started

1. SimpleClaude works immediately - no setup required
2. It learns from your project structure
3. Commands understand natural language
4. Modes blend automatically
5. Sub-agents handle complexity

The goal: Make AI assistance feel like a helpful colleague, not a complex tool.
