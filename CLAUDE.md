# CLAUDE.md

This file provides guidance to [Claude Code](https://github.com/anthropics/claude-code) when working with code in this repository.

## Critical Rules

- **important** `plugins/` contains all SimpleClaude plugins (sc-core, sc-hooks, sc-output-styles, sc-extras, sc-skills, sc-refactor, sc-mods)
- Command changes: update commands consistently across all 4+1 core-commands (sc-plan, sc-work, sc-explore, sc-review, sc-workflow)
- Plugin structure: Each plugin in `plugins/` has `.claude-plugin/plugin.json`, plus optional `commands/`, `agents/`, `hooks/`, `output-styles/` directories
- Description metadata: Use RFC 2119 obligation language (uppercase SHOULD/MUST) in `description` fields of SKILL.md and agent frontmatter to signal activation intent to AI agents

## Build Commands

- Preview installation: `./scripts/install.rb --dry-run`
- Install: `./scripts/install.rb` (Interactive with prompts, backs up existing configuration)

## Testing

SimpleClaude's test surface lives in the `test/` directory plus syntax checks:

```bash
# Syntax-check all hook Ruby files
just test

# Smoke test external CLI invocations (codex/gemini) — requires CLIs installed
./test/test_adversarial_cli_smoke.sh          # both
./test/test_adversarial_cli_smoke.sh codex    # codex only
./test/test_adversarial_cli_smoke.sh gemini   # gemini only

# Or via Justfile
just test-cli    # CLI smoke tests

# Lint the bottom-line-ste output style against ASD-STE100 — requires uv
just test-ste
```

`just test-ste` runs [stelint](https://pypi.org/project/stelint/) through `test/test_ste_lint.py`. It fails only on the rules in `GATED_RULES` (unapproved words, phrasal verbs, -ing forms, contractions, passive voice, and sentences over 20 words). It prints the count of other warnings as advisory, because those rules misfire on Markdown instruction files. `just test-ste --all` prints every warning. `test/ste/simpleclaude.jsonl` allows the technical words the style uses. To allow a new word, add it there with the value `"__REMOVE__"`.

`just test` runs `ruby -c` over every hook file to catch syntax errors. The CLI smoke test verifies codex/gemini produce real reviews (not plan-confirmation prompts or empty output).

## Architecture

SimpleClaude consists of these plugins:

- **sc-core**: Core framework with intent-based commands and specialized agents
- **sc-hooks**: Auto-formatting and lint checks (Stop), plus tool monitoring (PreToolUse: steers GitHub WebFetch to the `gh` CLI)
- **sc-output-styles**: Curated output styles — personality-driven (Linus, Austen, Lovelace, Ousterhout, Starfleet, Mayo Clinic) and structured formats (HTML, JSON, Markdown, Semantic Markdown, YAML)
- **sc-extras**: Utility commands for root cause analysis, claim verification, adversarial analysis, and context wizards
- **sc-skills**: Skills for mermaid diagrams, codebase pattern detection, hypothesis testing, Socratic thinking, file querying, frontend design, image generation, and command generation
- **sc-refactor**: PR review with ticket integration, codebase health checks, and specialized analysis agents for refactoring workflows
- **sc-mods**: Claude Code mods, written as a TypeScript hooks module (`hooks/hooks.json` lists `{"modules": [...]}`). Draws mermaid fences in replies as Unicode text by running the bundled merman-cli

**sc-mods binaries**: sc-mods runs vendored merman-cli binaries; see [Vendored merman binaries (sc-mods)](#vendored-merman-binaries-sc-mods).

**Lightweight agent architecture**: Commands spawn focused agents via `Task()` calls for token-efficient execution

- **Specialized agents**: sc-code-architect, sc-code-explorer, sc-code-reviewer, sc-research-github, sc-research-repo, sc-research-web
- Token-efficient through isolated agent contexts and focused task delegation

## Versioning

- Current version see file: VERSION
- Follow [SemVer](https://semver.org/): fix = patch, feat = minor, breaking = major
- **Assess each commit: does it warrant a release?** Bug fixes and new features should trigger releases
- Release process:
  1. Update README.md badge version
  2. Update CLAUDE.md version
  3. Update VERSION file
  4. Update `.claude-plugin/marketplace.json` (`metadata.version` + affected plugin versions in plugins array)
  5. Update `plugins/<plugin-name>/.claude-plugin/plugin.json` for affected plugins
  6. Commit: `git commit -m "chore: Bump version to vX.X.X"`
  7. Tag: `git tag vX.X.X`
  8. Push: `git push && git push --tags`
  9. Republish the `sc-mods-dist` branch at the new version (`just publish-mods`)

`just bump` covers steps 1 and 3-5 (it does not touch CLAUDE.md), and `just release` covers steps 6-9: after the tag is pushed it fetches the merman binaries and runs `just publish-mods`. If that publish fails, the release stays tagged and pushed, the recipe exits non-zero, and `just publish-mods` retries it.

## Vendored Dependencies

The `claude_hooks` gem is vendored into sc-hooks' `vendor/claude_hooks/` directory. No gem installation required for end users.

### Updating vendored claude_hooks

```bash
./scripts/vendor-claude-hooks.sh
```

This fetches the latest from the fork, strips dev files, and copies to each hook-enabled plugin. Commit the changes afterward.

### Check for updates without applying

```bash
./scripts/vendor-claude-hooks.sh --check
```

## Vendored merman binaries (sc-mods)

sc-mods draws mermaid diagrams by running [merman](https://github.com/Latias94/merman)'s `merman-cli`. The release binaries for macOS and Linux on arm64 and x86_64 live in `plugins/sc-mods/bin/` as `merman-cli_<os>_<arch>`, with merman's licenses in `plugins/sc-mods/bin/merman-licenses/`. They are gitignored on `main`. The committed `plugins/sc-mods/bin/merman-cli` launcher picks the binary for the machine it runs on. The pinned version is `MERMAN_VERSION` in `scripts/fetch-merman.sh`.

Installs of `sc-mods` come from the `sc-mods-dist` branch: the plugin tree as committed at `HEAD` plus the four binaries and the licenses, at the branch root, as one commit. `just publish-mods` (`scripts/publish-mods-dist.sh`) rewrites it, and every `just release` runs that publish. Never edit `sc-mods-dist` by hand. The marketplace's `sc-mods-dev` entry reads `./plugins/sc-mods` from the checkout instead. `just bump` sets the version on both entries.

### First-time setup

```bash
just fetch-merman
```

This downloads the pinned release, checks each archive against its published checksum, and extracts the binaries and licenses. It does nothing when they are already present.

### Check for updates

```bash
just check-merman
```

This prints the pinned and latest merman versions, exits 0 when they match and 1 when a newer release exists. It changes nothing.

### Upgrade merman

1. Edit `MERMAN_VERSION` in `scripts/fetch-merman.sh`
2. `just fetch-merman`
3. `just test-mods` and `just test-mods-real`
4. Check diagrams live in `claude --plugin-dir plugins/sc-mods`
5. Commit
6. Release (`just bump` then `just release`), which republishes `sc-mods-dist`

## Agent Tool Permissions

When defining `tools` in agent frontmatter, follow the principle of least privilege while keeping agents useful.

### Safe Tools (side-effect free)

These tools are safe to grant liberally - they read state but don't modify it:

| Tool | Purpose |
|------|---------|
| `Read` | Read file contents |
| `Grep` | Search file contents |
| `Glob` | Find files by pattern |
| `LS` | List directory contents |
| `NotebookRead` | Read Jupyter notebooks |
| `TodoWrite` | Track agent progress (helpful for complex tasks) |
| `WebSearch` | Search the web |
| `WebFetch` | Fetch web page content |
| `AskUserQuestion` | Request user input |
| `BashOutput` | Read background process output |
| `KillShell` | Terminate background processes |

### Restricted Tools (modify state)

Grant these only when the agent's purpose requires modification:

| Tool | Purpose | Grant when |
|------|---------|------------|
| `Write` | Create/overwrite files | Agent generates code/docs |
| `Edit` | Modify existing files | Agent refactors/fixes code |
| `NotebookEdit` | Modify Jupyter notebooks | Agent works with notebooks |
| `Bash` | Execute shell commands | Agent needs rg/fd/semtools/git |

### Special Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `Task` | Spawn sub-agents | Rarely needed in agents |
| `Skill` | Invoke skills | Rarely needed in agents |
| `SlashCommand` | Run slash commands | Rarely needed in agents |
| `ExitPlanMode` | Exit plan mode | Internal use |

### Recommended Sets

```yaml
# Analysis/Documentation/Research agents
tools: Bash, Read, Grep, Glob, LS, TodoWrite, WebSearch, WebFetch

# Test runner agents
tools: Bash, Read, Grep, Glob, TodoWrite

# Web-only research agents
tools: WebSearch, WebFetch, TodoWrite

# Generator agents (need to write files)
tools: Bash, Read, Write, Edit, Grep, Glob, LS, TodoWrite
```

## Development Workflow

- Commits: use conventional format (feat:, fix:, docs:, refactor:)
- Consider release for meaningful changes following SemVer practices
- Reference ./docs/AI_SLASH_COMMAND_CREATION_GUIDE.md if creating a new slash (/) command

### Local Plugin Dev Verification

#### End-to-end smoketest (full hook pipeline)

Creates a temp git project, runs Claude with the dev plugin, then verifies hooks fired via log files and file output. Must run from OUTSIDE a Claude session (use a separate terminal), or unset `CLAUDECODE`.

```bash
# 1. Create a throwaway git project
mkdir -p /tmp/hook-test && cd /tmp/hook-test
git init -q && echo "x = 1" > test.rb && git add -A && git commit -q -m "init"

# 2. Run Claude with the dev plugin
# env -u CLAUDECODE  prevents "nested session" error when run from a terminal
#                    that has CLAUDECODE set
env -u CLAUDECODE claude -p \
  "Write a Ruby file at /tmp/hook-test/greet.rb with contents: def greet; puts 'hello'; end" \
  --plugin-dir /path/to/SimpleClaude/plugins/sc-hooks \
  --setting-sources local \
  --verbose \
  --model haiku \
  --dangerously-skip-permissions \
  --max-turns 5

# 3. Verify hooks ran via log file (most reliable method)
# Session logs land in ~/.claude/logs/hooks/session-<id>.log
# The most recent file is the one you want:
# (`command ls` bypasses any shell alias like eza that doesn't accept `-t`)
cat "$(command ls -t ~/.claude/logs/hooks/session-*.log | head -1)"
# Look for: [AutoFormatHandler] Formatting ... with RuboCop
#           [LintCheckHandler] All lint checks passed

# 4. Verify the formatter actually changed the file
cat /tmp/hook-test/greet.rb
# Should show multi-line Ruby with frozen_string_literal (not the one-liner)

# 5. Verify RuboCop agrees
rubocop --format simple /tmp/hook-test/greet.rb

# 6. Clean up
rm -rf /tmp/hook-test
```

Key flags:

- **`env -u CLAUDECODE`**: Required when your terminal has `CLAUDECODE` set (e.g. running from inside a Claude session's terminal)
- **`--setting-sources local`**: Disables all user/marketplace plugins, loads ONLY `--plugin-dir` ones
- **`--plugin-dir`**: Loads the dev plugin from source (not the installed cache)
- **`--verbose`**: Required with `--output-format stream-json` in print mode
- **`--dangerously-skip-permissions`**: Skips tool permission prompts for non-interactive testing
- **`--max-turns N`**: Caps turns to prevent runaway sessions

Hook event visibility in `--output-format stream-json`:

- **SessionStart** hooks: visible as `hook_started`/`hook_response` events
- **Stop/PostToolUse** hooks: NOT visible as explicit events in stream-json. Verify via log files instead (`~/.claude/logs/hooks/`)

#### Ruby-level smoke tests (no Claude session needed)

```bash
# Syntax check all hook files
ruby -c plugins/sc-hooks/hooks/concerns/file_handler_support.rb
ruby -c plugins/sc-hooks/hooks/concerns/lint_runner_support.rb
ruby -c plugins/sc-hooks/hooks/handlers/auto_format_handler.rb
ruby -c plugins/sc-hooks/hooks/handlers/lint_check_handler.rb

# Load-test the require chain
ruby -e "require_relative 'plugins/sc-hooks/hooks/handlers/auto_format_handler'; puts 'OK'"
ruby -e "require_relative 'plugins/sc-hooks/hooks/handlers/lint_check_handler'; puts 'OK'"

# Integration test: run the Stop entrypoint with mock input
echo '{"session_id":"test","cwd":"/tmp","transcript_path":"/tmp/x","hook_event_name":"Stop","permission_mode":"default","stop_hook_active":false}' \
  | ruby plugins/sc-hooks/hooks/entrypoints/stop.rb 2>/dev/null
# Should output JSON with "suppressOutput":true, no "decision":"block"
```
