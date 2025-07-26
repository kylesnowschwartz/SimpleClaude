**Purpose**: [Command purpose - single clear statement]

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze project structure and requirements")`  
**Strategic Planning**: `Task("system-architect", "create implementation plan based on analysis")`  
**Implementation**: `Task("implementation-specialist", "implement solution following plan")`  
**Quality Validation**: `Task("validation-review-specialist", "verify implementation meets requirements")`

**Supporting Specialists**:

- `Task("research-analyst", "investigate and analyze without code implementation")`
- `Task("debugging-specialist", "systematic root cause analysis and troubleshooting")`
- `Task("documentation-specialist", "create documentation and knowledge synthesis")`

**Execution Strategy**: For complex tasks, spawn multiple agents simultaneously for independent work streams.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

### Semantic Transformations

[Main command description - explains how natural language is transformed into structured actions]

```
"[natural language example]" → What: [target] | How: [approach] | Mode: [execution-mode]
"[another example]" → What: [target] | How: [approach] | Mode: [execution-mode]
```

Examples:

- `/[command] [natural language]` - [What it does]
- `/[command] [different natural language]` - [Different behavior]

**Context Detection:** Request analysis → Scope identification → Approach selection → Mode detection → Agent spawning

## Core Workflows

**[Workflow 1]:** Agents → [Step 1] → [Step 2] → [Step 3] → Synthesis  
**[Workflow 2]:** Agents → [Step 1] → [Step 2] → [Step 3] → Synthesis  
**[Workflow 3]:** Agents → [Step 1] → [Step 2] → [Step 3] → Synthesis
