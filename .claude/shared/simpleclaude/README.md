# SimpleClaude Shared Patterns

This directory contains the core patterns and configurations for SimpleClaude.

## Files

### core-patterns.yml

Essential patterns for AI-assisted development. Features actionable investigation guidance:

- Smart defaults over explicit configuration
- Context-aware behavior with executable commands
- Investigation-driven complexity assessment
- Evidence-based validation standards

Key architectural principles:

- Investigation prompts over false precision
- Bash commands for concrete assessment
- Delegation criteria with measurable thresholds
- Evidence requirements with specific tool triggers

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
- Evidence-based library validation with Context7 integration

## Design Philosophy

SimpleClaude patterns prioritize:

1. **Discoverability** - Patterns should be self-evident
2. **Adaptability** - Detect and follow existing conventions
3. **Efficiency** - Use sub-agents for token-intensive work
4. **Simplicity** - Start simple, add complexity only when needed
