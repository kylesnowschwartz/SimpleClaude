---
name: external-agents
description: >
  Invoke external AI CLIs (Codex, Gemini) for second opinions, code reviews, or alternative analysis.
  This skill SHOULD be used when the user asks for a "second opinion", "outside review",
  says "ask codex", "ask gemini", "run codex", "run gemini", "get another AI's take",
  or needs verification from a different model.
---

# External AI CLIs: Codex & Gemini

Run OpenAI Codex CLI or Google Gemini CLI for second opinions and external reviews.

## Prerequisites

| Tool | Install | Config |
|------|---------|--------|
| Codex | `npm install -g @openai/codex` | `codex login` / `~/.codex/config.toml` |
| Gemini | `brew install gemini-cli` | Google auth / `~/.gemini/settings.json` |

Check availability: `codex --version` / `gemini --version`

## When to Use

- User wants a second opinion from a different AI model
- Code review from an external perspective
- Verification of an approach or architecture
- User explicitly requests codex or gemini

## Recommended Models

No "latest" alias exists for either CLI — you must pin specific model names.

### Codex (SWE-optimized)

| Model | Use Case |
|-------|----------|
| `gpt-5.3-codex` | Best. Latest agentic coding model, SOTA on SWE-Bench Pro. |
| `gpt-5.2-codex` | Previous generation. Still capable. |
| `gpt-5.1-codex-max` | Extended reasoning variant. |

Set default in `~/.codex/config.toml`: `model = "gpt-5.3-codex"`

### Gemini

| Model | Use Case |
|-------|----------|
| `gemini-3-pro-preview` | Most capable. Requires `previewFeatures: true` in settings. |
| `gemini-3-flash-preview` | Faster, good for quick checks. |
| `gemini-2.5-pro` | Stable default. |

Set default in `~/.gemini/settings.json`:
```json
{ "model": { "name": "gemini-3-pro-preview" } }
```

## Codex CLI

### Subcommands

| Command | Purpose |
|---------|---------|
| `codex review` | Git-aware code review (non-interactive) |
| `codex exec` | Non-interactive prompt execution |
| `codex resume` | Resume previous interactive session |
| `codex apply` | Apply latest agent diff via `git apply` |

### Code Review (most common use)

**Important**: `codex review` treats `--base`, `--uncommitted`, `--commit`, and `[PROMPT]` as mutually exclusive modes. You cannot combine a custom prompt with `--base` or `--uncommitted`. To review with custom instructions, pipe the diff to `codex exec` instead.

```bash
# Review uncommitted changes (default instructions)
codex review --uncommitted

# Review branch against main (default instructions)
codex review --base main

# Review specific commit (default instructions)
codex review --commit <SHA>

# Review with custom instructions — pipe diff to exec
git diff main...HEAD | codex exec -s read-only "Focus on error handling and security"
git diff HEAD | codex exec -s read-only "Check for race conditions"

# Review with title context
codex review --uncommitted --title "Add user auth middleware"
```

### Non-Interactive Execution

```bash
# Freeform analysis
codex exec "Analyze the auth module for security issues"

# Specify model
codex exec -m o3 "Review this codebase architecture"

# Full-auto mode (sandboxed, auto-approves)
codex exec --full-auto "Refactor the test helpers"

# JSONL event output
codex exec --json "List all TODO comments" -o /tmp/result.txt

# Read-only sandbox
codex exec -s read-only "Audit dependencies for vulnerabilities"
```

### Key Flags

| Flag | Purpose |
|------|---------|
| `-m, --model <MODEL>` | Model selection (e.g., `o3`) |
| `-c key=value` | Override config (TOML format) |
| `-s, --sandbox <MODE>` | `read-only`, `workspace-write`, `danger-full-access` |
| `--full-auto` | Sandboxed auto-execution |
| `-C, --cd <DIR>` | Set working directory |
| `--search` | Enable web search tool |
| `--json` | JSONL event output (exec only) |
| `-o, --output-last-message <FILE>` | Write last message to file (exec only) |

## Gemini CLI

### Non-Interactive (Headless)

```bash
# Non-interactive prompt (exits when done)
gemini -p "Review this codebase for architectural issues"

# Auto-approve all actions
gemini -y -p "Fix the failing tests"

# Structured output
gemini -o json -p "List the public API surface of src/auth/"
```

### Interactive

```bash
# Interactive with initial prompt
gemini -i "Help me debug the auth flow"

# Resume last session
gemini -r latest

# Include additional directories
gemini --include-directories ../shared-lib "Review cross-repo dependencies"
```

### Key Flags

| Flag | Purpose |
|------|---------|
| `-m, --model <MODEL>` | Model selection |
| `-p, --prompt <TEXT>` | Non-interactive (headless) mode |
| `-i, --prompt-interactive <TEXT>` | Run prompt then stay interactive |
| `-y, --yolo` | Auto-approve all actions |
| `--approval-mode <MODE>` | `default`, `auto_edit`, `yolo` |
| `-r, --resume <ID>` | Resume session (`latest` or index) |
| `--include-directories <DIRS>` | Additional workspace directories |
| `-o, --output-format <FMT>` | `text`, `json`, `stream-json` |

## Usage Patterns

### Get a Second Opinion on Changes

```bash
# Codex (git-aware, understands diffs natively)
codex review --uncommitted

# Gemini (prompt-based)
gemini -p "Review the uncommitted changes in this repo for bugs and security issues"
```

### Review a Design Decision

```bash
codex exec "Evaluate the architecture in src/auth/. Is the token refresh approach sound?"

gemini -p "Analyze src/auth/ and critique the token refresh strategy"
```

### Review a Branch Before PR

```bash
# Default review (no custom prompt needed)
codex review --base main

# Custom review instructions — pipe diff to exec
git diff main...HEAD | codex exec -s read-only "Review for correctness, test coverage, and maintainability"
```

## Important

- Both CLIs operate on the working directory. Do NOT pipe file contents via `$(cat file)` — let them read files directly.
- If a command fails with a syntax error, run `<tool> --help` to check current flags before retrying.
- If an upgrade notice appears, inform the user. Do NOT auto-upgrade.
- Codex config values use TOML format: `-c model_reasoning_effort="high"`

## Core Principle

Use `codex review` for git-aware code reviews. Use `codex exec` or `gemini -p` for freeform analysis. Let each CLI read files from the working directory rather than shell-expanding content into arguments.
