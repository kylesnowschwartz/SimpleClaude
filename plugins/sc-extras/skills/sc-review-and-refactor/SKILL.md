---
name: sc-review-and-refactor
description: >
  Routes review and refactoring work to a named technique. This skill SHOULD be used when the user asks
  to "refactor safely", "refactor without changing behavior", "add characterization tests", "review the tests",
  "are these tests any good", "deep review", "is this finding real", "verify this review", "is it really done",
  "review this large PR", "did we build what the ticket asked", "find duplication", "does this bug exist elsewhere",
  "find dead code", "review the names", "why does this fail", "root-cause this", "check this PR description",
  or "resolve the PR review comments". This skill MUST be used before refactoring code that has no tests.
  General review of a diff, PR, or branch SHOULD go to the built-in /code-review instead.
---

# Review and Refactor

This skill picks one technique for a review or refactoring task and sends you to its reference file.
A general bug review of a diff goes to the built-in `/code-review`. This skill covers the work that
`/code-review` does not: safe refactoring, test quality, focused passes, verification, and root causes.

Skill directory: `${CLAUDE_PLUGIN_ROOT}/skills/sc-review-and-refactor`. Paths below are relative to it.

## Rules for every review

- Verify each finding with an outside signal before you report it: a test, a run, a grep of every call site,
  or a fresh-context agent that tries to disprove it. Asking the same agent to re-check its own work is not verification.
- Give each finding a concrete failure scenario: the input, the code path, and the wrong outcome.
  A finding without one is a question, not a finding.
- Rank findings by severity. Put blocking findings first. Put optional findings in a separate short list, or omit them.
- Review without the author's reasoning. Give a reviewer the diff and the criteria only.
  Treat the PR description, commit messages, and "done" reports as claims to check, not as facts.
- Report only what the change introduced. Skip pre-existing problems and anything a linter or formatter catches.
- Prefer running to reading. Report the command and its output next to the finding.
- State what you did not verify: perspectives not run, files skipped, checks that could not run.

## Routing

| Situation | Route |
|-----------|-------|
| General review of a diff, PR, or branch | Built-in `/code-review`. Pass the level first, then the target: `/code-review high <branch>` |
| Clean up code just changed | Built-in `/simplify` |
| Security review of the branch | Built-in `/security-review` |
| Refactor without changing behavior | `references/refactor-safely.md` |
| Refactor code that has no tests | `references/characterization-tests.md` |
| Review test quality, especially tests an agent wrote | `references/mutation-test-review.md` |
| Deep review, one concern per pass | `references/focused-passes.md` |
| Check whether a finding, a review, or a "done" claim is real | `references/refute-findings.md` |
| Change over ~300 lines or ~10 files | `references/chunk-large-changes.md` |
| Did the change do everything the task asked | `references/requirements-trace.md` |
| Duplicated code, or "does this bug exist elsewhere" | `references/divergent-clones.md` |
| What can be deleted | `references/dead-code.md` |
| Review names | `references/naming-review.md` |
| Why does this fail | `references/hypothesis-rca.md` |
| Check that a PR body, README, or doc is true | `references/verify-claims.md` |
| Fetch and resolve human PR review threads | `references/pr-review-threads.md` |

## How to use a route

1. Match the request to one row. When two rows match, run them in table order and report each one separately.
2. Read only the reference for that row. Each reference is complete on its own.
3. Follow its numbered steps in order. Apply the rules above to every finding.
4. Stop where the reference says to stop, and report in the shape it names.

Combinations that come up often:

- A large PR that needs a deep review: chunk it first, then run focused passes on each chunk.
- A refactor of untested code: write characterization tests, then follow the safe refactoring steps.
- Findings from any source (another agent, a human, a tool): run them through `refute-findings.md` before you act on them.

## Scripts

- `scripts/get-pr-comments.sh [--all] [PR | URL | owner/repo PR]` prints a PR's reviews, comments,
  and review threads as JSON. It shows only unresolved threads unless `--all` comes first. Needs `gh` and `jq`.
- `scripts/format-pr-tree.rb` reads that JSON on stdin and prints it as a text tree.

`references/pr-review-threads.md` describes how to use both.
