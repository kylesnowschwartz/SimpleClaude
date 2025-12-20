---
name: sc-skill-builder
description: Guide for creating, auditing, and packaging Claude Code skills. This skill should be used when building new skills, improving existing skills, understanding skill structure, or packaging skills for distribution.
---

<essential_principles>
## How Skills Work

Skills are modular, filesystem-based capabilities that provide domain expertise on demand.

### 1. Skills Are Prompts

All prompting best practices apply. Be clear, be direct, use XML structure. Assume Claude is smart - only add context Claude doesn't have.

### 2. SKILL.md Is Always Loaded

When a skill is invoked, Claude reads SKILL.md. Use this guarantee:
- Essential principles go in SKILL.md (can't be skipped)
- Workflow-specific content goes in workflows/
- Reusable knowledge goes in references/

### 3. Router Pattern for Complex Skills

```
skill-name/
├── SKILL.md              # Router + principles
├── workflows/            # Step-by-step procedures (FOLLOW)
├── references/           # Domain knowledge (READ)
├── templates/            # Output structures (COPY + FILL)
└── scripts/              # Executable code (RUN)
```

### 4. Pure XML Structure

No markdown headings in skill body. Use semantic XML tags (`<objective>`, `<quick_start>`, `<success_criteria>`).

### 5. Progressive Disclosure

SKILL.md under 500 lines. Split detailed content into reference files. Load only what's needed.
</essential_principles>

<quick_start>
## Tooling

Initialize a new skill:
```bash
python scripts/init_skill.py my-skill-name --path /path/to/skills/
```

Validate a skill:
```bash
python scripts/quick_validate.py /path/to/skill-name/
```

Package for distribution:
```bash
python scripts/package_skill.py /path/to/skill-name/
```
</quick_start>

<intake>
What would you like to do?

1. Create new skill
2. Audit/modify existing skill
3. Add component (workflow/reference/template/script)
4. Get guidance
5. Package skill for distribution

**Wait for response before proceeding.**
</intake>

<routing>
| Response | Next Action | Workflow |
|----------|-------------|----------|
| 1, "create", "new", "build" | Ask: "Task-execution skill or domain expertise skill?" | Route to create workflow |
| 2, "audit", "modify", "existing" | Ask: "Path to skill?" | Route to audit/verify workflow |
| 3, "add", "component" | Ask: "Add what? (workflow/reference)" | workflows/add-{type}.md |
| 4, "guidance", "help" | General guidance | workflows/get-guidance.md |
| 5, "package", "distribute" | Run packaging script | See quick_start |

**Progressive disclosure for option 1 (create):**
- Task-execution skill → workflows/create-new-skill.md
- Domain expertise skill → workflows/create-domain-expertise-skill.md

**Intent-based routing:**
- "audit this skill", "check skill", "review" → workflows/audit-skill.md
- "verify content", "check if current" → workflows/verify-skill.md
- "upgrade to router" → workflows/upgrade-to-router.md

**After reading the workflow, follow it exactly.**
</routing>

<quick_reference>
## Skill Structure

**Simple skill (single file):**
```yaml
---
name: skill-name
description: What it does and when to use it.
---

<objective>What this skill does</objective>
<quick_start>Immediate actionable guidance</quick_start>
<success_criteria>How to know it worked</success_criteria>
```

**Complex skill (router pattern):**
```
SKILL.md:
  <essential_principles> - Always applies
  <intake> - Question to ask
  <routing> - Maps answers to workflows

workflows/:
  <required_reading> - Which refs to load
  <process> - Steps
  <success_criteria> - Done when...

references/:
  Domain knowledge, patterns, examples

scripts/:
  Executable code Claude runs as-is
```
</quick_reference>

<reference_index>
## Domain Knowledge

All in `references/`:

**Structure:** skill-structure.md
**Principles:** authoring-principles.md
**XML Tags:** use-xml-tags.md
**Patterns:** common-patterns.md
**Scripts:** using-scripts.md
**Templates:** using-templates.md
**Validation:** workflows-and-validation.md
**Security:** api-security.md
</reference_index>

<workflows_index>
## Workflows

All in `workflows/`:

| Workflow | Purpose |
|----------|---------|
| create-new-skill.md | Build a skill from scratch |
| create-domain-expertise-skill.md | Build exhaustive domain knowledge base |
| audit-skill.md | Analyze skill against best practices |
| verify-skill.md | Check if content is still accurate |
| add-workflow.md | Add a workflow to existing skill |
| add-reference.md | Add a reference to existing skill |
| upgrade-to-router.md | Convert simple skill to router pattern |
| get-guidance.md | Help decide what kind of skill to build |
</workflows_index>

<yaml_requirements>
## YAML Frontmatter

Required fields:
```yaml
---
name: skill-name          # lowercase-with-hyphens, matches directory
description: ...          # What it does AND when to use it (third person)
---
```

Name conventions: `create-*`, `manage-*`, `setup-*`, `generate-*`, `build-*`
</yaml_requirements>

<success_criteria>
A well-structured skill:
- Has valid YAML frontmatter
- Uses pure XML structure (no markdown headings in body)
- Has essential principles inline in SKILL.md
- Routes to appropriate workflows based on user intent
- Keeps SKILL.md under 500 lines
- Asks minimal clarifying questions
- Has been tested with real usage
</success_criteria>
