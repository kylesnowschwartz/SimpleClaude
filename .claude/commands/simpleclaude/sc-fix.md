**Purpose**: Smart debugging router for systematic error resolution

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Systematically investigates, diagnoses, and fixes errors by transforming problem
descriptions into structured debugging directives.

### Semantic Transformations

```
"TypeError in user.js" →
  What: runtime type error in user.js file
  How: stack trace analysis, type validation, null checks
  When: immediate with focused investigation

"failing tests" →
  What: test suite failures across codebase
  How: analyze test output, trace failures, fix root causes
  When: immediate with test re-execution

"slow API response" →
  What: API performance degradation
  How: profiling, query analysis, caching opportunities
  When: immediate with performance monitoring

"merge conflicts --interactive" →
  What: git merge conflict resolution
  How: analyze both branches, preserve intent, validate
  When: interactive mode with user confirmation
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-fix TypeError in user.js` - Fix runtime error
- `/sc-fix failing tests` - Debug and fix test failures
- `/sc-fix merge conflicts --interactive` - Resolve git conflicts
- `/sc-fix slow API response` - Performance troubleshooting
- `/sc-fix build error --c7` - Fix build with documentation help

## Smart Detection & Routing

```yaml
Runtime Errors: [TypeError, ReferenceError, undefined, null, NaN]
  → Stack trace analysis, variable tracing, null checks, type validation

Build/Deploy: [build failed, compile error, webpack, deployment, CI/CD]
  → Config validation, dependency check, environment vars, build logs

Git Issues: [merge conflict, detached HEAD, rebase failed, uncommitted]
  → Conflict resolution, branch recovery, stash management, history fix

Performance: [slow, timeout, memory leak, high CPU, bottleneck]
  → Profiling, query analysis, caching, algorithm optimization

Security/Auth: [authentication, permission denied, CORS, token, SSL]
  → Auth flow tracing, permission audit, token validation, cert check
```

**Five Whys Analysis:** Root cause investigation | Evidence gathering |
Systematic approach | Prevention focus

**--watch:** Monitor error patterns | Real-time debugging | Auto-retry fixes
**--interactive:** Step-by-step resolution | Explain fixes | User confirmation
**--rollback:** Enable safe rollback | Track all changes | Quick recovery

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Fix_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Error Analysis:** Parse error → Extract context → Identify patterns → Find
root cause

**Investigation:** Trace execution → Check recent changes → Analyze dependencies
→ Test hypotheses

**Fix Application:** Generate solutions → Apply incrementally → Test each fix →
Verify resolution

**Prevention:** Add error handling → Improve logging → Create tests → Document
solution

## Sub-Agent Delegation

```yaml
When: Complex debugging | Multi-system issues | Performance analysis
How: Error parser → Investigation agents → Fix validation
Examples:
  - Production errors: Log analyzer → Code tracer → Fix applier
  - Performance issues: Profiler agent → Optimization agent
  - Git problems: History analyzer → Conflict resolver
```

## Debugging Methodology

1. Parse and classify the error
2. Gather minimal necessary context
3. Apply Five Whys analysis
4. Generate targeted solutions
5. Verify fix effectiveness

## Best Practices

- Understand before fixing
- Make minimal changes
- Test fixes thoroughly
- Document solutions
- Prevent recurrence
