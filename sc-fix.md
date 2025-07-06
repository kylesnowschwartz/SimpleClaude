# sc-fix - Fix Code Issues

> Fix bugs, errors, and issues with AI assistance

Version: 0.3.0

@include ./mode-detection.yml

---

## Purpose

`sc-fix` provides intelligent debugging and error resolution for your codebase.
It systematically investigates issues, applies fixes, and ensures code stability
through various fixing strategies.

## Usage

```bash
sc fix [options] <issue-description>
```

### Examples

```bash
# Debug mode - systematic investigation
sc fix "carefully debug the authentication error in login flow"

# Interactive mode - guided debugging
sc fix "walk me through fixing the test failures in user service"

# Safe mode - careful fixes with rollback
sc fix "safely fix the database migration issue"

# Watch mode - monitor recurring issues
sc fix "monitor the API timeout issues and apply fixes"

# Fast mode - quick patches
sc fix "quickly patch the security vulnerability in auth middleware"

# Verbose mode - detailed debugging
sc fix "debug the memory leak with detailed analysis"
```

## Mode Detection & Adaptation

The command automatically detects the appropriate fixing mode based on your
natural language:

- **Debug mode**: Triggered by "carefully", "systematically", "thoroughly"
- **Interactive mode**: Triggered by "walk me through", "guide me", "help me
  understand"
- **Safe mode**: Triggered by "safely", "carefully", "with rollback"
- **Watch mode**: Triggered by "monitor", "watch", "keep fixing"
- **Fast mode**: Triggered by "quickly", "rapidly", "just patch"
- **Verbose mode**: Triggered by "detailed", "explain", "with analysis"

## Core Capabilities

- **Bug Investigation**: Systematic root cause analysis
- **Error Resolution**: Smart fixes with context understanding
- **Code Stability**: Ensures fixes don't introduce new issues
- **Performance Issues**: Identifies and resolves bottlenecks
- **Test Failures**: Fixes failing tests and improves coverage
- **Security Vulnerabilities**: Patches security issues safely

## Semantic Transformations

| User Says                              | Inferred Task                   | Mode        |
| -------------------------------------- | ------------------------------- | ----------- |
| "fix the login bug"                    | Debug authentication issue      | Fast        |
| "carefully debug the memory leak"      | Systematic memory investigation | Debug       |
| "walk me through fixing test failures" | Interactive test debugging      | Interactive |
| "monitor API errors and fix them"      | Continuous error monitoring     | Watch       |
| "safely patch the SQL injection"       | Security fix with validation    | Safe        |
| "explain why the app crashes"          | Detailed crash analysis         | Verbose     |

## Options

- `--dry-run`: Preview fixes without applying
- `--test`: Run tests after fixes
- `--commit`: Auto-commit successful fixes
- `--rollback`: Enable automatic rollback on failure

## Mode Behaviors

### Debug Mode

- Systematic investigation using Five Whys
- Root cause analysis before fixing
- Comprehensive testing of edge cases
- Documentation of debugging process

### Interactive Mode

- Step-by-step guided debugging
- Asks clarifying questions
- Explains each fix before applying
- Confirms understanding at each step

### Safe Mode

- Creates backup before changes
- Validates fixes thoroughly
- Automatic rollback on failure
- Comprehensive test coverage

### Watch Mode

- Continuous monitoring for issues
- Pattern recognition for recurring problems
- Automated fix application
- Alert on critical issues

### Fast Mode

- Quick patches for urgent issues
- Minimal but effective fixes
- Focus on immediate resolution
- Basic validation only

### Verbose Mode

- Detailed analysis and explanation
- Step-by-step debugging output
- Performance profiling
- Memory usage tracking

## Best Practices

1. **Describe the Issue Clearly**: Provide specific error messages or symptoms
2. **Use Appropriate Mode Language**: Let natural language guide the fix
   approach
3. **Include Context**: Mention when the issue occurs
4. **Test After Fixes**: Always verify fixes work correctly
5. **Document Complex Fixes**: Keep notes on tricky resolutions

## Integration

Works seamlessly with other sc commands:

- Use after `sc test` to fix failures
- Combine with `sc review` for fix validation
- Follow with `sc commit` to save fixes
- Use `sc monitor` to track fix effectiveness

## Examples by Category

### Authentication Issues

```bash
sc fix "users can't log in after password reset"
sc fix "carefully debug the JWT token validation error"
```

### Performance Problems

```bash
sc fix "the API response is taking too long"
sc fix "investigate memory leak in background jobs"
```

### Test Failures

```bash
sc fix "unit tests failing after dependency update"
sc fix "walk me through fixing flaky integration tests"
```

### Security Vulnerabilities

```bash
sc fix "safely patch the XSS vulnerability in comments"
sc fix "fix SQL injection in search functionality"
```

### Database Issues

```bash
sc fix "migration failing on production database"
sc fix "carefully fix the deadlock in concurrent updates"
```

## Output

The command provides:

- Issue diagnosis and root cause
- Applied fixes with explanations
- Test results after fixes
- Rollback instructions if needed
- Performance impact analysis
- Security implications
