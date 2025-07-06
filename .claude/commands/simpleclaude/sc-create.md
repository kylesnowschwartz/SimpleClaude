**Purpose**: Smart creation router for any development need

---

@include shared/simpleclaude/core-patterns.yml#patterns

## Command Execution

Execute: immediate. --plan→show plan first Legend: Generated based on symbols
used in command Purpose: "Create $ARGUMENTS"

SimpleClaude consolidates creation functionality from multiple commands into one
intelligent interface.

@include shared/simpleclaude/workflows.yml#workflows

Examples:

- `/sc-create REST API with authentication` → builds complete API with auth
- `/sc-create user profile component` → creates component with best practices
- `/sc-create API documentation` → generates comprehensive docs
- `/sc-create microservice architecture` → designs architecture patterns
- `/sc-create development environment` → sets up complete dev environment

**Creation Logic:**

SimpleClaude analyzes $ARGUMENTS to determine what to create:

```
IF $ARGUMENTS contains "project|app|application|platform|system|microservice"
  → Execute full project creation workflow
  → Include structure, dependencies, configuration

ELSIF $ARGUMENTS contains "documentation|readme|spec|guide|docs"
  → Execute documentation generation workflow
  → Analyze code and create appropriate docs

ELSIF $ARGUMENTS contains "architecture|design|schema|diagram|structure"
  → Execute design workflow
  → Create diagrams, patterns, structure

ELSIF $ARGUMENTS contains "environment|setup|docker|ci/cd|pipeline|dev"
  → Execute environment setup workflow
  → Configure tools, dependencies, workflows

ELSIF $ARGUMENTS contains "api|service|endpoint|route|controller"
  → Execute API/service creation workflow
  → Include routes, controllers, tests

ELSIF $ARGUMENTS contains "component|function|class|module|method"
  → Execute code generation workflow
  → Create clean, tested code

ELSE
  → Default to code generation workflow
```

**Keyword Detection:**

- **Build**: project, app, application, microservice, platform, system
- **Document**: documentation, readme, spec, guide, docs, manual
- **Design**: architecture, design, schema, diagram, structure, flow
- **Setup**: environment, setup, docker, ci/cd, pipeline, infrastructure
- **Feature**: api, service, endpoint, backend, frontend, full-stack
- **Task**: component, function, class, module, method, utility

**Pass-through Flags:** All flags are passed through unmodified:

- `--magic` → UI generation
- `--c7` → documentation lookup
- `--plan` → show plan first
- `--test` → include tests
- `--tdd` → test-driven development

@include shared/simpleclaude/core-patterns.yml#git_conventions
