**Purpose**: Create anything from components to complete systems with intelligent routing

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
