# sc-skills

Skills and agents for frontend design, plugin development, and PR workflows.

## What's Included

### Agents (2)

| Agent | Purpose |
|-------|---------|
| `sc-design-iterator` | Iterative design improvement (5x, 10x iterations) |
| `sc-pr-comment-resolver` | Resolve individual PR comments with implementation and reporting |

### Skills (3)

| Skill | Purpose |
|-------|---------|
| `sc-frontend-design` | Frontend design patterns and best practices |
| `sc-gemini-imagegen` | Image generation with Gemini API |
| `sc-pull-request-skills` | GitHub PR workflow automation |

### Commands (4)

| Command | Purpose |
|---------|---------|
| `/sc-generate-command` | Create new slash commands |
| `/sc-playwright-test` | Run Playwright browser tests on pages affected by PR/branch |
| `/sc-pr-comments` | Fetch and display comments from GitHub PR |
| `/sc-resolve-pr-parallel` | Resolve all PR comments using parallel processing |

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

### Browser Testing

Run end-to-end tests on pages affected by your changes:

```bash
# Test current branch
/sc-playwright-test

# Test specific PR
/sc-playwright-test 847

# Test specific branch
/sc-playwright-test feature/new-dashboard
```

### PR Comment Management

Fetch and resolve PR review comments:

```bash
# View all unresolved comments for current PR
/sc-pr-comments

# View comments for specific PR
/sc-pr-comments 123

# View comments from PR URL
/sc-pr-comments https://github.com/owner/repo/pull/456

# Resolve all comments in parallel (spawns agents for each comment)
/sc-resolve-pr-parallel

# Resolve comments for specific PR
/sc-resolve-pr-parallel 123
```

## Requirements

### Required
- Node.js (for Playwright MCP)

### Optional
- `GEMINI_API_KEY` environment variable (for sc-gemini-imagegen skill)
- `PLAYWRIGHT_USER_DATA_DIR` environment variable (to use a specific Chrome profile)
- `PLAYWRIGHT_MCP_EXTENSION_TOKEN` environment variable (for Playwright extension features)

### Playwright Chrome Profile Configuration

By default, Playwright uses Chrome's default profile. To use a specific profile (preserving cookies, extensions, login state):

**Find your Chrome profile:**
```bash
ls -la ~/Library/Application\ Support/Google/Chrome/
# Shows: Default, Profile 1, Profile 2, etc.
```

**Set the profile:**
```bash
# One-time use
export PLAYWRIGHT_USER_DATA_DIR="/Users/username/Library/Application Support/Google/Chrome/Profile 2"
claude

# Make permanent (add to ~/.zshrc)
echo 'export PLAYWRIGHT_USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome/Profile 2"' >> ~/.zshrc
source ~/.zshrc

# Override per-launch
PLAYWRIGHT_USER_DATA_DIR="$HOME/Library/Application Support/Google/Chrome/Default" claude
```

## Architecture

The `sc-pull-request-skills` skill provides reusable scripts and patterns for PR automation workflows. The `/sc-pr-comments` and `/sc-resolve-pr-parallel` commands leverage this skill along with the `sc-pr-comment-resolver` agent to enable efficient code review resolution workflows.
