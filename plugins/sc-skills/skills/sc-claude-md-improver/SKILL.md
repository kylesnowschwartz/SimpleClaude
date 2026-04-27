---
name: sc-claude-md-improver
description: Audit and improve project memory files (CLAUDE.md, AGENTS.md, .claude.local.md) — assess against a quality rubric, then apply additions and removals. This skill SHOULD be used when the user asks to audit, improve, edit, fix, tighten, rewrite, or update a memory file, or to check whether one is too long, stale, or bloated.
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

Claude auto-discovers CLAUDE.md files in parent directories. Claude Code does not currently read AGENTS.md natively — projects depending on it should symlink (`ln -s CLAUDE.md AGENTS.md`).

**If no memory files are found**, surface that to the user and offer to scaffold one — point at `references/templates.md` (the pointer-style root template is the recommended starting point for monorepos and large codebases). Do not silently proceed with no audit target.

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

**Two strong anti-criteria** (these *lower* the score):
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

**If the user rejects all proposed diffs**, acknowledge in one line and stop. Do not re-propose, soften, or iterate on the same audit; the user's call stands.

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

**Keep additions minimal.** Avoid restating what is obvious from the code, generic best practices already covered by tooling, one-off fixes unlikely to recur, verbose explanations when one line will do, and embedding long files via `@`-references when a path pointer suffices.

**Show diffs.** For each change, show the file (and whether it's symlinked), the specific edit, and a brief reason — for additions, why the line earns its place; for removals, why it was costing more than it earned.

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

After user approval, apply each accepted diff using the Edit tool, in the order they appeared in the report.

- **Symlinked files**: edit the symlink *source* — the link reflects the change automatically. Never edit through the link.
- **Partial acceptance**: if the user accepts only some diffs, skip the rest silently; do not re-propose.
- **Removals**: apply with Edit using the line(s) to cut as `old_string` and an empty (or replacement) `new_string`. Removals count as edits — track them the same way.
- **Multi-file**: when several files have accepted diffs, apply each file's edits as a contiguous batch before moving to the next file.

After applying, run a short verification: re-read each modified file, confirm the diffs landed, and report a one-line summary per file (`./CLAUDE.md: 3 cuts, 1 addition`).

## After the Audit

Three reminders that apply across the workflow:

- **Displacement test applies to existing lines, not just additions.** If a pre-existing line cannot defend its place, propose cutting it.
- **`#`-added lines are draft content.** The shortcut adds material on the fly without curation; HumanLayer cites measured *negative* effect on benchmarks. Treat any `#`-added line as draft and prune within the same session.
- **Subdirectory CLAUDE.md is preferred over root bloat.** Claude auto-loads them contextually — for monorepos and large codebases, push package- or domain-specific guidance down into the relevant directory rather than enlarging the root file.

Templates by project type — including the **pointer-style root** (~30 lines) the research most strongly endorses for monorepo roots — are in [references/templates.md](references/templates.md).

## Length Discipline

Specific line caps (30 / 60 / 150 / 200 / 300) circulating in community guides are folklore — no controlled study has settled on a threshold. The *direction* is empirically supported (Chroma's *Context Rot*; Liu et al., *Lost in the Middle*, TACL 2024): shorter is better, attention degrades with input length, and middle-of-file content is systematically under-attended.

**Working default: ≤200 lines for project root.** If exceeding, justify each section against the displacement test: *would the file work as well, or better, without this content?*
