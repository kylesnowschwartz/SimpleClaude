**Purpose**: Smart quality assurance router for comprehensive code review

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Performs multi-dimensional quality review by transforming review requests into
structured quality assurance directives.

### Semantic Transformations

```
"security" →
  What: security vulnerabilities and risks
  How: OWASP scanning, dependency audit, auth review
  When: immediate with critical-first prioritization

"code quality --magic" →
  What: code architecture and maintainability
  How: complexity analysis, pattern detection, visual reports
  When: immediate with dashboard generation

"test coverage" →
  What: test completeness and quality
  How: coverage metrics, edge case analysis, assertion quality
  When: immediate with actionable gaps

"performance --c7" →
  What: performance bottlenecks and optimization
  How: profiling, Context7 best practices, caching analysis
  When: immediate with documentation integration
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-review` - Comprehensive review of recent changes
- `/sc-review security` - Focus on security vulnerabilities
- `/sc-review code quality --magic` - Code review with visual reports
- `/sc-review test coverage` - Analyze test completeness
- `/sc-review performance --c7` - Performance audit with best practices

## Smart Detection & Routing

```yaml
Code Quality: [code, quality, architecture, patterns, maintainability]
  → Architecture analysis, complexity metrics, pattern detection, tech debt

Security: [security, vulnerabilities, audit, OWASP, compliance]
  → Vulnerability scanning, dependency audit, auth review, data protection

Testing: [test, coverage, unit tests, integration, edge cases]
  → Coverage analysis, test quality, missing scenarios, assertions

Performance: [performance, speed, optimization, bottlenecks, scalability]
  → Profiling, query analysis, caching opportunities, resource usage

General: [review, check, validate, analyze]
  → Multi-dimensional review covering all aspects with smart prioritization
```

**Intelligent Prioritization:** Recent changes focus | Risk-based ordering |
Critical issues first | Actionable insights

**--watch:** Continuous quality monitoring | Real-time feedback | Trend tracking
**--interactive:** Guided review process | Explain findings | Fix suggestions
**--strict:** Fail on critical issues | Enforce standards | Block merges

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Review_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Discovery:** Analyze changes → Identify focus areas → Load patterns →
Prioritize checks

**Analysis:** Deploy specialized agents → Gather findings → Score quality →
Identify issues

**Synthesis:** Consolidate results → Prioritize by severity → Generate report →
Create tasks

**Action:** Document findings → Suggest fixes → Track metrics → Follow up

## Sub-Agent Delegation

```yaml
When: Multi-aspect review | Large changeset | Parallel analysis needed
How: Review coordinator → Specialized analyzers → Result aggregation
Examples:
  - Full review: Code + Security + Test + Performance agents
  - PR review: Change analyzer → Focused review agents
  - Audit mode: Deep analysis with multiple passes
```

## Review Standards

1. Evidence-based findings only
2. Prioritize by actual impact
3. Provide actionable solutions
4. Track improvement over time
5. Celebrate quality wins

## Best Practices

- Review early and often
- Focus on recent changes
- Automate in CI/CD pipeline
- Learn from patterns
- Continuously improve standards
