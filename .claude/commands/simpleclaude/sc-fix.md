**Purpose**: Fix bugs, errors, and issues with intelligent debugging and error
resolution

---

@include ../shared/simpleclaude/core-patterns.yml#Core_Philosophy @include
../shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [issue/bug to fix]
- How: [fixing approach]
- When: [execution mode]

Systematically investigates issues, applies fixes, and ensures code stability
through various fixing strategies based on natural language patterns.

### Semantic Transformations

```
"fix the login bug" →
  What: authentication issue
  How: quick patch
  When: immediate
  Mode: fast

"carefully debug the memory leak" →
  What: memory leak
  How: systematic investigation
  When: thorough analysis
  Mode: debug

"walk me through fixing test failures" →
  What: test failures
  How: guided step-by-step
  When: interactive
  Mode: interactive

"safely patch the SQL injection" →
  What: SQL injection vulnerability
  How: careful with validation
  When: with rollback capability
  Mode: safe
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**Debug** (carefully, systematically, thoroughly)

- Systematic investigation using Five Whys
- Root cause analysis before fixing
- Comprehensive testing of edge cases
- Documentation of debugging process

**Interactive** (walk me through, guide me, help me understand)

- Step-by-step guided debugging
- Asks clarifying questions
- Explains each fix before applying
- Confirms understanding at each step

**Safe** (safely, carefully, with rollback)

- Creates backup before changes
- Validates fixes thoroughly
- Automatic rollback on failure
- Comprehensive test coverage

**Watch** (monitor, watch, keep fixing)

- Continuous monitoring for issues
- Pattern recognition for recurring problems
- Automated fix application
- Alert on critical issues

**Fast** (quickly, rapidly, just patch)

- Quick patches for urgent issues
- Minimal but effective fixes
- Focus on immediate resolution
- Basic validation only

**Verbose** (detailed, explain, with analysis)

- Detailed analysis and explanation
- Step-by-step debugging output
- Performance profiling
- Memory usage tracking

**Mode Blending**

```
"safely debug with detailed analysis" →
  Modes: [safe, debug, verbose]
  Result: Thorough investigation with backups and detailed output
```

@include ../shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/fix authentication error` - Quick fix for login issues
- `/fix carefully debug memory leak` - Systematic memory investigation
- `/fix walk me through test failures` - Interactive guided debugging

## Smart Detection & Routing

```yaml
Authentication: [login, auth, JWT, token, session]
  → Focuses on authentication flow and security

Performance: [slow, timeout, memory leak, bottleneck]
  → Analyzes performance metrics and optimizations

Testing: [test failure, flaky, unit test, integration]
  → Debugs test issues and improves coverage

Security: [vulnerability, injection, XSS, CSRF]
  → Patches security issues with validation

Database: [migration, deadlock, query, connection]
  → Resolves database-related issues
```

**Intelligent Context Detection:** Analyzes error patterns | Identifies root
causes automatically | Chooses optimal fix strategy | Evidence-based debugging |
Detects fix urgency from natural language

@include ../shared/simpleclaude/core-patterns.yml#Task_Management

@include ../shared/simpleclaude/workflows.yml#Debug_Workflow

@include ../shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Investigation:** Reproduce → Analyze → Identify Root Cause → Fix

**Validation:** Apply Fix → Test → Verify → Document

**Monitoring:** Watch → Detect → Fix → Learn Patterns

## Sub-Agent Delegation

```yaml
When: Complex multi-system issues requiring specialized knowledge
How: Spawns specialized debugging agents for specific domains
Examples:
  - Database deadlock: Database specialist agent
  - Memory leak: Performance analysis agent
  - Security vulnerability: Security audit agent
```

## Best Practices

- Describe the issue clearly with specific error messages
- Use appropriate mode language to guide fix approach
- Include context about when the issue occurs
- Always verify fixes work correctly
- Document complex fixes for future reference
