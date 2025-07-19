# SimpleClaude Workflows & Patterns

_Implementation patterns and guidance for effective agent execution_

## Context Detection Workflow

### Step 1: Project Detection Priority

Consider this preference hierarchy, typically stopping at the first strong signal:

1. `package.json` → parse dependencies → React/Vue/Angular/Next
2. `requirements.txt`/`pyproject.toml` → Django/Flask/FastAPI
3. `go.mod` → Go project, `Cargo.toml` → Rust project, `Gemfile` → Rails project
4. File patterns (`.jsx`, `.vue`, MVC directories) as fallback indicators

### Step 2: Code Style Adaptation

- Analyze 2-3 existing files for naming/style patterns
- Check linter configurations (.eslintrc, .prettierrc)
- Match import organization, documentation, and formatting styles

### Step 3: Library Validation

- Use `mcp__context7` for current library examples before coding
- Verify dependencies exist in project dependency files
- Ask user for guidance if unknown libraries are detected

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

- **Library Claims**: Recommend Context7 lookup via `mcp__context7__resolve-library-id` for verification
- **Performance Claims**: Request benchmarks or official documentation when making assertions
- **Security Claims**: Require official security documentation or CVE references for credibility

### MCP Tool Integration

- **Context7**: Library documentation and current examples
- **Ref**: Documentation search and URL content analysis
- **Zen Tools**: Specialized analysis (chat, debug, analyze, etc.)

## Error Handling Patterns

### Philosophy

Fail fast, provide actionable solutions, learn systematically

### Common Scenarios

- **Dependencies**: Identify missing package → suggest installation → verify success
- **Tests**: Identify failures → understand root causes → fix appropriately
- **Linting**: Run linter → fix formatting → address warnings systematically
- **Build Issues**: Check logs → verify environment → validate versions

### Project Context Adaptation

- **JavaScript Projects**: Check package.json dependencies, detect React/Vue/Angular/Next patterns
- **Python Projects**: Analyze requirements files, identify Django/Flask/FastAPI frameworks
- **Go Projects**: Parse go.mod for module structure and dependencies
- **Rust Projects**: Examine Cargo.toml for crate information and dependencies
- **Ruby Projects**: Check Gemfile and detect Rails MVC structure patterns

These patterns provide flexible guidance and proven approaches for effectively implementing the operational modes defined in the orchestration framework.
