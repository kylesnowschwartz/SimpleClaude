**Purpose**: Intelligently modify, improve, refactor, and optimize code with safety controls

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Context Analysis**: `Task("context-analyzer", "analyze current code structure and modification requirements")`  
**Strategic Planning**: `Task("system-architect", "create safe modification plan with rollback strategy")`  
**Implementation**: `Task("implementation-specialist", "execute modifications with testing and validation")`  
**Quality Validation**: `Task("validation-review-specialist", "verify modifications maintain behavior and improve quality")`

**Supporting Specialists**:

- `Task("research-analyst", "investigate optimization patterns and best practices")`
- `Task("debugging-specialist", "identify and resolve issues during modification")`
- `Task("documentation-specialist", "update documentation to reflect changes")`

**Execution Strategy**: For complex modifications, spawn multiple agents simultaneously for independent work streams like refactoring, testing, and performance validation.

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
