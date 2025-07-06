# /sc-fix Command

Systematic troubleshooting and error resolution that automatically investigates,
diagnoses, and fixes issues.

## Purpose

Consolidates debugging, error resolution, and troubleshooting into one
intelligent command that:

- Parses error messages and stack traces
- Investigates root causes systematically
- Applies appropriate fixes
- Verifies resolution
- Handles git conflicts and build issues

## Usage

```
/sc-fix [error or issue description]
```

## Natural Language Examples

### Error Resolution

- "fix TypeError in production logs"
- "fix undefined is not a function error"
- "fix module not found error"
- "fix connection refused on port 3000"
- "fix CORS error in API calls"

### Build & Deploy Issues

- "fix failing tests"
- "fix broken build"
- "fix deployment pipeline failure"
- "fix Docker container not starting"
- "fix CI/CD pipeline errors"

### Performance Problems

- "fix slow API response"
- "fix memory leak in production"
- "fix high CPU usage"
- "fix database query timeout"
- "fix slow page load times"

### Git & Version Control

- "fix merge conflicts"
- "fix detached HEAD state"
- "fix corrupted git repository"
- "fix failed rebase"
- "fix uncommitted changes blocking pull"

### Authentication & Security

- "fix authentication not working"
- "fix JWT token expiration issues"
- "fix CSRF token mismatch"
- "fix SSL certificate errors"
- "fix permission denied errors"

## Investigation Approach

The command follows a systematic debugging methodology:

### 1. Error Parsing

- Extract error messages and stack traces
- Identify error types and patterns
- Parse log files for context
- Collect environmental information

### 2. Root Cause Analysis

- Apply Five Whys methodology
- Trace execution flow
- Check recent changes
- Analyze dependencies

### 3. Fix Application

- Generate targeted solutions
- Apply fixes incrementally
- Test each change
- Document resolution

### 4. Verification

- Confirm error resolution
- Run relevant tests
- Check for side effects
- Prevent regression

## Smart Context Loading

Uses minimal @include directives for focused debugging:

```yaml
# Core debugging patterns
@include .claude/prompts/debug/error-patterns.md
@include .claude/prompts/debug/investigation-steps.md

# Specific issue types
@if syntax_error
  @include .claude/prompts/debug/syntax-fixes.md
@endif

@if build_error
  @include .claude/prompts/debug/build-troubleshooting.md
@endif

@if git_issue
  @include .claude/prompts/debug/git-recovery.md
@endif

@if performance_issue
  @include .claude/prompts/debug/performance-analysis.md
@endif
```

## Features

### 🔍 Automatic Detection

- Error pattern recognition
- Issue type classification
- Severity assessment
- Impact analysis

### 🎯 Targeted Investigation

- Focused file inspection
- Minimal context loading
- Efficient root cause finding
- Quick resolution paths

### 🛠️ Fix Strategies

- Incremental fixes
- Safe rollback options
- Alternative solutions
- Prevention measures

### ✅ Verification Methods

- Automated testing
- Manual verification steps
- Regression checks
- Performance validation

## Implementation Strategy

### Error Pattern Matching

```typescript
interface ErrorPattern {
  pattern: RegExp;
  type: "syntax" | "runtime" | "build" | "git" | "network" | "security";
  severity: "critical" | "high" | "medium" | "low";
  commonCauses: string[];
  quickFixes: string[];
}

const errorPatterns: ErrorPattern[] = [
  {
    pattern: /TypeError:.*undefined/i,
    type: "runtime",
    severity: "high",
    commonCauses: [
      "Missing null checks",
      "Async timing issues",
      "Incorrect property access",
    ],
    quickFixes: [
      "Add optional chaining",
      "Check variable initialization",
      "Verify async/await usage",
    ],
  },
  {
    pattern: /ECONNREFUSED/i,
    type: "network",
    severity: "critical",
    commonCauses: ["Service not running", "Wrong port", "Firewall blocking"],
    quickFixes: [
      "Check service status",
      "Verify port configuration",
      "Test connectivity",
    ],
  },
  // ... more patterns
];
```

### Investigation Workflow

```typescript
async function investigateIssue(description: string) {
  // 1. Parse and classify
  const errorType = classifyError(description);
  const patterns = findMatchingPatterns(description);

  // 2. Gather context
  const context = await gatherContext(errorType);

  // 3. Apply Five Whys
  const rootCause = await fiveWhysAnalysis(context);

  // 4. Generate fixes
  const solutions = generateSolutions(rootCause, patterns);

  // 5. Apply and verify
  for (const solution of solutions) {
    if (await applySolution(solution)) {
      return verifyFix(solution);
    }
  }
}
```

### Five Whys Implementation

```typescript
async function fiveWhysAnalysis(context: ErrorContext) {
  const whys = [];
  let currentWhy = context.initialProblem;

  for (let i = 0; i < 5; i++) {
    const answer = await investigateWhy(currentWhy);
    whys.push({ question: currentWhy, answer });

    if (isRootCause(answer)) {
      break;
    }

    currentWhy = `Why ${answer}?`;
  }

  return {
    rootCause: whys[whys.length - 1].answer,
    chain: whys,
  };
}
```

## Common Fix Patterns

### Syntax Errors

```bash
/sc-fix "SyntaxError: Unexpected token"
# → Locates syntax error
# → Shows context
# → Suggests correction
# → Applies fix
```

### Module Issues

```bash
/sc-fix "Cannot find module 'express'"
# → Checks package.json
# → Verifies node_modules
# → Runs npm install
# → Clears cache if needed
```

### Git Conflicts

```bash
/sc-fix "merge conflicts in 3 files"
# → Shows conflict markers
# → Analyzes both versions
# → Suggests resolution
# → Applies chosen strategy
```

### Build Failures

```bash
/sc-fix "build failing with webpack error"
# → Parses build output
# → Identifies root cause
# → Updates configuration
# → Reruns build
```

## Advanced Features

### Rollback Capability

- Track changes made during fix
- Create restore points
- Enable quick rollback
- Document rollback steps

### Pattern Learning

- Remember successful fixes
- Build knowledge base
- Suggest known solutions
- Improve over time

### Preventive Measures

- Suggest code improvements
- Add error handling
- Improve logging
- Create tests

## Integration Points

### With Other Commands

- `/sc-understand`: Analyze before fixing
- `/sc-test`: Verify fixes with tests
- `/sc-improve`: Apply preventive improvements
- `/sc-monitor`: Set up error tracking

### With Development Tools

- Git hooks for conflict prevention
- ESLint for syntax checking
- Test runners for verification
- Monitoring for production issues

## Prompt Structure

```markdown
@include .claude/prompts/base/minimal-context.md @include
.claude/prompts/debug/error-patterns.md

Given the error/issue: "[user description]"

1. Parse and classify the error
2. Gather minimal necessary context
3. Apply systematic investigation
4. Generate and apply fixes
5. Verify resolution

@if has_stacktrace @include .claude/prompts/debug/stacktrace-analysis.md @endif

@if has_logs @include .claude/prompts/debug/log-analysis.md @endif

@if git_issue @include .claude/prompts/debug/git-recovery.md @endif
```

## Success Metrics

- Quick error identification
- Accurate root cause finding
- Effective fix application
- Minimal context loading
- No regression introduction

## Examples

### Runtime Error Fix

```
User: /sc-fix "TypeError: Cannot read property 'name' of undefined"
Assistant:
*Parses error location*
*Checks variable initialization*
*Adds null check*
*Verifies fix works*
```

### Build Error Resolution

```
User: /sc-fix "Module build failed: SassError: Can't find stylesheet"
Assistant:
*Checks import paths*
*Verifies file existence*
*Corrects path reference*
*Rebuilds successfully*
```

### Performance Issue

```
User: /sc-fix "API endpoint taking 10+ seconds"
Assistant:
*Profiles endpoint*
*Identifies N+1 query*
*Implements eager loading*
*Reduces to <500ms*
```

## Notes

- Prioritizes understanding over quick fixes
- Always verifies fixes work
- Documents solutions for future reference
- Suggests preventive measures
- Learns from successful resolutions
