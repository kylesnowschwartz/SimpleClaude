# Memory File Templates

These templates apply to CLAUDE.md and AGENTS.md alike. The two files are often symlinked together; when they are, edit only the source. If a project maintains both as distinct files, keep them in sync — duplicated drift is one of the highest-yield Red Flags from [quality-criteria.md](quality-criteria.md).

## Key Principles

- **Concise**: Dense, human-readable content; one line per concept when possible.
- **Actionable**: Commands should be copy-paste ready with exact flags.
- **Project-specific**: Document patterns unique to this project, not generic advice.
- **Current**: All info should reflect the actual codebase state.
- **Pointer over content**: For anything longer than a handful of lines, link to a path (`for X, see docs/Y.md`) rather than embed inline. Path pointers fetch just-in-time; `@file` embeddings load every turn. *(Source: Shrivu Shankar, "How I Use Every Claude Code Feature.")*

---

## Recommended Sections

Use only the sections relevant to the project. Most projects need only Commands and Gotchas; everything else is opt-in. The Anthropic *Effective context engineering* post (Sept 2025) calls this finding the "right altitude": specific enough to guide, general enough to survive the next refactor.

### Commands

Document the essential commands for working with the project.

```markdown
## Commands

| Command | Description |
|---------|-------------|
| `<install command>` | Install dependencies |
| `<dev command>` | Start development server |
| `<build command>` | Production build |
| `<test command>` | Run tests |
| `<lint command>` | Lint/format code |
```

### Gotchas

Document non-obvious patterns, quirks, and warnings.

```markdown
## Gotchas

- <non-obvious thing that causes issues>
- <ordering dependency or prerequisite>
- <common mistake to avoid>
```

### Architecture (opt-in)

Include only if relationships are not obvious from imports / file layout. The model can derive directory structure from the codebase; do not restate it.

```markdown
## Architecture

```
<root>/
  <dir>/    # <purpose, only if non-obvious>
  <dir>/    # <purpose>
```
```

### Key Files (opt-in)

Include only if entry points are not conventionally named.

```markdown
## Key Files

- `<path>` - <purpose>
- `<path>` - <purpose>
```

### Code Style (opt-in)

Include only for project-specific conventions a linter or formatter does not catch. Lint-enforceable rules belong in the linter, not here.

```markdown
## Code Style

- <convention not enforced by linter>
- <preference over alternative>
```

### Environment (opt-in)

Include only for non-obvious required vars or setup.

```markdown
## Environment

Required:
- `<VAR_NAME>` - <purpose>

Setup:
- <setup step>
```

### Testing (opt-in)

Include only for project-specific test patterns.

```markdown
## Testing

- `<test command>` - <what it tests>
- <testing convention or pattern>
```

### Workflow (opt-in)

Include only for project-specific decision rules.

```markdown
## Workflow

- <when to do X>
- <preferred approach for Y>
```

---

## Template: Pointer-style root (recommended for monorepos and large codebases)

The most strongly research-endorsed pattern: a short root file that points at deeper docs and subdirectory memory files, rather than embedding everything.

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<install command>` | Install dependencies |
| `<test command>` | Run tests |

## Gotchas

- <gotcha>

## Deeper docs

- For DB schema rules: `docs/db.md`
- For auth flow and token storage: `docs/auth.md`
- For deployment pipeline: `docs/deploy.md`

## Subdirectory memory

- `packages/api/CLAUDE.md` — API-specific patterns
- `packages/web/CLAUDE.md` — frontend patterns
```

> Why this works: Claude auto-discovers subdirectory CLAUDE.md files contextually, so each loads only when relevant. Pointer entries (`docs/db.md`) are read on demand, not every turn.

---

## Template: Project Root (Minimal)

For small or single-package projects.

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Gotchas

- <gotcha>
```

---

## Template: Package / Module

For packages within a monorepo or distinct modules.

```markdown
# <Package Name>

<Purpose of this package>

## Usage

```
<import/usage example>
```

## Key Exports

- `<export>` - <purpose>

## Notes

- <important note>
```

---

## Template: Maximal — use sparingly

Included for completeness only. Most projects do not need all these sections; including them by default invites the section-stuffing the research warns against. Reach for this template only if you can defend each section against the displacement test.

```markdown
# <Project Name>

<One-line description>

## Commands

| Command | Description |
|---------|-------------|
| `<command>` | <description> |

## Architecture

```
<structure with descriptions — only if non-obvious>
```

## Key Files

- `<path>` - <purpose>

## Code Style

- <convention not enforced by linter>

## Environment

- `<VAR>` - <purpose>

## Testing

- `<command>` - <scope>

## Gotchas

- <gotcha>
```

---

## Update Principles

When updating any memory file:

1. **Be specific**: use actual file paths and real commands from this project.
2. **Be current**: verify info against the actual codebase.
3. **Be brief**: one line per concept when possible.
4. **Be useful**: would this help a new Claude session understand the project?
5. **Prefer removal where possible**: a deletion is often higher-yield than an addition. Ask the displacement test: *would the file work as well without this line?*
