**Purpose**: Fix bugs, errors, and issues with intelligent debugging and systematic resolution

---

@include shared/simpleclaude/context-detection.yml

@include shared/simpleclaude/core-patterns.yml

@include shared/simpleclaude/mode-detection.yml

@include shared/simpleclaude/modes.yml

@include shared/simpleclaude/workflows.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]

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

**Intelligent Context Detection:** Analyzes error patterns | Identifies root causes automatically | Chooses optimal fix strategy | Evidence-based debugging | Detects fix urgency from natural language

## Core Workflows

**Planner:** Analyze error → Investigate root cause → Design fix strategy → Create safety plan

**Implementer:** Apply fix → Run tests → Validate solution → Deploy with monitoring

**Tester:** Reproduce issue → Create test cases → Verify fix → Prevent regression
