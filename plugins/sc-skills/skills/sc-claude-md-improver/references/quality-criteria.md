# Memory File Quality Criteria

The rubric below scores **displacement risk**, not coverage. Every line in a CLAUDE.md / AGENTS.md competes for the model's finite attention budget; a line earns its place by paying back more than it costs. Coverage-style rubrics (the older "did you document architecture?" style) reward bloat; this one does not.

## The displacement test

For every line in the file, ask: *would the file work as well, or better, without this content?* If yes, the line is costing more than it earns.

## Scoring Rubric

### 1. Attention economy (20 points)

**20 points**: Every line earns its place. No filler. No restatement of the obvious. No prose where a one-liner would do.

**15 points**: Mostly dense; one or two paragraphs could be cut.

**10 points**: Several sections of low-value prose; clear bloat.

**5 points**: Mostly filler.

**0 points**: A wall of text the model must read every turn.

> Empirical anchor: Chroma's *Context Rot* (2025) showed every frontier model degrades as input grows; Liu et al.'s *Lost in the Middle* (TACL 2024) showed >30% accuracy drop for content in middle positions.

### 2. Pointer discipline (15 points)

**15 points**: Long content is referenced via path pointer (`for X, see docs/Y.md`), not embedded. `@file` references are reserved for short, hot-path content.

**10 points**: Mostly pointer-based; one or two long embeddings.

**5 points**: Most long content is embedded inline.

**0 points**: Whole documents pulled in via `@` on every turn.

> Empirical anchor: Shrivu Shankar, *How I Use Every Claude Code Feature*. Path pointers let the model fetch just-in-time; embeddings load every turn.

### 3. Lint / test overlap (15 points)

**15 points**: No rule duplicates what a linter, formatter, type-checker, or test enforces.

**10 points**: One or two style rules a linter could catch.

**5 points**: Significant duplication — a section's worth of style rules a linter already enforces.

**0 points**: The file is largely an LLM-flavoured `.eslintrc`.

> Empirical anchor: HumanLayer, *Writing a good CLAUDE.md*. "Never send an LLM to do a linter's job."

### 4. Commands / workflows (15 points)

**15 points**: Essential commands are present, copy-pasteable, with exact flags. Specifies stack versions where they matter (`React 18 with Vite`, not "React project").

**10 points**: Most commands present; some lack specific flags.

**5 points**: A few commands; vague or out of date.

**0 points**: No commands documented.

> Empirical anchor: GitHub blog, *How to write a great agents.md (2,500-repo analysis)*. Concrete `uv run pytest tests/unit/test_handlers.py` beats "run the usual tests."

### 5. Non-obvious patterns (15 points)

**15 points**: Gotchas, ordering dependencies, edge-case workarounds, and the *why* behind unusual patterns are documented.

**10 points**: Some patterns documented.

**5 points**: Minimal pattern documentation.

**0 points**: No gotchas or quirks captured.

### 6. Universality (10 points)

**10 points**: Rules are universally applicable across the codebase. No task-specific edge-cases that would distract during unrelated work.

**7 points**: Mostly universal; a few task-specific stragglers.

**3 points**: Significant task-specific instruction noise.

**0 points**: The file reads as a stack of past tickets.

> Empirical anchor: HumanLayer; Anthropic, *Effective context engineering* (Sept 2025). Task-specific rules "won't matter and will distract the model when you're working on something else."

### 7. Currency (10 points)

**10 points**: Reflects current codebase. Commands work as documented. File references accurate. Tech versions current.

**7 points**: Mostly current; minor staleness.

**3 points**: Several outdated references.

**0 points**: Severely outdated.

## Assessment Process

1. Read the memory file completely.
2. Cross-reference with actual codebase:
   - Run documented commands (mentally or actually).
   - Check that referenced files exist.
   - Verify architecture / module descriptions against current layout.
3. Apply the displacement test to each line: *would the file work as well without it?*
4. Score each criterion.
5. List specific lines to **cut**, **add**, and **convert to pointers**.

## Red Flags

- **Auto-generated sections** added via the `#` shortcut without curation. (HumanLayer cites measured negative effect on benchmarks.)
- **Long high-level prose** describing what the codebase already shows ("React project," "monorepo with packages/").
- **`@file` embedding of long documents** instead of path-pointer references.
- **Commands that would fail** (wrong paths, missing deps, retired flags).
- **References to deleted files / folders.**
- **Outdated tech versions.**
- **Copy-paste from templates** without project-specific customisation.
- **Generic best-practice advice** not specific to the project.
- **"TODO" items never completed.**
- **Duplicate content across multiple memory files** (especially when CLAUDE.md and AGENTS.md are both maintained but not symlinked).
- **Style rules a linter or formatter already enforces.**
- **Task-specific edge-case rules** preserved long after the task shipped.
