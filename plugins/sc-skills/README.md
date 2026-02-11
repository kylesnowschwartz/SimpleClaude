# sc-skills

Skills and agents for frontend design, image generation, and command creation.

## What's Included

### Agents (1)

| Agent | Purpose |
|-------|---------|
| `sc-design-iterator` | Iterative design improvement (5x, 10x iterations) |

### Skills (2)

| Skill | Purpose |
|-------|---------|
| `sc-frontend-design` | Frontend design patterns and best practices |
| `sc-gemini-imagegen` | Image generation with Gemini API |

### Commands (1)

| Command | Purpose |
|---------|---------|
| `/sc-generate-command` | Create new slash commands |

## Usage

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

## Requirements

### Optional
- `GEMINI_API_KEY` environment variable (for sc-gemini-imagegen skill)

## Architecture

Design iteration uses the `sc-design-iterator` agent for systematic visual refinement.
