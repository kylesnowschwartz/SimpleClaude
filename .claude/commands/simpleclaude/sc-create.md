**Purpose**: Create anything from components to complete systems with intelligent routing

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Core Creation Workflow**:
- `Task("context-analyzer", "analyze project structure and identify integration points")`  
- `Task("system-architect", "design component architecture and implementation plan")`  
- `Task("implementation-specialist", "build solution following established patterns")`  
- `Task("validation-specialist", "verify implementation integrates and functions correctly")`

**Creation-Specific Specialists** (spawn as needed):
- `Task("pattern-analyst", "identify and apply existing project patterns and conventions")`
- `Task("integration-specialist", "ensure new component integrates with existing system")`

**Execution Strategy**: Spawn agents sequentially for dependent tasks, simultaneously for independent creation streams.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel execution.

Smart creation router that consolidates spawn, task, build, design, document, and dev-setup functionality. Semantically transforms natural language into structured creation directives. Build exactly to user specifications without refactoring or unasked for enhancements.

### Semantic Transformations

```
"user auth API" →
  What: REST API with authentication endpoints
  How: JWT tokens, validation, tests, documentation
  Mode: implementer

"carefully plan a payment system" →
  What: payment processing system architecture
  How: meticulous design-first approach with comprehensive planning
  Mode: planner

"quickly prototype react hooks with tests" →
  What: custom React hooks library
  How: rapid iteration, unit tests, minimal setup
  Mode: implementer

"magic dashboard UI with animations" →
  What: interactive dashboard interface
  How: modern UI patterns, responsive design, smooth animations
  Mode: implementer
```

Examples:

- `/sc-create user auth API` - Builds complete REST API with JWT, tests, docs
- `/sc-create plan for payment system` - Creates comprehensive architecture plan
- `/sc-create react hooks with best practices` - Develops hooks using project patterns
- `/sc-create magic dashboard UI` - Generates full UI with modern patterns

**Context Detection:** Request analysis → Scope identification → Approach selection → Mode detection → Agent spawning

## Core Workflows

**Planner:** Agents → Analyze requirements → Design architecture → Create plan → Generate docs  
**Implementer:** Agents → Read patterns → Build solution → Add tests → Validate → Deploy ready  
**Tester:** Agents → Analyze functionality → Create scenarios → Implement validation → Verify coverage
