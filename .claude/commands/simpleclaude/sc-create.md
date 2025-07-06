**Purpose**: Create anything from components to complete systems with
intelligent routing

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Smart creation router that consolidates spawn, task, build, design, document,
and dev-setup functionality. Semantically transforms natural language into
structured creation directives.

### Semantic Transformations

```
"user auth API" →
  What: REST API with authentication endpoints
  How: JWT tokens, validation, tests, documentation
  When: immediate execution with progressive building

"plan for payment system" →
  What: payment processing system architecture
  How: design-first approach with comprehensive planning
  When: planned mode - design then optional build

"react hooks with tests" →
  What: custom React hooks library
  How: pattern analysis, unit tests, TypeScript types
  When: immediate with test-driven development

"--magic dashboard UI" →
  What: interactive dashboard interface
  How: modern UI patterns, responsive design, animations
  When: immediate with visual generation mode
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-create user auth API` - Builds complete REST API with JWT, tests, docs
- `/sc-create --magic dashboard UI` - Generates full UI with modern patterns
- `/sc-create --c7 react hooks` - Creates hooks with Context7 best practices
- `/sc-create plan for payment system` - Routes to planning workflow first
- `/sc-create --plan microservice architecture` - Shows design plan before
  building

**Planning Mode:** Detects "plan", "design", "architect" keywords | Creates
comprehensive design docs | TodoWrite for implementation steps | Can proceed to
build after approval

**Project/App:** Full scaffold with structure, config, dependencies | Git init |
Complete test setup | README and documentation

**API/Backend:** Routes, validation, business logic | OpenAPI documentation |
Integration tests | Error handling patterns

**Component/UI:** Pattern analysis from existing code | Styled components |
State management | Unit tests | Storybook stories

**Documentation:** Code analysis | API extraction | Examples generation | Guide
creation | Version management

**Architecture:** System design patterns | Service boundaries | API contracts |
Deployment strategies | Scaling considerations

**Intelligent Detection:** Automatically identifies creation type from
$ARGUMENTS | Routes to planning when complex | Adapts approach based on project
patterns

**--watch:** Monitor creation progress | Auto-adjust on errors | Real-time
feedback **--interactive:** Step-by-step guidance | User confirmation at key
points | Progressive refinement

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Creation_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization
