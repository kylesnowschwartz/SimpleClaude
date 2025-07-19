# SimpleClaude Sub-Agent Delegation

_Token-efficient delegation through specialized agents for parallel processing_

## Core Delegation Principles

### Explore Before Implementation

Always explore thoroughly before attempting implementation to ensure deep understanding of the codebase and task requirements:

- Spawn researcher sub-agents to understand codebase without writing code
- Use sub-agents early in conversations, especially at the start
- Only implement after thorough exploration and analysis
- **Pattern**: "Based on the implementation plan, spawn specialized sub agents for each task to work in parallel"

### Token Context Management

- MCP tool calls should be done within sub-agents for optimal token context management
- Sub-agents receive minimal context with no conversation history
- Main thread coordinates and synthesizes all sub-agent outputs

## Sub-Agent Types & Roles

### Research Specialists

- **Purpose**: Analysis specialist that explores without writing code
- **Spawning**: `spawn a researcher sub-agent to {{research_task}} (do not write code)`
- **Responsibilities**: Read and analyze files, verify assumptions, report findings

### Implementation Specialists

- **Purpose**: Code generation and modification specialist
- **Spawning**: `spawn a coder sub-agent to {{implementation_task}}`
- **Responsibilities**: Generate and modify code, follow established patterns, operate with minimal context

### Testing Specialists

- **Purpose**: Validation and quality assurance specialist
- **Spawning**: `spawn a validator sub-agent to {{validation_task}}`
- **Responsibilities**: Create tests, validate code functionality, check security and performance

### Domain Specialists

- **Purpose**: Expert for specialized or edge-case tasks
- **Spawning**: `spawn a specialist sub-agent to {{specialized_task}}`
- **Responsibilities**: Infer expertise needed from context, handle edge cases not covered by other types

## Delegation Patterns

### Spawning Examples

Use this reference pattern: "Based on the {{plan_type}} plan, spawn specialized sub agents for each task to work in parallel:"

- **Research**: `- Spawn a researcher sub-agent to {{research_objective}} (do not write code)`
- **Implementation**: `- Spawn a coder sub-agent to {{implementation_objective}}`
- **Testing**: `- Spawn a validator sub-agent to {{testing_objective}}`
- **Specialized**: `- Spawn a specialist sub-agent to {{specialized_objective}}`

### Workflow Sequence

Follow this general progression: **EXPLORE → PLAN → CODE → COMMIT**

- **Researchers** gather initial understanding and evidence
- **Synthesis** occurs in main thread for coordination
- **Coders** implement based on research findings
- **Validators** verify and test implementations

## Coordination & Synthesis

### Sub-Agent Coordination

- **Workflow**: Analyze → Plan → Delegate → Synthesize
- **Guidance**: Adapt sequence based on {{task_complexity}} and {{project_requirements}}
- **Integration**: Main thread maintains overall coordination and synthesizes outputs

### Synthesis Rules

- Main thread coordinates and synthesizes all sub-agent outputs
- Validator findings override coder assumptions when conflicts arise
- Security concerns take precedence in all decision-making
- Sub-agents operate independently with minimal context overlap

## Mode-Specific Integration

### Planner Mode Integration

- Researchers gather evidence and perform initial analysis
- Analysis feeds into comprehensive planning phase
- Planning considers all research findings before delegation

### Implementer Mode Integration

- Researchers identify existing patterns and architectural constraints
- Coders implement based on research findings
- Parallel execution maximizes efficiency while maintaining consistency

### Tester Mode Integration

- Researchers identify edge cases and potential failure points
- Validators create comprehensive tests based on research
- Verification ensures quality and completeness

This delegation framework enables efficient parallel processing while maintaining coordination and quality through specialized agent roles.
