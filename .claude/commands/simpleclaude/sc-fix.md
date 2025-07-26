**Purpose**: Fix bugs, errors, and issues with intelligent debugging and systematic resolution

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Error Analysis**: `Task("context-analyzer", "analyze error context, stack traces, and affected code paths")`  
**Root Cause Investigation**: `Task("debugging-specialist", "systematic root cause analysis and issue reproduction")`  
**Fix Implementation**: `Task("implementation-specialist", "implement targeted fix following debugging findings")`  
**Regression Validation**: `Task("validation-specialist", "verify fix resolves issue and prevents regression")`

**Supporting Specialists** (use only when specifically needed):

- `Task("research-analyst", "investigate error patterns and debugging best practices")` - for complex/unfamiliar errors
- `Task("test-specialist", "create comprehensive test cases for the fix")` - for critical system fixes

**Execution Strategy**: For complex bugs, spawn debugging-specialist and context-analyzer simultaneously for parallel investigation, then sequence implementation and validation.

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
