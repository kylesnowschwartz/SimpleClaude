---
description: Install sc-skills bundled rule files into project or user rules directory
allowed-tools: Bash, Read, Write, Glob
---

# /sc-install-rules

Install SimpleClaude's bundled rule files into Claude Code's rules system. Rules auto-load based on file context (via `paths:` frontmatter), bypassing the skill-trigger-phrase failure mode for file-type-bound guidance.

## Available rules

Source: `${CLAUDE_PLUGIN_ROOT}/rules/*.md`

Current bundle:

- `effective-go.md` — Go idioms and conventions (paths: `**/*.go`)
- `effective-neovim.md` — Neovim plugin style (paths: `**/*.lua`, `**/lua/**/*`)
- `frontend-design.md` — Distinctive frontend aesthetics (paths: tsx/jsx/astro/vue/svelte/html/css/scss)
- `philosophy-of-software-design.md` — Ousterhout's design principles (paths: common code files)
- `art-of-readable-code.md` — Boswell/Foucher readability guidelines (paths: common code files)

## Install flow

Execute the following steps:

1. **Enumerate bundle.** List every `.md` in `${CLAUDE_PLUGIN_ROOT}/rules/` with its `paths:` frontmatter so the user sees what will install.

2. **Ask destination** (default: user-level, since the bundled rules are language/framework-scoped and apply across projects):
   - User-level: `~/.claude/rules/` — applies to all projects
   - Project-level: `.claude/rules/` — scoped to current project (check in git if appropriate)

3. **Ask selection.** Offer `all` (default), `none`, or a space-separated list of rule names (e.g. `effective-go frontend-design`).

4. **For each selected rule:**
   - Compute target path: `<dest-dir>/<rule-name>.md`
   - If target does NOT exist: copy source → target
   - If target EXISTS: show a diff summary, ask the user overwrite/skip
   - Never silently overwrite

5. **Report** what was installed, skipped, or overwritten. Remind the user that rules auto-load — no restart needed.

## Constraints

- Use `Bash` only for `mkdir -p` of the destination directory and for simple file copy verification. Use `Read` + `Write` for the actual copy so frontmatter is preserved exactly.
- Never write to system paths or outside the chosen destination.
- If `${CLAUDE_PLUGIN_ROOT}/rules/` is empty, say so and exit.
- If the user's Claude Code version doesn't support rules (unlikely but worth a sanity check), warn but proceed — installing unused markdown is harmless.

## Updating later

Re-running `/sc-install-rules` after the plugin updates will detect existing installs and prompt overwrite per-file. No automatic merge — if the user has hand-edited a rule, they say "skip" to keep theirs.
