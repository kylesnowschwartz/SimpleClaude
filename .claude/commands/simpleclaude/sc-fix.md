**Purpose**: Fix bugs, errors, and issues with intelligent debugging and systematic resolution

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze error context and codebase structure")`  
**Strategic Planning**: `Task("system-architect", "create debugging strategy and fix plan")`  
**Implementation**: `Task("implementation-specialist", "implement solution following debugging plan")`  
**Quality Validation**: `Task("validation-review-specialist", "verify fix resolves issue without side effects")`

**Supporting Specialists**:

- `Task("research-analyst", "investigate error patterns and best practices without implementation")`
- `Task("debugging-specialist", "systematic root cause analysis and troubleshooting")`
- `Task("documentation-specialist", "document debugging process and prevention strategies")`

**Execution Strategy**: For complex bugs, spawn multiple agents simultaneously for independent investigation streams.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

Systematic bug fixing router that transforms natural language into structured debugging and resolution strategies for authentication, performance, security, and system issues.

### Semantic Transformations

```
"fix the login bug" →
  What: authentication flow error
  How: quick patch with validation
  Mode: implementer

"carefully debug the memory leak" →
  What: memory management issue
  How: systematic investigation and root cause analysis
  Mode: planner

"walk me through fixing test failures" →
  What: test suite failures
  How: guided step-by-step debugging process
  Mode: tester

"patch SQL injection vulnerability" →
  What: security vulnerability in database queries
  How: input validation and parameterized queries
  Mode: implementer
```

Examples:

- `/sc-fix authentication error` - Quick fix for login issues
- `/sc-fix carefully debug memory leak` - Systematic memory investigation
- `/sc-fix test failures with coverage` - Debug tests and improve coverage
- `/sc-fix SQL injection in API` - Security patch with validation

**Context Detection:** Error patterns → Root cause identification → Fix strategy → Urgency detection → Sub-agent spawning

## Core Workflows

**Planner:** Sub-agents → Analyze error → Investigate root cause → Design fix strategy → Create safety plan  
**Implementer:** Sub-agents → Apply fix → Run tests → Validate solution → Deploy with monitoring  
**Tester:** Sub-agents → Reproduce issue → Create test cases → Verify fix → Prevent regression
