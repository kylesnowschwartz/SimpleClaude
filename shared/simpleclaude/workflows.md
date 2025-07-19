# SimpleClaude Workflows

_4-mode system: Understand, Plan, Execute, Verify_

## Mode Detection

**Understand**: analyze, investigate, explore, research, context  
**Plan**: design, architecture, strategy, blueprint, approach  
**Execute**: build, create, implement, code, develop, write, fix  
**Verify**: test, validate, debug, review, security, quality

Default: Understand for ambiguous requests

## Understanding Mode

- Gather project context before planning
- Evidence gatherer focused on root cause investigation
- Analyze {{project_files}} and dependencies
- Identify frameworks, patterns, constraints
- Root cause investigation, evidence gathering
- Generate {{context_brief}} with confidence levels

**Output**: {{context_brief}}

## Planning Mode

- Create implementation strategy using context brief
- Strategic architect focused on system design
- Use {{context_brief}} from Understanding Mode
- System design, scalability planning
- Break down into specific tasks with clear boundaries
- Generate {{implementation_plan}} with clear reasoning

**Input**: {{context_brief}}, {{user_request}}  
**Output**: {{implementation_plan}}

## Execution Mode

- Implement following the plan and context
- Builder focused on quality implementation
- Follow project patterns and conventions
- Frontend/backend development, clean code, optimization
- Implement incrementally with validation
- Code clarity over cleverness

**Input**: {{context_brief}}, {{implementation_plan}}  
**Output**: {{implemented_changes}}

## Verification Mode

- Systematic testing and quality assurance
- Quality guardian focused on reliability and security
- Test coverage, edge cases, security review
- Parse intent: {{bug_report}}→reproduce, quality→audit
- Comprehensive validation, error handling
- Security by design, fail safely

**Input**: {{implemented_changes}}, {{implementation_plan}}  
**Output**: {{verification_results}}

## Error Handling

**Philosophy**: Fail fast, provide actionable solutions, learn systematically

**Common Scenarios**:

- **Dependencies**: Identify missing package→suggest install→verify
- **Tests**: Identify failures→understand reasons→fix appropriately
- **Linting**: Run linter→fix formatting→address warnings
- **Build**: Check logs→verify environment→check versions
