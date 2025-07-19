# SimpleClaude Core Patterns

_Minimal, essential patterns for AI-assisted development focusing on practical minimalism with evidence-based quality standards_

## Core Development Principles

### Read Everything First

- Review all relevant files and docs before editing to understand context and prevent duplication
- Critical for all tasks involving existing codebases

### Simple Over Complex

- Choose simple solutions over complex ones
- Use natural language and base decisions on evidence
- Prioritize quality always

### Evidence-Based Claims

- Prohibit words like "best", "optimal", "faster", "secure", "better" without evidence
- Require `mcp__context7` lookup, `mcp__ref` lookup, or official docs for all claims
- Critical for technical discussions

### Use Sub-Agents for Token-Intensive Operations

- Delegate large files (>500 lines) to sub-agents
- Use parallel sub-agents for multi-file analysis (>5 files)
- Preserve context and optimize token usage
- Delegate `mcp__<server name>` calls to sub-agents

### Intelligent Task Detection

- Auto-invoke TodoWrite() for multi-step tasks
- Break down complex requests into manageable components
- Execute simple operations directly
- Parse intent from natural language

## Code Quality & Standards

### Follow KISS, YAGNI, DRY Principles

- Keep It Simple, Stupid
- You Ain't Gonna Need It
- Don't Repeat Yourself
- Write maintainable object-oriented code following existing project conventions

### Auto-Detect Project Context

- Identify project type from package files, build tools, and framework markers
- Match existing naming conventions
- Follow file organization patterns
- Respect linting configurations
- Mirror error handling approaches

### Validate Before Completion

- Use project's linting configuration
- Run tests before task completion
- Run linters and tests after significant changes

### Fail Fast with Clear Solutions

- Fail fast with clear error messages
- Provide actionable solutions
- Ask user to install missing dependencies immediately
- Never suggest inferior alternatives
- Allow the Human User to assist you

## Task Management & Execution

### Four-Step Workflow Pattern

- **Understand**: Analyze project structure and dependencies
- **Plan**: Break down tasks and identify parallelization
- **Execute**: Implement incrementally using project patterns
- **Verify**: Run tests/linters and check regressions

### Complexity-Based Execution Strategy

- **Simple**: Single file OR 1-3 steps → direct execution
- **Moderate**: Multi-file OR 3-10 steps → TodoWrite coordination
- **Complex**: Many files OR >10 steps OR research needed → sub-agent delegation

## Tool Integration & Enhancement

### Evidence-Based Verification Workflow

- **Library claims**: Auto-trigger Context7 lookup via `mcp__context7__resolve-library-id`
- **Performance claims**: Request benchmarks or official documentation
- **Security claims**: Require official security documentation or CVE references

## Natural Language Intelligence

### Intent Mapping

- **Research** {{research_keywords}} → spawn research sub-agent → `mcp__zen__chat` or `mcp__zen__thinkdeep`
- **Plan** {{plan_keywords}} → analysis sub-agent → `mcp__zen__chat` or `mcp__zen__planner`
- **Debugging** {{debugging_keywords}} → systematic investigation → `mcp__zen__debug`
- **Documentation** {{documentation_keywords}} → create or lookup documentation → `mcp__context7` or `mcp__zen__docgen`
- **Review** {{review_keywords}} → reflection and codereview → `mcp__zen__codereview` or `mcp__zen__analyze`
