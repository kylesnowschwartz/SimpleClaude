# Characterization tests before a refactor

Use when: the code to refactor has no tests, weak tests, or no clear definition of "same behavior".

The method is Feathers' characterization test: a test that pins what the code does today, bugs included.
An approval test (also called a golden-master test) does the same for large outputs.

1. Find the seams: the narrowest public entry points of the code you will change.
   Examples: a function, a CLI command, an HTTP handler, a module API.
2. For each seam, write a test that calls it with normal inputs and edge inputs and asserts what it returns today.
3. Do not fix bugs you notice. Assert the current behavior and write the bug in a list.
4. For large outputs (rendered text, JSON, generated files), use an approval test.
   Capture the output once, commit the capture, and fail on any difference.
   Tools: ApprovalTests, Verify, Jest snapshots, syrupy, or a plain fixture file.
5. Run the new tests against the unchanged code. Every test must pass.
   A failing test means the capture is wrong, not that you found a bug.
6. Run coverage or a tracer. Confirm the tests execute every branch you plan to change.
   Add inputs until they do.
7. Show the captures and the bug list to the user. Mark any captured behavior that looks accidental.
   The user decides whether it is a contract. Do not approve your own captures.
8. Refactor with `refactor-safely.md`. The characterization tests are the pass/fail signal.
9. After the refactor, decide per test: keep it as a regression test, rewrite it as a test that names
   the intended behavior, or delete it if the refactor made it redundant.

Stop / report: list the seams, the tests added, the branch coverage of the code to change,
the captured behaviors that look accidental, and the bug list. Wait for the user before you refactor.

Source: Feathers, *Working Effectively with Legacy Code*, 2004, ch. 13; Liu et al., *Automated Software Engineering* 2025 (about 7% of LLM refactorings changed behavior).
