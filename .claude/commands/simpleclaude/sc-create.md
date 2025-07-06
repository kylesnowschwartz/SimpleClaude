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

## Smart Detection & Routing

```yaml
Project/App:
  scaffold, app, project, application, boilerplate → Full scaffold with
  structure, config, dependencies, Git init, tests, README

API/Backend:
  api, backend, rest, graphql, service, endpoint → Routes, validation, business
  logic, OpenAPI docs, integration tests

Component/UI:
  component, ui, interface, widget, element, react, vue → Pattern analysis,
  styled components, state management, unit tests

Documentation:
  docs, document, guide, readme, manual → Code analysis, API extraction,
  examples generation, version management

Architecture:
  architect, design, system, blueprint, structure → System design patterns,
  service boundaries, API contracts, deployment strategies
```

**Intelligent Context Detection:** Analyzes request intent | Identifies scope
automatically | Chooses optimal approach | Evidence-based modifications |
Detects modes from natural language patterns

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Creation_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Project Creation:** Analyze requirements → Generate structure → Setup config →
Initialize Git → Create tests → Write documentation → Ready to develop

**API Development:** Design endpoints → Implement routes → Add validation →
Business logic → Error handling → Generate docs → Integration tests

**Component Building:** Analyze patterns → Create structure → Implement logic →
Add styling → State management → Unit tests → Usage examples

**Documentation Flow:** Analyze codebase → Extract APIs → Generate examples →
Create guides → Version tracking → Deploy docs

## Sub-Agent Delegation

```yaml
When: Complex multi-part systems requiring specialized expertise
How: TodoWrite for orchestration → Task for parallel execution
Examples:
  - "create e-commerce platform" → Frontend, Backend, Database, Auth agents
  - "build microservice architecture" → Service agents for each domain
  - "develop full-stack app with mobile" → Web, API, Mobile, DevOps agents
```

## Best Practices

- Read existing patterns before creating new components
- Use TodoWrite for complex multi-step creation processes
- Leverage mode detection for nuanced approaches
- Always validate against project conventions
- Generate comprehensive tests matching detected mode intensity
