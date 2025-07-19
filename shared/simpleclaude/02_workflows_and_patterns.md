# SimpleClaude Workflows & Patterns

_Implementation patterns and guidance for effective agent execution_

## Context Detection Workflow

### Step 1: Project Context Detection

Analyze the project to understand its technology stack and development patterns. Check for `package.json` to identify JavaScript frameworks like React, Vue, Angular, or Next.js; examine `requirements.txt` or `pyproject.toml` for Python frameworks like Django, Flask, or FastAPI; look for `go.mod`, `Cargo.toml`, or `Gemfile` to identify Go, Rust, or Ruby/Rails projects. Use file extensions and directory structures as fallback indicators. Review existing code files to understand naming conventions and style patterns. Verify any libraries exist in dependency files and use `mcp__context7` for current documentation before coding.

### Step 2: Task Complexity Assessment

- **Simple Tasks**: Single file OR 1-3 steps → direct execution
- **Moderate Tasks**: Multi-file OR 3-10 steps → TodoWrite coordination
- **Complex Tasks**: Many files OR >10 steps OR research needed → sub-agent delegation

## Task Management Patterns

### Four-Step Workflow Pattern

- **Understand**: Analyze project structure and dependencies
- **Plan**: Break down tasks and identify parallelization opportunities
- **Execute**: Implement incrementally using established project patterns
- **Verify**: Run tests/linters and check for regressions

### Task Complexity Assessment

- **Simple Tasks**: Single file OR 1-3 steps → direct execution
- **Moderate Tasks**: Multi-file OR 3-10 steps → TodoWrite coordination
- **Complex Tasks**: Many files OR >10 steps OR research needed → sub-agent delegation

### Intelligent Task Detection

- Consider using TodoWrite() for multi-step tasks requiring coordination
- Break down complex requests into manageable components when helpful
- Execute simple operations directly when appropriate
- Parse intent from natural language context to guide approach

## Sub-Agent Delegation Patterns

### When to Consider Delegation

- Large files (>500 lines) typically benefit from detailed sub-agent analysis
- Multi-file analysis (>5 files) often benefits from parallel processing
- Token-intensive operations may exceed context limits
- Specialized MCP tool usage (`mcp__<server>` calls) can be delegated effectively

### Delegation Strategy

- Preserve context and maintain coordination
- Use parallel sub-agents for independent work
- Optimize token usage across agent network
- Consolidate results for final presentation

## Tool Integration Patterns

### Evidence-Based Verification Patterns

- **Library Claims**: Recommend Context7 lookup via `mcp__context7` for verification
- **Performance Claims**: Request benchmarks or official documentation when making assertions
- **Security Claims**: Require official security documentation or CVE references for credibility

### MCP Tool Integration

- **Context7**: `mcp__context7` Library documentation and current examples
- **Ref**: `mcp__ref` Documentation search and URL content analysis
- **Zen Tools**: `mcp__zen` Specialized analysis (chat, debug, analyze, etc.)

## Error Handling Patterns

### Philosophy

Fail fast, provide actionable solutions, learn systematically

### Common Scenarios

- **Dependencies**: Identify missing package → suggest installation → verify success
- **Tests**: Identify failures → understand root causes → fix appropriately
- **Linting**: Run linter → fix formatting → address warnings systematically
- **Build Issues**: Check logs → verify environment → validate versions

These patterns provide flexible guidance and proven approaches for effectively implementing the operational modes defined in the orchestration framework.
