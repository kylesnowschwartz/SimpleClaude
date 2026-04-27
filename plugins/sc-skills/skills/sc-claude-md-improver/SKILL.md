---
name: sc-claude-md-improver
description: Audit and improve project memory files (CLAUDE.md and AGENTS.md). This skill SHOULD be used when the user asks to write, edit, or audit CLAUDE.md or AGENTS.md files.
---

# Project Memory File Improver

Audit and improve project memory files — primarily CLAUDE.md, but also AGENTS.md where present. The discipline is *removal* as much as addition: Chroma's 2025 *Context Rot* study (18 frontier models including Claude Opus 4 / Sonnet 4) showed every model degrades as input grows, and even a single distractor measurably reduces retrieval. Treat the file as hot-cache, not constitution.

**This skill writes to memory files.** After producing an audit report and getting user approval, it applies targeted edits — both additions and removals.

If multiple memory files exist in the codebase, ask the user whether to audit a single file or all of them.

**AGENTS.md is a first-class concern alongside CLAUDE.md** even though Claude Code does not currently read AGENTS.md natively (confirmed as of 2026-04). Other coding tools (GitHub Copilot, Codex) do read it, so projects often maintain both — and the two files are frequently symlinked together. **Always check for symlinks before editing** so you don't write the same content twice via two paths.

## Workflow

### Phase 1: Discovery

Find all memory files in the repository, then check whether any are symlinks:

```bash
# Find both CLAUDE.md and AGENTS.md, including dot-prefixed local variants
find . \( -name "CLAUDE.md" -o -name ".claude.md" -o -name ".claude.local.md" \
  -o -name "AGENTS.md" -o -name ".agents.md" \) 2>/dev/null | head -50

# Detect symlinks — if AGENTS.md and CLAUDE.md are linked, edit only the source
find . \( -name "CLAUDE.md" -o -name "AGENTS.md" \) -exec ls -la {} \; 2>/dev/null
```

**File Types & Locations:**

| Type | Location | Purpose |
|------|----------|---------|
| Project root CLAUDE.md | `./CLAUDE.md` | Primary Claude Code context (checked into git) |
| Project root AGENTS.md | `./AGENTS.md` | Cross-tool agent context per [agents.md](https://agents.md) spec; often symlinked to CLAUDE.md |
| Subdirectory CLAUDE.md | Any nested location | Loaded contextually when Claude works in that path — strongly recommended for monorepos and large codebases |
| Local overrides | `./.claude.local.md` | Personal/local settings (gitignored, not shared) |
| Global defaults | `~/.claude/CLAUDE.md` | User-wide defaults across all projects |

**Notes:**
- Claude auto-discovers CLAUDE.md files in parent directories — useful for monorepo and subdirectory patterns.
- **Claude Code does not currently read AGENTS.md natively.** If a project depends on Claude reading AGENTS.md, symlink it: `ln -s CLAUDE.md AGENTS.md` (or vice versa, depending on which is canonical).

### Phase 2: Quality Assessment

For each memory file, evaluate against quality criteria. See [references/quality-criteria.md](references/quality-criteria.md) for the detailed rubric.

**Quick Assessment Checklist:**

| Criterion | Weight | Check |
|-----------|--------|-------|
| Attention economy | High | Could each line be cut without harm? Is each one earning its share of finite attention budget? |
| Pointer discipline | High | Are long docs referenced via path, not embedded via `@file`? |
| Lint/test overlap | High | Does any rule duplicate what a linter, type-checker, or test already enforces? |
| Commands/workflows | High | Are build/test/deploy commands present and copy-pasteable with exact flags? |
| Non-obvious patterns | Medium | Are gotchas, ordering dependencies, and project-specific quirks documented? |
| Universality | Medium | Are rules universally applicable, or task-specific edge-cases that distract during other work? |
| Currency | High | Do documented commands and paths still work? |

**Two strong anti-criteria to watch for** (these *lower* the score):
- High-level project description the model could derive from the codebase ("React project," "monorepo with packages/")
- Auto-generated content that has not been curated (HumanLayer cites measured negative effect on benchmarks)

### Phase 3: Audit Report Output

**ALWAYS output the audit report BEFORE making any updates.**

Format:

```
## Memory File Audit Report

### Summary
- Files found: X (with symlink relationships noted if any)
- Total lines across files: X
- Files needing changes: X

### File-by-File Assessment

#### 1. ./CLAUDE.md (Project Root)

| Criterion | Notes |
|-----------|-------|
| Attention economy | ... |
| Pointer discipline | ... |
| Lint/test overlap | ... |
| Commands/workflows | ... |
| Non-obvious patterns | ... |
| Universality | ... |
| Currency | ... |

**Lines to cut:**
- [Specific lines that fail one of the criteria or hit an anti-criterion]

**Lines to add:**
- [Specific additions, with reasoning]

**Lines to convert to pointers:**
- [Long content that should reference a path instead of embedding]

#### 2. ./AGENTS.md (symlink → ./CLAUDE.md)
[Note: edits to one apply to the other; report once.]

...
```

### Phase 4: Targeted Updates

After outputting the audit report, ask the user for confirmation before applying changes. Both **removals** and **additions** are first-class — removals are often higher-yield.

**Propose targeted removals.** The four highest-yield removal categories:

1. **Rules a linter, type-checker, or test already enforces.** "Never send an LLM to do a linter's job." (HumanLayer.)
2. **Task-specific instructions not universally applicable.** Instructions on (e.g.) how to scaffold a DB schema "won't matter and will distract the model when you're working on something else." (HumanLayer.)
3. **High-level project descriptions the model can derive from the codebase.** (XDA Developers; GitHub blog's 2,500-repo analysis.)
4. **Brittle if-else logic and exhaustive edge-case lists.** Diverse, canonical examples beat exhaustive enumeration. (Anthropic, *Effective context engineering*, Sept 2025.)

**Propose targeted additions.** Focus on genuinely useful, project-specific information:

- Commands or workflows discovered during analysis
- Gotchas or non-obvious patterns found in code
- Package relationships not clear from imports
- Configuration quirks (env vars, build-time vs runtime, IPv6 suffixes, etc.)
- Pointers to deeper documentation (`for X, see path/to/X.md`)

**Keep additions minimal.** Avoid:

- Restating what is obvious from the code
- Generic best practices already covered by tooling
- One-off fixes unlikely to recur
- Verbose explanations when one line will do
- Embedding long files via `@`-references when a path pointer suffices

**Show diffs.** For each change, show:

- Which file to update (and whether it is symlinked, so the change reaches both)
- The specific edit (as a diff or quoted block)
- Brief explanation of why the line earns its place — or, for a removal, why the line was costing more than it earned

**Diff Format:**

```markdown
### Update: ./CLAUDE.md

**Why:** Build command was missing; future sessions had to inspect package.json each time.

```diff
+ ## Quick Start
+
+ ```bash
+ npm install
+ npm run dev  # Start development server on port 3000
+ ```
```
```

### Phase 5: Apply Updates

After user approval, apply changes using the Edit tool. Preserve existing content structure. **If files are symlinked, edit only the source** — the link will reflect the change automatically.

## Templates

See [references/templates.md](references/templates.md) for memory file templates by project type, including the **pointer-style template** (~30 lines) the research most strongly endorses for monorepo roots.

## Common Issues to Flag

1. **Stale commands** — build/test commands that no longer work
2. **Outdated paths** — references to files or folders that have moved or been deleted
3. **Lint-duplicating style rules** — rules a linter or formatter already enforces
4. **Auto-generated sections** — content added via the `#` shortcut without curation (HumanLayer cites measured negative effect)
5. **Verbose prose** — paragraphs where one line would suffice
6. **Rules without a stated *why*** — instructions whose reasoning is opaque, making it impossible to judge edge cases
7. **High-level overview prose** the model can derive from the codebase
8. **`@file` embedding of long documents** — prefer a path pointer

## User Tips to Share

When presenting recommendations, tell users:

- **Beware auto-incorporation.** The `#` shortcut adds content during a session but does not curate it. Treat any `#`-added line as draft and prune within the same session — HumanLayer cites cases where AI-authored memory content produced *negative* effect on benchmarks.
- **Keep it terse.** Memory files are not constitutions. Default direction: shorter, denser, more specific. (See [references/quality-criteria.md](references/quality-criteria.md) for the displacement test.)
- **Actionable commands.** Documented commands should be copy-paste ready with exact flags.
- **Use `.claude.local.md`** for personal preferences not shared with the team (add to `.gitignore`).
- **Global defaults** belong in `~/.claude/CLAUDE.md`; project-specific facts in the project file.
- **Subdirectory CLAUDE.md** files load contextually — strongly recommended for large codebases and monorepos.
- **AGENTS.md and CLAUDE.md are often symlinked.** Decide which is canonical and link the other; Claude Code does not yet read AGENTS.md natively.

## What Makes a Great Memory File

**Lead with the right altitude** (Anthropic, *Effective context engineering*): specific enough to guide a session, general enough to survive the next refactor. Brittle if-else logic and exhaustive edge-case enumeration fail this test; "diverse, canonical examples" pass it.

**Minimum viable sections** — start here, add more only with stated reason:

- Commands (build, test, dev — copy-paste ready, exact flags)
- Gotchas (non-obvious quirks, ordering dependencies, common mistakes)

**Opt-in sections** (include only if load-bearing):

- Architecture (only if relationships are not obvious from imports / file layout)
- Key Files (only if entry points are not conventionally named)
- Code Style (only for project-specific conventions a linter does not catch)
- Environment (only for non-obvious required vars or setup)
- Testing (only for project-specific patterns)
- Workflow (only for project-specific decision rules)

## Length Discipline

Specific line caps (30 / 60 / 150 / 200 / 300) circulating in community guides are folklore — no controlled study has settled on a threshold. The *direction* is empirically supported (Chroma's *Context Rot*; Liu et al., *Lost in the Middle*, TACL 2024): shorter is better, attention degrades with input length, and middle-of-file content is systematically under-attended.

**Working default: ≤200 lines for project root.** If exceeding, justify each section against the displacement test: *would the file work as well, or better, without this content?*
