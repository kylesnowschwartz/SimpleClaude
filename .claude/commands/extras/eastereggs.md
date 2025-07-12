**Purpose**: Discover undocumented features, hidden flags, and clever implementations throughout the codebase

---

@include shared/simpleclaude/includes.md

## Command Execution

**If "$ARGUMENTS" is empty**: Display usage suggestions and stop.  
**If "$ARGUMENTS" has content**: Think step-by-step, then execute.

Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [auto-spawned sub-agents]

**Auto-Spawning:** Spawns specialized sub-agents for parallel task execution.

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

**Planner:** Sub-agents → Ingest README/docs → Map documented features → Identify search patterns → Plan discovery strategy  
**Implementer:** Sub-agents → Search codebase → Extract hidden features → Analyze implementations → Categorize findings  
**Tester:** Sub-agents → Validate discoveries → Test feature combinations → Document edge cases → Verify functionality
