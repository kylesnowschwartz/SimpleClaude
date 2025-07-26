**Purpose**: Intelligently modify, improve, refactor, and optimize code with safety controls

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze existing code structure, dependencies, and modification impact scope")`  
**Modification Planning**: `Task("system-architect", "design safe modification strategy with rollback plan and dependency mapping")`  
**Safe Implementation**: `Task("implementation-specialist", "execute modifications with incremental changes and continuous validation")`  
**Regression Testing**: `Task("validation-review-specialist", "verify modifications preserve existing behavior and improve target metrics")`

**Execution Strategy**: For complex modifications, spawn agents in sequence for safety (context → planning → implementation → validation) or parallel for independent modification streams.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

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

**Context Detection:** Request analysis → Scope identification → Approach selection → Mode detection → Agent spawning

## Core Workflows

**Planner:** Agents → Analyze current state → Design improvement strategy → Create safety plan → Document changes  
**Implementer:** Agents → Apply modifications → Run tests → Validate behavior → Measure improvements  
**Tester:** Agents → Create test scenarios → Validate changes → Performance benchmarks → Regression testing
