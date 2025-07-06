**Purpose**: Understand codebases through intelligent analysis and explanation

---

@include ../shared/simpleclaude/core-patterns.yml#Core_Philosophy

@include ../shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [analysis-target]
- How: [explanation-approach]
- When: [analysis-mode]

`sc-understand` provides intelligent code analysis and explanation by detecting intent from natural language. It adapts between educational explanations, visual representations, deep analysis, interactive exploration, or documentation lookup based on your request.

### Semantic Transformations

```
"explain how authentication works in detail" →
  What: authentication system
  How: detailed explanation with examples
  When: educational mode
  Mode: [educational]

"show me the architecture visually" →
  What: system architecture
  How: generate diagrams and visual representations
  When: visual mode
  Mode: [visual]

"deep dive into the caching strategy" →
  What: caching implementation
  How: comprehensive analysis with patterns
  When: deep analysis mode
  Mode: [deep]

"walk me through the API structure" →
  What: API endpoints and structure
  How: guided Q&A exploration
  When: interactive mode
  Mode: [interactive]

"look up React hooks documentation" →
  What: React hooks reference
  How: retrieve documentation
  When: documentation mode
  Mode: [c7]
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**Educational** (explain, teach me, in detail, how does)

- Step-by-step explanations with examples
- Analogies and real-world comparisons
- Code snippets with detailed comments
- Best practices and common pitfalls

**Visual** (show, visualize, diagram, visually)

- Architecture diagrams and flowcharts
- Component relationship visualizations
- Data flow representations
- Interactive graph outputs when possible

**Deep** (deep dive, comprehensive, thoroughly analyze)

- Comprehensive codebase analysis
- Design pattern identification
- Performance characteristics and implications
- Technical debt assessment

**Interactive** (walk me through, guide me, explore together)

- Guided Q&A exploration
- Progressive disclosure of information
- Interactive code walkthroughs
- Hands-on learning approach

**C7** (look up, documentation for, reference)

- Quick documentation retrieval
- API reference lookup
- Framework-specific guidance
- Version-specific information

**Analysis** (analyze, assess, evaluate, understand)

- Codebase metrics and statistics
- Complexity analysis
- Dependency mapping
- Quality assessments

**Mode Blending**

```
"explain the auth system visually with performance insights" →
  Modes: [educational, visual, analysis]
  Result: Diagrams with detailed explanations and performance metrics
```

@include ../shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/understand explain how authentication works` - Step-by-step auth flow explanation
- `/understand show me the architecture` - Visual architecture diagrams
- `/understand deep analysis of data pipeline` - Comprehensive pipeline evaluation
- `/understand walk me through the API` - Interactive API exploration
- `/understand React hooks documentation` - Quick hook reference lookup

## Smart Detection & Routing

```yaml
Architecture: [architecture, structure, design, components]
  → Visual diagrams with component relationships

Performance: [performance, bottleneck, slow, optimize]
  → Analysis with metrics and recommendations

Learning: [explain, teach, understand, how]
  → Educational content with examples

Documentation: [docs, reference, lookup, api]
  → Quick documentation retrieval

Analysis: [analyze, evaluate, assess, metrics]
  → Comprehensive codebase evaluation
```

**Intelligent Context Detection:** Analyzes request intent | Identifies analysis scope | Chooses optimal explanation approach | Evidence-based understanding | Detects modes from natural language patterns

@include ../shared/simpleclaude/core-patterns.yml#Task_Management

@include ../shared/simpleclaude/workflows.yml#Analysis_Workflow

@include ../shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Educational:** Question Analysis → Context Gathering → Explanation Generation → Example Creation → Learning Resources

**Visual:** Architecture Scan → Relationship Mapping → Diagram Generation → Annotation → Interactive Output

**Deep Analysis:** Codebase Scan → Pattern Recognition → Metric Collection → Insight Generation → Recommendations

**Interactive:** Initial Question → Context Building → Guided Exploration → Q&A Loop → Summary

## Sub-Agent Delegation

```yaml
When: Complex multi-faceted analysis requests
How: Parallel analysis with specialized agents
Examples:
  - "Full system analysis": Architecture + Performance + Security agents
  - "Learning path": Educational + Interactive + Documentation agents
```

## Best Practices

- Be specific about what you want to understand
- Use natural language to guide mode selection
- Start broad, then narrow focus based on results
- Combine modes for comprehensive understanding
- Export important findings for future reference
