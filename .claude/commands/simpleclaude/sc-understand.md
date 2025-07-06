**Purpose**: Smart learning router for code understanding and analysis

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Provides intelligent code analysis, explanations, and understanding by
transforming natural language queries into structured analytical directives.

### Semantic Transformations

```
"how authentication works" →
  What: authentication system flow and components
  How: trace execution paths, explain with examples
  When: immediate educational mode

"architecture" →
  What: system design, component relationships
  How: map structure, generate diagrams, identify patterns
  When: immediate with visual output

"estimate OAuth integration" →
  What: OAuth implementation effort and complexity
  How: analyze scope, dependencies, risks, timeline
  When: immediate estimation mode

"security risks --c7" →
  What: potential vulnerabilities and threats
  How: OWASP analysis, Context7 best practices
  When: immediate with documentation lookup
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-understand how authentication works` - Explain auth flow
- `/sc-understand architecture` - System design overview
- `/sc-understand this function --magic` - Visual explanation with diagrams
- `/sc-understand estimate OAuth integration` - Effort estimation
- `/sc-understand security risks --c7` - Security analysis with docs

## Smart Detection & Routing

```yaml
Explain/Teach: [explain, how does, what is, teach me, show me, walkthrough]
  → Educational mode: examples, visualizations, step-by-step guidance

Analyze: [analyze, review, assess, evaluate, find issues, bottlenecks]
  → Deep analysis: patterns, performance, security, quality metrics

Architecture: [architecture, design, structure, components, system, flow]
  → System overview: diagrams, relationships, patterns, boundaries

Estimate: [estimate, how long, effort, complexity, time needed]
  → Effort analysis: scope, dependencies, risks, timeline

Load/Index: [understand codebase, learn project, explore files]
  → Progressive loading: smart context, parallel agents, caching
```

**Intelligent Depth Detection:** Quick overview (2min) | Standard analysis
(10min) | Deep dive (30min) | Comprehensive (30min+)

**--watch:** Monitor code changes | Update understanding | Track evolution
**--interactive:** Guided exploration | Q&A mode | Progressive learning
**--visual:** Generate diagrams | Flowcharts | Architecture visualizations

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Understand_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Learning:** Parse query → Detect expertise → Load context → Explain clearly →
Provide examples

**Analysis:** Identify scope → Deploy analyzers → Gather metrics → Synthesize
findings

**Architecture:** Map components → Trace relationships → Identify patterns →
Generate visuals

**Estimation:** Analyze complexity → Identify dependencies → Assess risks →
Calculate effort

## Sub-Agent Delegation

```yaml
When: Large codebases | Multi-aspect analysis | Parallel exploration
How: Query router → Specialized analyzers → Result synthesis
Examples:
  - Full codebase: Multiple file analyzers in parallel
  - Security audit: Dedicated security analysis agent
  - Performance review: Profiling and metrics agents
```

## Educational Adaptation

1. Auto-detects user expertise level
2. Adjusts explanation depth accordingly
3. Provides relevant examples
4. Includes helpful visualizations
5. Suggests learning paths

## Best Practices

- Start with minimal context
- Load progressively as needed
- Cache analysis results
- Provide actionable insights
- Suggest next steps
