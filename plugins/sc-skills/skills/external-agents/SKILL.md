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

## Critical: Run CLIs Directly via Bash

You MUST run `codex` and `gemini` commands directly from **Bash** (with `run_in_background: true` for async).
Subagents cannot approve Bash permissions interactively — the command gets denied and the
subagent wastes its entire context asking for permission it can never get.

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
| `gemini-3.1-pro-preview` | Best. Latest model (Feb 2026). Requires `previewFeatures: true`. |
| `gemini-3-pro-preview` | Previous generation preview. |
| `gemini-3-flash-preview` | Faster, good for quick checks. |
| `gemini-2.5-pro` | Stable GA fallback if preview models have capacity issues. |
| `gemini-2.5-flash` | Fast GA fallback. |

**Always pin the model with `-m`** in non-interactive/headless calls. The user's
`~/.gemini/settings.json` may use `auto-gemini-3` routing, which can select Flash for
prompts it classifies as "simple" — not what you want for code reviews.

If you hit `429 MODEL_CAPACITY_EXHAUSTED` on preview models, fall back to `-m gemini-2.5-pro`.
This is a server capacity issue (not quota) and mostly affects `oauth-personal` auth.
Enterprise API key (`gemini-api-key` auth with billing) has better capacity allocation.

Set default in `~/.gemini/settings.json`:
```json
{ "model": { "name": "gemini-3.1-pro-preview" } }
```

## Codex CLI

### Subcommands

| Command | Purpose |
|---------|---------|
| `codex review` | Git-aware code review (non-interactive) |
| `codex exec` | Non-interactive prompt execution (always pass `-C "$PWD"` to set working directory) |
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
git diff main...HEAD | codex exec -C "$PWD" -s read-only "Focus on error handling and security"
git diff HEAD | codex exec -C "$PWD" -s read-only "Check for race conditions"

# Review with title context
codex review --uncommitted --title "Add user auth middleware"
```

### Non-Interactive Execution

```bash
# Freeform analysis
codex exec -C "$PWD" "Analyze the auth module for security issues"

# Specify model
codex exec -C "$PWD" -m o3 "Review this codebase architecture"

# Full-auto mode (sandboxed, auto-approves)
codex exec -C "$PWD" --full-auto "Refactor the test helpers"

# JSONL event output
codex exec -C "$PWD" --json "List all TODO comments" -o /tmp/result.txt

# Read-only sandbox
codex exec -C "$PWD" -s read-only "Audit dependencies for vulnerabilities"
```

### Key Flags

| Flag | Purpose |
|------|---------|
| `-m, --model <MODEL>` | Model selection (e.g., `o3`) |
| `-c key=value` | Override config (TOML format) |
| `-s, --sandbox <MODE>` | `read-only`, `workspace-write`, `danger-full-access` |
| `--full-auto` | Sandboxed auto-execution |
| `-C, --cd <DIR>` | Set working directory (use this instead of `--skip-git-repo-check`) |
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
codex exec -C "$PWD" "Evaluate the architecture in src/auth/. Is the token refresh approach sound?"

gemini -p "Analyze src/auth/ and critique the token refresh strategy"
```

### Review a Branch Before PR

```bash
# Default review (no custom prompt needed)
codex review --base main

# Custom review instructions — pipe diff to exec
git diff main...HEAD | codex exec -C "$PWD" -s read-only "Review for correctness, test coverage, and maintainability"
```

## Important

- Both CLIs operate on the working directory. Do NOT pipe file contents via `$(cat file)` — let them read files directly.
- **Gemini stdin bug**: `cat file | gemini -p "..."` fails with "Cannot use both a positional prompt and the --prompt flag together." Gemini's arg parser treats cat-piped stdin as a positional argument conflicting with `-p`. Use `< file` redirection instead: `gemini -m MODEL -p "prompt" < /path/to/file`. This works correctly.
- **Gemini headless tool trust bug** ([#18776](https://github.com/google-gemini/gemini-cli/issues/18776)): Gemini in `-p` headless mode cannot reliably use filesystem tools — the folder trust check fails. Feed content via stdin rather than expecting Gemini to read files itself.
- If a command fails with a syntax error, run `<tool> --help` to check current flags before retrying.
- If an upgrade notice appears, inform the user. Do NOT auto-upgrade.
- Codex config values use TOML format: `-c model_reasoning_effort="high"`

## Core Principle

Use `codex review` for git-aware code reviews. Use `codex exec` or `gemini -p` for freeform analysis. Let each CLI read files from the working directory rather than shell-expanding content into arguments.
