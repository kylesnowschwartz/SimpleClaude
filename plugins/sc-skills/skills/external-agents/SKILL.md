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

## Critical Rules

1. **Run CLIs directly via Bash.** Subagents cannot approve Bash permissions interactively, so the command gets denied. `run_in_background: true` is fine for long runs.

2. **End every non-interactive `codex` call with `</dev/null` unless you pipe content in.** When stdin is not a terminal, `codex exec` reads it and waits for end of file before it starts, so an inherited pipe that never closes hangs it with no output. Piping content in on purpose works: when stdin is piped and a prompt is also given, codex appends stdin to the prompt as a `<stdin>` block.

3. **Capture the final message and stderr.** Pass `-o <file>` for the final message and redirect stderr to a file (`2><file>`). The `session id:` line you need to resume a run is printed on stderr, not stdout. Check that the `-o` file exists before reading it.

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

## Models

### Codex

Use the default model from `~/.codex/config.toml` (`model = "..."`). Pass `-m <model>` only when the user names a model.

Codex uses stored OAuth tokens (`~/.codex/auth.json`) from `codex login` — no env var needed.

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
| `codex exec` | Non-interactive prompt execution |
| `codex exec resume <id>` | Send a follow-up prompt to an earlier `codex exec` session |
| `codex resume` | Resume previous interactive session |
| `codex apply` | Apply latest agent diff via `git apply` |

### Code Review (most common use)

**Important**: `codex review` treats `--base`, `--uncommitted`, `--commit`, and `[PROMPT]` as mutually exclusive modes. You cannot combine a custom prompt with `--base` or `--uncommitted`. To review with custom instructions, pipe the diff into `codex exec`, or save it to a file and name the file in the prompt.

```bash
# Review uncommitted changes (default instructions)
codex review --uncommitted </dev/null

# Review branch against main (default instructions)
codex review --base main </dev/null

# Review specific commit (default instructions)
codex review --commit <SHA> </dev/null

# Review with title context
codex review --uncommitted --title "Add user auth middleware" </dev/null

# Review with custom instructions: pipe the diff in; codex appends it as a <stdin> block
git diff main...HEAD | codex exec -s read-only -o /tmp/codex-review.md "Review the diff in the stdin block for error handling and security" 2>/tmp/codex-review.err

# Or save the diff to a file and name it in the prompt
git diff main...HEAD > /tmp/review-diff.txt
codex exec -s read-only -o /tmp/codex-review.md "Read /tmp/review-diff.txt and review it for error handling and security" </dev/null 2>/tmp/codex-review.err
```

### Non-Interactive Execution

Use `-s read-only` for reviews, questions, and analysis. Use `-s workspace-write` only when Codex must change files in the repository.

```bash
# Read-only analysis
codex exec -s read-only -o /tmp/codex-out.md "Analyze the auth module for security issues" </dev/null 2>/tmp/codex-err.txt

# A model the user named (otherwise omit -m)
codex exec -s read-only -m <model> -o /tmp/codex-out.md "Review this codebase architecture" </dev/null 2>/tmp/codex-err.txt

# Changes that need writes inside the repository
codex exec -s workspace-write -o /tmp/codex-out.md "Refactor the test helpers" </dev/null 2>/tmp/codex-err.txt

# JSONL event output on stdout
codex exec -s read-only --json "List all TODO comments" </dev/null >/tmp/codex-events.jsonl 2>/tmp/codex-err.txt

# Outside a git repository
codex exec --skip-git-repo-check -C /path/to/dir -s read-only -o /tmp/codex-out.md "Summarize the notes in this directory" </dev/null 2>/tmp/codex-err.txt
```

### Follow-up questions

Resume the same session by its id, so Codex keeps the context of the first run. Take the id from the `session id:` line in the stderr file. Use the explicit id rather than `--last` when several Codex runs may be active.

A resumed session does not inherit the first run's sandbox or model: it falls back to `~/.codex/config.toml`, which may allow writes and network access. Pass the sandbox with `-c sandbox_mode=...` (resume has no `-s` flag), and pass `-m` again if the first run used it.

```bash
SESSION_ID=$(sed -n 's/^session id: //p' /tmp/codex-err.txt)
codex exec resume -c 'sandbox_mode="read-only"' -o /tmp/codex-followup.md "$SESSION_ID" "Expand on the second finding" </dev/null 2>/tmp/codex-followup.err

# The first run used a model the user named
codex exec resume -c 'sandbox_mode="read-only"' -m <model> -o /tmp/codex-followup.md "$SESSION_ID" "Expand on the second finding" </dev/null 2>/tmp/codex-followup.err
```

The `sandbox:` line in the stderr file shows the sandbox the resumed run used. `codex exec resume` accepts `-o` and `--json`. It has no `-C` flag. Outside a git repository, run it from the same directory as the first run and add `--skip-git-repo-check`.

### Key Flags

| Flag | Purpose |
|------|---------|
| `-m, --model <MODEL>` | Model selection; omit it to use the `config.toml` default |
| `-c key=value` | Override config (TOML format) |
| `-s, --sandbox <MODE>` | `read-only` (reviews and analysis), `workspace-write` (edits inside the repository), `danger-full-access` |
| `-C, --cd <DIR>` | Set the working root. Not needed when the shell is already in the repository. Outside a git repository, also pass `--skip-git-repo-check` |
| `--skip-git-repo-check` | Allow running outside a git repository |
| `--json` | JSONL event output (exec only) |
| `-o, --output-last-message <FILE>` | Write last message to file (`exec` and `exec resume`) |

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
codex review --uncommitted </dev/null

# Gemini (prompt-based)
gemini -p "Review the uncommitted changes in this repo for bugs and security issues"
```

### Review a Design Decision

```bash
codex exec -s read-only -o /tmp/codex-out.md "Evaluate the architecture in src/auth/. Is the token refresh approach sound?" </dev/null 2>/tmp/codex-err.txt

gemini -p "Analyze src/auth/ and critique the token refresh strategy"
```

### Review a Branch Before PR

```bash
# Default review (no custom prompt needed)
codex review --base main </dev/null

# Custom review instructions: pipe the diff in
git diff main...HEAD | codex exec -s read-only -o /tmp/codex-review.md "Review the diff in the stdin block for correctness, test coverage, and maintainability" 2>/tmp/codex-review.err
```

## Troubleshooting

### Gemini: `GEMINI_API_KEY` not found

Gemini with `gemini-api-key` auth reads `GEMINI_API_KEY` from the environment. If the key is managed by direnv, it's only available when direnv loads the `.envrc` that exports it. A child directory with its own `.envrc` shadows the parent without inheriting — so the key can be missing depending on which directory the session runs from.

**Pre-flight check** (run before any Gemini invocation):

```bash
echo "GEMINI_API_KEY: ${GEMINI_API_KEY:+set (${#GEMINI_API_KEY} chars)}"
```

If unset, tell the user and skip Gemini. Codex does not have this problem — it uses stored OAuth tokens from `codex login`.

### Gemini: stdin bug

`cat file | gemini -p "..."` fails with "Cannot use both a positional prompt and the --prompt flag together." Gemini's arg parser treats cat-piped stdin as a positional argument conflicting with `-p`. Use `< file` redirection instead: `gemini -m MODEL -p "prompt" < /path/to/file`. This works correctly.

### Gemini: headless tool trust bug

[#18776](https://github.com/google-gemini/gemini-cli/issues/18776): Gemini in `-p` headless mode cannot reliably use filesystem tools — the folder trust check fails. Feed content via stdin rather than expecting Gemini to read files itself.

### Codex: hangs with no output

`codex exec` is waiting for end of file on an open stdin. Add `</dev/null` to the command, or pipe in content that ends.

### Codex: `unexpected argument '--full-auto'`

Current Codex CLI releases have no `--full-auto` flag. Use `-s read-only` for reviews and analysis, or `-s workspace-write` when Codex must edit files.

### Codex: plan-confirmation instead of review

If codex output contains "Plan:" followed by "If you're happy with that approach", codex did not execute: it proposed a plan and waited for approval. This happens when the prompt says "review this" but names nothing codex can see. Pipe the content in, or save it to a file and name the file in the prompt.

### Codex: `-o` creates no file

If Codex exhausts its turns without producing a final summary, `-o` creates no output file. Always check file existence, not just content.

### General

- **Codex reads piped stdin** and appends it to the prompt as a `<stdin>` block. Gemini reads stdin via `< file` redirection (not `cat | gemini`).
- If a command fails with a syntax error, run `<tool> --help` to check current flags before retrying.
- If an upgrade notice appears, inform the user. Do NOT auto-upgrade.
- Codex config values use TOML format: `-c model_reasoning_effort="high"`

## Codex Companion Script (codex-plugin-cc)

The `codex-plugin-cc` plugin provides a companion script that wraps `codex review` with structured JSON output, an app-server protocol, and job lifecycle management. Prefer it over raw `codex review` when available.

### Discovery

The companion script resolves its own `ROOT_DIR` via `import.meta.url`, so it works from any cwd. Search known install locations:

```bash
CODEX_COMPANION=""
setopt NULL_GLOB 2>/dev/null  # zsh: suppress "no matches found" when globs miss
for d in ~/.claude/plugins/marketplaces/*/plugins/codex/scripts/codex-companion.mjs \
         ~/.claude/repos/*/plugins/codex/scripts/codex-companion.mjs; do
  [ -f "$d" ] && CODEX_COMPANION="$d" && break
done
unsetopt NULL_GLOB 2>/dev/null
```

### Invocation

```bash
# Structured JSON review of branch vs main
node "$CODEX_COMPANION" adversarial-review -C "$PWD" --json --base main

# With user focus text
node "$CODEX_COMPANION" adversarial-review -C "$PWD" --json --base main "Check auth handling"

# Working tree (uncommitted changes)
node "$CODEX_COMPANION" adversarial-review -C "$PWD" --json --scope working-tree
```

### Output envelope

The `--json` flag produces a structured payload:

```json
{
  "result": {
    "verdict": "approve | needs-attention",
    "summary": "1-2 sentence assessment",
    "findings": [
      {
        "severity": "critical | high | medium | low",
        "title": "Short name",
        "body": "WHAT breaks, SCENARIO, IMPACT",
        "file": "path/to/file",
        "line_start": 10,
        "line_end": 25,
        "confidence": 0.85,
        "recommendation": "Concrete fix"
      }
    ],
    "next_steps": ["actionable step"]
  }
}
```

### Requirements

- **Codex CLI must be authenticated**: the companion script delegates to `codex review` internally, so `codex login` is required.
- **Node.js**: the companion is an `.mjs` file, requires `node` in PATH.

If the companion isn't found, fall back to raw `codex review` (unstructured text output).

## Core Principle

Use the `codex-plugin-cc` companion script for structured JSON reviews when available. Fall back to `codex review` for git-aware code reviews. Use `codex exec -s read-only` for freeform analysis, with content piped in or named by file path, `</dev/null` when nothing is piped, and stderr captured for the session id. Use `gemini -p` with `< file` redirection for content analysis.
