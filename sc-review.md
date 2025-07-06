# sc-review - Review Code Quality

> Comprehensive code review and quality analysis with AI assistance

Version: 0.3.0

@include ./mode-detection.yml

---

## Purpose

`sc-review` provides intelligent code review capabilities that analyze your
codebase for quality, security, performance, and maintainability issues. It
adapts its review approach based on natural language cues to provide the most
relevant feedback.

## Usage

```bash
sc review [options] <review-request>
```

### Examples

```bash
# Strict mode - zero tolerance quality check
sc review "strictly review the authentication module"

# Security mode - vulnerability focus
sc review "check security vulnerabilities in the payment system"

# Performance mode - optimization opportunities
sc review "analyze performance bottlenecks in the API"

# Interactive mode - educational review
sc review "walk me through the code quality issues"

# Watch mode - continuous monitoring
sc review "monitor code quality as I make changes"

# Architecture mode - design patterns and structure
sc review "review the architectural decisions in the service layer"
```

## Mode Detection & Adaptation

The command automatically detects the appropriate review mode based on your
natural language:

- **Strict mode**: Triggered by "strictly", "thoroughly", "rigorously", "zero
  tolerance"
- **Security mode**: Triggered by "security", "vulnerabilities", "safety",
  "threats"
- **Performance mode**: Triggered by "performance", "optimization", "speed",
  "efficiency"
- **Interactive mode**: Triggered by "walk me through", "explain", "teach me",
  "guide"
- **Watch mode**: Triggered by "monitor", "watch", "continuously", "as I code"
- **Architecture mode**: Triggered by "architecture", "design", "structure",
  "patterns"

## Core Capabilities

- **Code Quality Analysis**: Identifies code smells and anti-patterns
- **Security Scanning**: Detects vulnerabilities and security risks
- **Performance Review**: Finds optimization opportunities
- **Best Practices Check**: Ensures adherence to standards
- **Dependency Analysis**: Reviews third-party dependencies
- **Test Coverage**: Evaluates testing completeness
- **Documentation**: Checks code documentation quality

## Semantic Transformations

| User Says                         | Inferred Task                   | Mode         |
| --------------------------------- | ------------------------------- | ------------ |
| "review my code"                  | General quality review          | Standard     |
| "strictly review the auth module" | Zero-tolerance auth review      | Strict       |
| "check for security issues"       | Security vulnerability scan     | Security     |
| "find performance problems"       | Performance bottleneck analysis | Performance  |
| "explain the code issues to me"   | Educational code review         | Interactive  |
| "review architecture patterns"    | Design and structure analysis   | Architecture |

## Options

- `--files <pattern>`: Specific files to review
- `--depth <level>`: Review depth (quick/standard/deep)
- `--report`: Generate detailed report
- `--fix`: Suggest automatic fixes

## Mode Behaviors

### Strict Mode

- Zero tolerance for issues
- Fails on any quality problems
- Comprehensive style checking
- Enforces all best practices
- No compromises on standards

### Security Mode

- Focus on vulnerability detection
- OWASP Top 10 compliance
- Authentication/authorization review
- Input validation checking
- Cryptography assessment
- Dependency vulnerability scan

### Performance Mode

- Algorithm complexity analysis
- Database query optimization
- Memory usage patterns
- Caching opportunities
- Async/concurrent improvements
- Resource utilization review

### Interactive Mode

- Step-by-step explanations
- Educational context for issues
- Questions about intent
- Learning-focused feedback
- Code improvement suggestions

### Watch Mode

- Continuous quality monitoring
- Real-time feedback on changes
- Incremental reviews
- Trend tracking
- Quality metrics over time

### Architecture Mode

- Design pattern analysis
- Dependency structure review
- Module coupling assessment
- SOLID principles check
- Scalability evaluation
- Maintainability scoring

## Best Practices

1. **Be Specific About Focus**: Mention particular concerns for targeted review
2. **Use Natural Language**: Let your description guide the review approach
3. **Include Context**: Explain the purpose of the code being reviewed
4. **Act on Feedback**: Address issues before they accumulate
5. **Regular Reviews**: Integrate reviews into your workflow

## Integration

Works seamlessly with other sc commands:

- Use before `sc commit` to ensure quality
- Follow with `sc fix` to address issues
- Combine with `sc test` for comprehensive validation
- Use after `sc modify` to verify improvements

## Examples by Category

### Security Reviews

```bash
sc review "check authentication endpoints for vulnerabilities"
sc review "strictly review security in the payment processing"
```

### Performance Reviews

```bash
sc review "analyze database query performance"
sc review "find optimization opportunities in the data pipeline"
```

### Code Quality Reviews

```bash
sc review "review code quality in the user service"
sc review "strictly enforce coding standards in core modules"
```

### Architecture Reviews

```bash
sc review "evaluate the microservices architecture"
sc review "review design patterns in the domain layer"
```

### Interactive Learning

```bash
sc review "walk me through the issues in my React components"
sc review "explain the anti-patterns you find"
```

## Output

The command provides:

- Issue severity classification
- Specific line-by-line feedback
- Improvement suggestions
- Code examples for fixes
- Quality metrics summary
- Trend analysis (in watch mode)
- Security vulnerability report
- Performance recommendations
