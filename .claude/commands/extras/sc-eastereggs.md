**Purpose**: Discover undocumented features, hidden flags, and clever implementations throughout the codebase

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze project structure and identify discovery targets")`  
**Strategic Planning**: `Task("system-architect", "create systematic discovery plan and search patterns")`  
**Implementation**: `Task("implementation-specialist", "execute feature discovery and extract hidden functionality")`  
**Quality Validation**: `Task("validation-review-specialist", "verify discovered features and document findings")`

**Supporting Specialists**:

- `Task("research-analyst", "investigate codebase patterns and documentation gaps")`
- `Task("debugging-specialist", "trace hidden code paths and debug flags")`
- `Task("documentation-specialist", "organize and categorize discovered features")`

**Execution Strategy**: For complex discovery tasks, spawn multiple agents simultaneously for independent search streams.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

Intelligent discovery router that transforms natural language queries into systematic searches for hidden features, undocumented capabilities, and clever implementations that aren't explicitly documented.

### Semantic Transformations

```
"find all hidden features" →
  What: comprehensive scan for undocumented functionality
  How: systematic code search with pattern matching
  Mode: implementer

"show me config easter eggs" →
  What: configuration options and environment variables
  How: deep dive into config files and settings
  Mode: planner

"discover CLI magic commands" →
  What: undocumented command-line features and shortcuts
  How: analyze command parsers and argument handlers
  Mode: implementer

"test for hidden debug modes" →
  What: debug flags and development-only features
  How: trace conditional logic and feature flags
  Mode: tester
```

Examples:

- `/eastereggs` - Full scan for all undocumented features across the codebase
- `/eastereggs config tricks` - Discover hidden configuration options and env vars
- `/eastereggs CLI shortcuts` - Find undocumented command combinations and flags
- `/eastereggs debug modes` - Uncover development and debugging features

**Context Detection:** Documentation scan → Code analysis → Pattern recognition → Feature extraction → Category organization

## Core Workflows

**Planner:** Agents → Ingest README/docs → Map documented features → Identify search patterns → Plan discovery strategy  
**Implementer:** Agents → Search codebase → Extract hidden features → Analyze implementations → Categorize findings  
**Tester:** Agents → Validate discoveries → Test feature combinations → Document edge cases → Verify functionality
