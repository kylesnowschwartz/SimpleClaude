# sc-skills

Skills and agents for frontend design, plugin development, and PR workflows.

## What's Included

### Agents (3)

| Agent | Purpose |
|-------|---------|
| `sc-figma-design-sync` | Sync implementation with Figma designs |
| `sc-design-iterator` | Iterative design improvement (5x, 10x iterations) |
| `sc-design-implementation-reviewer` | Review design implementation accuracy |

### Skills (3)

| Skill | Purpose |
|-------|---------|
| `sc-frontend-design` | Frontend design patterns and best practices |
| `sc-gemini-imagegen` | Image generation with Gemini API |
| `sc-skill-builder` | Create, audit, and package Claude Code skills |

### Commands (3)

| Command | Purpose |
|---------|---------|
| `/sc-generate-command` | Create new slash commands |
| `/sc-heal-skill` | Fix broken or outdated skills |
| `/sc-skill-builder` | Create, audit, or package skills with expert guidance |

## Usage

### Design Sync

Compare your implementation with a Figma design:

```
Sync this component with the Figma design at [figma-url]
```

### Design Iteration

When design isn't coming together, use iterative refinement:

```
Iterate on the hero section 10 times to improve the visual balance
```

### Image Generation

Generate images with Gemini:

```
Generate a logo for 'Acme Corp' using sc-gemini-imagegen
```

### Create Skills

```
/sc-skill-builder "Rails testing patterns"
```

Or audit an existing skill:

```
/sc-skill-builder audit path/to/my-skill
```

## Requirements

- Node.js (for Playwright MCP)
- `GEMINI_API_KEY` environment variable (for sc-gemini-imagegen skill)

## Future

`sc-pull-request-skills/` is reserved for PR-related skills and agents.
