**Purpose**: Understand codebases through intelligent analysis, explanation, and documentation

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze codebase structure and understanding requirements")`  
**Strategic Planning**: `Task("system-architect", "create analysis plan based on codebase complexity")`  
**Implementation**: `Task("research-analyst", "investigate and analyze code without implementation")`  
**Quality Validation**: `Task("documentation-specialist", "create explanations and knowledge synthesis")`

**Supporting Specialists**:

- `Task("research-analyst", "investigate and analyze code patterns and architecture")`
- `Task("debugging-specialist", "analyze code flow and potential issues for understanding")`
- `Task("documentation-specialist", "create comprehensive explanations and documentation")`

**Execution Strategy**: For complex analysis tasks, spawn multiple agents simultaneously for independent analysis streams.

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
