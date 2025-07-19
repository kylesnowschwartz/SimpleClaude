# SimpleClaude Commands

This directory contains the 5 core SimpleClaude commands that transform natural language requests into structured AI workflows:

1. **sc-create.md** - Build new functionality and features
2. **sc-modify.md** - Change and improve existing code
3. **sc-understand.md** - Analyze and explain codebase components
4. **sc-fix.md** - Resolve issues and troubleshoot problems
5. **sc-review.md** - Validate quality and ensure standards

## Framework Integration

Each command leverages the SimpleClaude framework from `@shared/simpleclaude/`:

- **Core Principles**: Quality-first development with evidence-based validation
- **Four-Mode System**: Adaptive Understand/Planner/Implementer/Tester modes based on context
- **Context Detection**: Automatic project pattern recognition and adaptation
- **Sub-Agent Delegation**: Token-efficient parallel processing through specialized agents

## Command Architecture

Commands use a 4-phase approach:

### Phase 1: Understand Mode

- Analyze and comprehend the current codebase context
- Identify existing patterns, dependencies, and constraints
- Gather necessary context before planning

### Phase 2: Planner Mode

- Parse natural language input and detect project context
- Assess task complexity and identify required resources
- Create structured plan with sub-agent delegation strategy

### Phase 3: Implementer Mode

- Execute plan using specialized sub-agents for parallel processing
- Apply project-specific patterns and maintain code consistency
- Coordinate outputs through main thread synthesis

### Phase 4: Tester Mode

- Validate implementation quality and completeness
- Run tests, linters, and verification processes
- Ensure deliverables meet established standards

## Template Variables

Commands use template variables from the framework for dynamic adaptation:

- `{{project_type}}` - Detected framework (React, Django, etc.)
- `{{task_complexity}}` - Simple/Moderate/Complex assessment
- `{{research_task}}` - Context-specific investigation objectives
- `{{implementation_task}}` - Execution-focused work items
- `{{validation_task}}` - Quality assurance requirements

## Sub-Agent Integration

Commands automatically spawn specialized sub-agents:

- **Researchers**: Explore codebase without writing code
- **Coders**: Implement following established patterns
- **Validators**: Create tests and verify quality
- **Specialists**: Handle domain-specific or edge-case tasks

This architecture enables token-efficient execution while maintaining coordination and quality through the SimpleClaude framework.
