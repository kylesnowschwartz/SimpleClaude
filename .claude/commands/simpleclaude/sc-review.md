**Purpose**: Comprehensive code review and quality analysis with AI assistance

---

@include ../shared/simpleclaude/core-patterns.yml#Core_Philosophy

@include ../shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: Code/module/feature to review
- How: Review approach (security/performance/quality/architecture)
- When: One-time analysis or continuous monitoring

Reviews code quality, security, performance, and maintainability based on natural language cues. Automatically detects review focus from request context.

### Semantic Transformations

```
"strictly review the authentication module" →
  What: authentication module
  How: zero-tolerance quality check
  When: immediate comprehensive review
  Mode: strict

"check security vulnerabilities in the payment system" →
  What: payment system
  How: security vulnerability scan
  When: immediate focused review
  Mode: security

"monitor code quality as I make changes" →
  What: entire codebase
  How: quality tracking
  When: continuous monitoring
  Mode: watch
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**Strict Mode** (strictly, thoroughly, rigorously, zero tolerance)

- Zero tolerance for issues
- Comprehensive style checking
- Enforces all best practices
- Fails on any quality problems

**Security Mode** (security, vulnerabilities, safety, threats)

- OWASP Top 10 compliance
- Authentication/authorization review
- Input validation checking
- Dependency vulnerability scan

**Performance Mode** (performance, optimization, speed, efficiency)

- Algorithm complexity analysis
- Database query optimization
- Resource utilization review
- Caching opportunities

**Interactive Mode** (walk me through, explain, teach me, guide)

- Step-by-step explanations
- Educational context
- Learning-focused feedback
- Code improvement suggestions

**Watch Mode** (monitor, watch, continuously, as I code)

- Continuous quality monitoring
- Real-time feedback
- Incremental reviews
- Trend tracking

**Architecture Mode** (architecture, design, structure, patterns)

- Design pattern analysis
- SOLID principles check
- Scalability evaluation
- Maintainability scoring

**Mode Blending**

```
"strictly review security in the API endpoints" →
  Modes: strict, security
  Result: Zero-tolerance security audit with comprehensive vulnerability scanning
```

@include ../shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc review authentication module` - General quality review
- `/sc review strictly enforce standards in core` - Zero-tolerance review
- `/sc review check for security vulnerabilities` - Security-focused scan
- `/sc review walk me through the issues` - Educational interactive review

## Smart Detection & Routing

```yaml
Security: security, vulnerabilities, threats, OWASP, authentication → Focus on vulnerability detection and security best practices

Performance: performance, optimization, speed, bottlenecks, efficiency → Analyze algorithms, queries, and resource utilization

Architecture: architecture, design, patterns, structure, SOLID → Review design decisions and structural integrity

Quality: quality, standards, best practices, clean code, maintainability → General code quality and maintainability assessment
```

**Intelligent Context Detection:** Analyzes review request | Identifies focus areas automatically | Chooses optimal review approach | Evidence-based feedback | Detects multiple concerns from natural language

@include ../shared/simpleclaude/core-patterns.yml#Task_Management

@include ../shared/simpleclaude/workflows.yml#Code_Review

@include ../shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Security Review:** Scan code → Identify vulnerabilities → Check dependencies → Generate report

**Performance Review:** Profile code → Find bottlenecks → Suggest optimizations → Measure impact

**Quality Review:** Check standards → Find code smells → Suggest improvements → Track metrics

## Sub-Agent Delegation

```yaml
When: Complex multi-aspect reviews or specialized analysis needed
How: Spawns specialized review agents for focused analysis
Examples:
  - Security specialist for vulnerability scanning
  - Performance analyst for optimization opportunities
  - Architecture reviewer for design patterns
```

## Best Practices

- Be specific about review focus for targeted analysis
- Use natural language to guide review approach
- Include context about code purpose and requirements
- Act on feedback before issues accumulate
- Integrate reviews into regular workflow
