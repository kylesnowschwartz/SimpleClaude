# /sc-review - Comprehensive Quality Assurance

Unified quality assurance command that consolidates code review, security
scanning, and test validation into a single comprehensive interface.

## Core Functionality

### Review Types

- **Code Review**: Architecture, patterns, maintainability
- **Security Scan**: Vulnerabilities, best practices, compliance
- **Test Analysis**: Coverage, quality, edge cases
- **Performance Review**: Bottlenecks, optimization opportunities
- **Quality Check**: Standards compliance, documentation

### Intelligent Detection

- Auto-detects review priorities based on:
  - Recent changes (git diff analysis)
  - File types and patterns
  - Project configuration
  - Previous issues found

## Usage Patterns

### Basic Review

```
/sc-review
```

Performs comprehensive review of recent changes

### Targeted Reviews

```
/sc-review security
/sc-review performance src/api/
/sc-review tests --coverage
/sc-review code --focus=architecture
```

### Natural Language

- "review recent changes"
- "check security vulnerabilities"
- "analyze test coverage"
- "scan for performance issues"
- "validate best practices"
- "review code quality"

## Review Workflow

### 1. Discovery Phase

@include review-discovery {

- Analyze git history
- Identify changed files
- Detect review priorities
- Load relevant patterns }

### 2. Parallel Analysis

Spawns specialized sub-agents:

**Code Quality Agent** @include code-review-workflow {

- Architecture analysis
- Pattern detection
- Maintainability scoring
- Complexity metrics }

**Security Agent** @include security-scan-patterns when: security {

- Vulnerability scanning
- Dependency audit
- Configuration review
- Compliance checks }

**Test Agent** @include tester-mode-sections {

- Coverage analysis
- Test quality review
- Edge case detection
- Integration validation }

**Performance Agent** @include performance-analysis when: performance {

- Bottleneck detection
- Resource usage
- Optimization opportunities
- Scalability concerns }

### 3. Synthesis Phase

@include quality-validation-patterns {

- Consolidate findings
- Prioritize issues
- Generate recommendations
- Create action items }

## Output Format

### Executive Summary

```markdown
## Quality Review Summary

- **Overall Score**: 8.5/10
- **Critical Issues**: 2
- **Warnings**: 5
- **Suggestions**: 12

### Priority Actions

1. Fix SQL injection vulnerability in UserController
2. Add input validation to API endpoints
3. Increase test coverage for payment module
```

### Detailed Findings

```markdown
## Code Quality

- ✅ Clean architecture patterns
- ⚠️ Complex methods need refactoring
- 💡 Consider extracting service layer

## Security

- 🚨 SQL injection risk in search endpoint
- ⚠️ Missing rate limiting
- ✅ Proper authentication implementation

## Test Coverage

- Current: 67%
- Target: 80%
- Critical gaps: Payment processing, User authentication
```

## Integration Features

### CI/CD Integration

```yaml
# .github/workflows/review.yml
- name: SimpleClaude Review
  run: |
    sc-review --format=github
    sc-review --fail-on=critical
```

### Progress Tracking

Uses TodoWrite for actionable items:

```javascript
{
  id: "security-fix-sql",
  content: "Fix SQL injection in UserController.search()",
  priority: "critical",
  type: "security",
  effort: "30min"
}
```

### Memory Integration

Stores review history:

- Previous issues
- Resolution patterns
- Improvement trends
- Team preferences

## Advanced Options

### Custom Rules

```yaml
# .claude/review-rules.yml
code:
  max-complexity: 10
  max-file-length: 300
  required-docs: public-methods

security:
  check-dependencies: true
  scan-secrets: true

tests:
  min-coverage: 80
  require-edge-cases: true
```

### Focused Reviews

```bash
# Review only changed files
/sc-review --changes-only

# Review specific patterns
/sc-review --pattern="*.ts" --focus=typescript

# Security-first review
/sc-review --security-priority

# Pre-commit review
/sc-review --pre-commit
```

## Best Practices

### Regular Reviews

- Run on every PR
- Weekly security scans
- Monthly architecture reviews
- Quarterly dependency audits

### Team Integration

- Share findings in standup
- Create tickets for critical issues
- Track improvement metrics
- Celebrate quality wins

### Continuous Improvement

- Refine review rules based on findings
- Update patterns for new technologies
- Learn from false positives
- Evolve with codebase

## Example Scenarios

### Pre-Release Review

```
/sc-review --comprehensive --pre-release
```

Full system review before deployment

### Quick PR Check

```
/sc-review --quick --pr
```

Fast review for pull requests

### Security Audit

```
/sc-review --security --deep
```

Thorough security analysis

### Performance Optimization

```
/sc-review --performance --profile
```

Identify optimization opportunities

## Success Metrics

Track improvement over time:

- Code quality scores
- Security vulnerability count
- Test coverage percentage
- Performance benchmarks
- Technical debt reduction

The `/sc-review` command transforms quality assurance from a chore into a
collaborative, intelligent process that helps teams ship better code with
confidence.
