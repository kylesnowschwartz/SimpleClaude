**Purpose**: Understand codebases through intelligent analysis, explanation, and documentation

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze codebase structure and understanding requirements")`  
**Research & Investigation**: `Task("research-analyst", "investigate patterns, libraries, and implementation approaches")`  
**Knowledge Synthesis**: `Task("documentation-specialist", "synthesize findings into clear explanations and documentation")`  
**Understanding Validation**: `Task("knowledge-validator", "confirm understanding accuracy and identify gaps")`

**Supporting Specialists**:

- `Task("pattern-analyst", "identify and explain architectural patterns and design decisions")`
- `Task("flow-tracer", "map execution flows and data transformations for comprehension")`
- `Task("concept-explainer", "break down complex concepts into understandable components")`

**Execution Strategy**: For complex understanding tasks, spawn agents in sequence: Context → Research → Synthesis → Validation, with parallel specialists for deep analysis.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

Intelligent analysis router that transforms natural language into structured understanding approaches for code explanation, architecture visualization, and knowledge extraction.

### Semantic Transformations

```
"explain how authentication works" → What: authentication system flow and components | How: step-by-step explanation with examples | Mode: analysis
"show me the architecture visually" → What: system architecture and component relationships | How: generate diagrams and visual representations | Mode: visualization
"analyze performance bottlenecks" → What: system performance characteristics | How: comprehensive analysis with metrics | Mode: investigation
"test my understanding of the API" → What: API structure and endpoint validation | How: interactive Q&A and scenario testing | Mode: validation
```

Examples:

- `/sc-understand authentication flow` - Step-by-step auth explanation with diagrams
- `/sc-understand architecture patterns` - Visual system design analysis
- `/sc-understand performance metrics` - Comprehensive performance breakdown
- `/sc-understand API testing scenarios` - Interactive API exploration and validation

**Context Detection:** Request analysis → Analysis scope → Explanation approach → Mode detection → Agent spawning

## Core Workflows

**Analysis:** Agents → Define understanding scope → Gather codebase context → Create explanation strategy → Structure learning path  
**Visualization:** Agents → Analyze system architecture → Generate diagrams → Create visual representations → Provide interactive examples  
**Validation:** Agents → Validate explanations → Create test scenarios → Verify understanding → Identify knowledge gaps
