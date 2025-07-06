**Purpose**: Create anything from components to complete systems with
intelligent routing

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy @include
shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]
- Mode: [detected-modes]

Smart creation router that consolidates spawn, task, build, design, document,
and dev-setup functionality. Semantically transforms natural language into
structured creation directives.

### Semantic Transformations

```
"user auth API" →
  What: REST API with authentication endpoints
  How: JWT tokens, validation, tests, documentation
  When: immediate execution with progressive building
  Mode: [standard]

"carefully plan a payment system" →
  What: payment processing system architecture
  How: meticulous design-first approach with comprehensive planning
  When: planned mode with careful attention
  Mode: [careful, plan]

"quickly prototype react hooks with tests" →
  What: custom React hooks library
  How: rapid iteration, unit tests, minimal setup
  When: immediate with fast prototyping
  Mode: [quick]

"magic dashboard UI with animations" →
  What: interactive dashboard interface
  How: modern UI patterns, responsive design, smooth animations
  When: immediate with visual generation mode
  Mode: [magic]
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**Careful Mode** (careful, meticulous, thorough)

- Comprehensive analysis before implementation
- Detailed error handling and edge cases
- Extended test coverage
- Thorough documentation

**Quick Mode** (quick, fast, rapid, prototype)

- Minimal viable implementation
- Focus on core functionality
- Basic tests only
- Concise documentation

**Plan Mode** (plan, design, architect, blueprint)

- Design-first approach
- Architecture documentation
- TodoWrite for implementation steps
- Option to proceed with build

**Magic Mode** (magic, amazing, beautiful)

- Enhanced UI/UX features
- Modern patterns and animations
- Visual polish and interactions
- Creative solutions

**Mode Blending**

```
"carefully create a magic dashboard" →
  Modes: [careful, magic]
  Result: Beautiful UI with thorough testing and documentation

"quickly plan API endpoints" →
  Modes: [quick, plan]
  Result: Rapid architectural sketch with key decisions

"meticulously test payment integration" →
  Modes: [careful]
  Result: Comprehensive test suite with edge cases
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-create user auth API` - Builds complete REST API with JWT, tests, docs
- `/sc-create magic dashboard UI` - Generates full UI with modern patterns
- `/sc-create react hooks with best practices` - Creates hooks using project
  patterns
- `/sc-create plan for payment system` - Routes to planning workflow first
- `/sc-create carefully architect microservice system` - Thorough design with
  detailed specs
- `/sc-create quickly prototype chat interface` - Rapid MVP with core features
- `/sc-create meticulously test file upload API` - Comprehensive test coverage

**Mode-Based Behavior:** Natural language triggers adaptive workflows | Combines
modes for nuanced approaches | Context-aware execution

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
patterns and detected modes

**Workflow Adaptation:** Mode detection influences every step | Careful mode
adds validation layers | Quick mode streamlines processes | Magic mode enhances
output quality

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Creation_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization
