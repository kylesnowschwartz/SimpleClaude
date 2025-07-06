# SimpleClaude Shared Patterns

This directory contains the core patterns and configurations for SimpleClaude.

## Files

### core-patterns.yml
Essential patterns for AI-assisted development. This file has been simplified from SuperClaude to focus on:
- Smart defaults over explicit configuration
- Context-aware behavior instead of hardcoded rules
- Minimal essential patterns rather than exhaustive lists

Key improvements from feedback:
- Proper YAML syntax (no markdown tables)
- Removed out-of-scope references (reports/tasks/checkpoints)
- Git conventions detect existing patterns instead of being prescriptive
- No hardcoded file extensions - inferred from project
- Correct Claude Code commands (/compact, /clear)
- Only essential MCP servers listed (Context7 required, magic-mcp optional)
- Focus on sub-agent delegation over compression flags

### modes.yml
Defines the three adaptive modes (Planner, Implementer, Tester) that replace SuperClaude's 9 personas. Features:
- Proper YAML structure without markdown formatting
- Natural mode blending based on task context
- Clear activation triggers and manual override syntax
- Combines best aspects of multiple SuperClaude personas

### workflows.yml
Common development workflows adapted for SimpleClaude's simplified command structure. Includes:
- Feature development lifecycle
- Debugging approaches
- Code review patterns
- Refactoring workflows
- Sub-agent delegation patterns
- Error handling strategies

### context-detection.yml
Patterns for auto-detecting project context and conventions. Features:
- Project type detection from package files
- Framework identification
- Code style inference
- Git workflow detection
- Smart defaults based on context
- Library usage patterns

## Design Philosophy

SimpleClaude patterns prioritize:
1. **Discoverability** - Patterns should be self-evident
2. **Adaptability** - Detect and follow existing conventions
3. **Efficiency** - Use sub-agents for token-intensive work
4. **Simplicity** - Start simple, add complexity only when needed