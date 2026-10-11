# Trace requirements to the change

Use when: you must check that a change does everything the task, ticket, or plan asked for, and nothing it did not.

This is a requirements trace: each requirement maps to the code that implements it and a test that proves it.
It answers "did we build what was asked", not "is the code buggy".

1. Find the source of truth: the ticket, the issue, the plan, or the user's request. Quote it.
   If none exists in writing, write the requirements you infer and ask the user to confirm them.
2. Split it into numbered requirements, one testable behavior each. Include stated acceptance criteria and edge cases.
3. Get the change: `git diff <base>...HEAD --stat` plus uncommitted changes (`git status --porcelain`).
4. For each requirement, find the code that implements it (file and line) and the test that exercises it.
   Run that test. A requirement with code but no test is unproven.
5. Check change completeness for the parts that are easy to forget:
   - Routes: new endpoints registered, removed endpoints cleaned up.
   - Environment: new env vars documented in `.env.example` or the README, removed ones deleted.
   - Database: model changes have migrations, new foreign keys have indexes.
   - Exports: new modules exported from index or barrel files, removed ones cleaned out.
   - Docs: README, API docs, and CHANGELOG match the change.
   - Renamed files: companion CSS, test, and story files renamed too.
6. List extra work: changes that map to no requirement. Extra work is a finding, not a bonus.
7. Run the full check (tests, build, typecheck) once and record the result.

Stop / report: a table with one row per requirement (requirement, code location, test, status DONE, PARTIAL,
or MISSING), the completeness categories as PASS, FAIL, or N/A with evidence, the extra work,
and an overall verdict: VALIDATED, NEEDS FIXES, or PARTIAL.

Source: Gotel & Finkelstein, "An analysis of the requirements traceability problem", ICRE 1994; arXiv:2601.15195 (unmerged agent PRs often fail CI despite completion claims).
