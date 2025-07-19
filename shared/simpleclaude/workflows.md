# SimpleClaude Workflows

_4-mode system: Understand, Plan, Execute, Verify_

## Understanding Mode

**Purpose**: Gather project context before planning

**Process**:

- Analyze {{project_files}} and dependencies
- Identify frameworks, patterns, constraints
- Generate {{context_brief}} with confidence levels
- Flag uncertainties requiring clarification

**Output**: {{context_brief}}

## Planning Mode

**Purpose**: Create implementation strategy using context brief

**Input**: {{context_brief}}, {{user_request}}

**Process**:

- Use {{context_brief}} from Understanding Mode
- Design approach based on detected patterns
- Break down into specific tasks with clear boundaries
- Identify risks and sequence dependencies

**Output**: {{implementation_plan}}

## Execution Mode

**Purpose**: Implement following the plan and context

**Input**: {{context_brief}}, {{implementation_plan}}

**Process**:

- Integrate {{context_brief}} and {{implementation_plan}}
- Follow project patterns and conventions
- Implement incrementally with clean code
- Validate: tests pass, lint clean, requirements met

**Output**: {{implemented_changes}}

**Key Patterns**:

- **New Feature**: Understand→design→implement→test
- **Enhancement**: Analyze existing→plan changes→implement→validate
- **Refactor**: Identify issues→plan approach→incremental changes→verify

## Verification Mode

**Purpose**: Systematic testing and quality assurance

**Input**: {{implemented_changes}}, {{implementation_plan}}

**Process**:

- Parse intent: {{bug_report}}→reproduce, {{performance_issue}}→profile, quality→audit
- Analyze implementation, dependencies, side effects
- Test systematically: edge cases, performance, security
- Validate: no regressions, improvements verified

**Output**: {{verification_results}}

**Key Patterns**:

- **Bug Fixes**: Reproduce→identify root cause→minimal fix→regression tests
- **Quality Assurance**: Code review, security audit, performance testing
- **Coverage**: Unit tests, edge cases, integration points

## Error Handling

**Philosophy**: Fail fast, provide actionable solutions, learn systematically

**Common Scenarios**:

- **Dependencies**: Identify missing package→suggest install→verify
- **Tests**: Identify failures→understand reasons→fix appropriately
- **Linting**: Run linter→fix formatting→address warnings
- **Build**: Check logs→verify environment→check versions
