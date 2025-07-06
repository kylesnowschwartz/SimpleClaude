**Purpose**: Smart creation router for any development need

---

@include ../../superclaude/shared/universal-constants.yml#Universal_Legend

## Command Execution

Execute: immediate. --plan→show plan first Legend: Generated based on symbols
used in command Purpose: "Create $ARGUMENTS"

Route creation requests in $ARGUMENTS to appropriate SuperClaude commands.

@include ../../superclaude/shared/flag-inheritance.yml#Universal_Always

Examples:

- `/sc-create REST API with authentication` → routes to build
- `/sc-create user profile component` → routes to task
- `/sc-create API documentation` → routes to document
- `/sc-create microservice architecture` → routes to design
- `/sc-create development environment` → routes to dev-setup

**Smart Routing Logic:**

```
IF $ARGUMENTS contains "project|app|application|platform|system|microservice"
  → /scl-build $ARGUMENTS

ELSIF $ARGUMENTS contains "documentation|readme|spec|guide|docs"
  → /scl-document $ARGUMENTS

ELSIF $ARGUMENTS contains "architecture|design|schema|diagram|structure"
  → /scl-design $ARGUMENTS

ELSIF $ARGUMENTS contains "environment|setup|docker|ci/cd|pipeline|dev"
  → /scl-dev-setup $ARGUMENTS

ELSIF $ARGUMENTS contains "api|service|endpoint|route|controller"
  → /scl-build --feature $ARGUMENTS

ELSIF $ARGUMENTS contains "component|function|class|module|method"
  → /scl-task $ARGUMENTS

ELSE
  → /scl-task $ARGUMENTS  # Default for simple code creation
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

@include
../../superclaude/shared/execution-patterns.yml#Git_Integration_Patterns

@include
../../superclaude/shared/universal-constants.yml#Standard_Messages_Templates
