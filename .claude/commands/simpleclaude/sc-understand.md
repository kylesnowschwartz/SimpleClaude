**Purpose**: Understand codebases through intelligent analysis, explanation, and documentation

---

@include shared/simpleclaude/includes.yml

## Command Execution

**If "$ARGUMENTS" is empty**: Display usage suggestions and stop.  
**If "$ARGUMENTS" has content**: Think step-by-step, then execute.

Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [auto-spawned sub-agents]

**Auto-Spawning:** Spawns specialized sub-agents for parallel task execution.

Intelligent analysis router that transforms natural language into structured understanding approaches for code explanation, architecture visualization, and knowledge extraction.

### Semantic Transformations

```
"explain how authentication works" →
  What: authentication system flow and components
  How: step-by-step explanation with examples
  Mode: planner

"show me the architecture visually" →
  What: system architecture and component relationships
  How: generate diagrams and visual representations
  Mode: implementer

"analyze performance bottlenecks" →
  What: system performance characteristics
  How: comprehensive analysis with metrics
  Mode: implementer

"test my understanding of the API" →
  What: API structure and endpoint validation
  How: interactive Q&A and scenario testing
  Mode: tester
```

Examples:

- `/sc-understand authentication flow` - Step-by-step auth explanation with diagrams
- `/sc-understand architecture patterns` - Visual system design analysis
- `/sc-understand performance metrics` - Comprehensive performance breakdown
- `/sc-understand API testing scenarios` - Interactive API exploration and validation

**Context Detection:** Request analysis → Analysis scope → Explanation approach → Mode detection → Sub-agent spawning

## Core Workflows

**Planner:** Sub-agents → Define analysis scope → Gather context → Create explanation strategy → Structure learning path **Implementer:** Sub-agents → Analyze codebase → Generate explanations → Create visualizations → Provide examples **Tester:** Sub-agents → Validate understanding → Create scenarios → Test knowledge → Identify gaps
