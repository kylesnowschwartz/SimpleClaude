**Purpose**: Intelligently modify, improve, refactor, and optimize code with safety controls

---

@include shared/simpleclaude/context-detection.yml

@include shared/simpleclaude/core-patterns.yml

@include shared/simpleclaude/mode-detection.yml

@include shared/simpleclaude/modes.yml

@include shared/simpleclaude/sub-agents.yml

@include shared/simpleclaude/thinking-modes.yml

@include shared/simpleclaude/workflows.yml

## Command Execution

**If "$ARGUMENTS" is empty**: Display usage suggestions and stop. **If "$ARGUMENTS" has content**: Think step-by-step, then execute.

Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [auto-spawned sub-agents]

**Auto-Spawning:** Spawns specialized sub-agents for parallel task execution.

Smart modification router that transforms natural language into structured improvement directives for performance optimization, refactoring, migration, and deployment tasks.

### Semantic Transformations

```
"improve performance" →
  What: current codebase performance bottlenecks
  How: profiling, optimization, caching, algorithm improvements
  Mode: implementer

"carefully refactor the payment module" →
  What: payment module requiring safe refactoring
  How: backup first, extract methods, preserve behavior, extensive testing
  Mode: planner

"quickly optimize database queries" →
  What: database query performance
  How: query analysis, indexing, caching strategies
  Mode: implementer

"migrate to latest React with tests" →
  What: React framework upgrade
  How: staged migration, compatibility testing, validation
  Mode: tester
```

Examples:

- `/sc-modify improve performance` - Optimize code performance with profiling
- `/sc-modify carefully refactor payment module` - Safe refactoring with backups
- `/sc-modify quickly fix typo in README` - Immediate fix with minimal overhead
- `/sc-modify migrate to React 18` - Framework upgrade with testing

**Context Detection:** Request analysis → Scope identification → Approach selection → Mode detection → Sub-agent spawning

## Core Workflows

**Planner:** Sub-agents → Analyze current state → Design improvement strategy → Create safety plan → Document changes **Implementer:** Sub-agents → Apply modifications → Run tests → Validate behavior → Measure improvements **Tester:** Sub-agents → Create test scenarios → Validate changes → Performance benchmarks → Regression testing
