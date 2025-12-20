# sc-skills

Skills and agents for frontend design, plugin development, and PR workflows.

## What's Included

### Agents (3)

| Agent | Purpose |
|-------|---------|
| `figma-design-sync` | Sync implementation with Figma designs |
| `design-iterator` | Iterative design improvement (5x, 10x iterations) |
| `design-implementation-reviewer` | Review design implementation accuracy |

### Skills (4)

| Skill | Purpose |
|-------|---------|
| `frontend-design` | Frontend design patterns and best practices |
| `gemini-imagegen` | Image generation with Gemini API |
| `skill-creator` | Guide for creating effective skills |
| `create-agent-skills` | Agent-assisted skill creation with router pattern |

### Commands (3)

| Command | Purpose |
|---------|---------|
| `/generate_command` | Create new slash commands |
| `/heal-skill` | Fix broken or outdated skills |
| `/create-agent-skill` | Create new skills with expert guidance |

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
Generate a logo for 'Acme Corp' using gemini-imagegen
```

### Create Skills

```
/create-agent-skill "Rails testing patterns"
```

## Requirements

- Node.js (for Playwright MCP)
- `GEMINI_API_KEY` environment variable (for gemini-imagegen skill)

## Future

`sc-pull-request-skills/` is reserved for PR-related skills and agents.
