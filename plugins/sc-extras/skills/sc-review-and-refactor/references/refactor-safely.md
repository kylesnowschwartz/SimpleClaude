# Refactor without changing behavior

Use when: the task is to restructure, extract, rename, move, or clean up code, and behavior must stay the same.

The method is Fowler's: small named steps from the refactoring catalog, with the tests green after each step.

1. Find the check command. Look in CLAUDE.md, then the justfile, then package.json, Rakefile, or Makefile,
   then the language default (`pytest`, `go test ./...`, `cargo test`, `npm test`, `bundle exec rspec`).
   No tests cover the code you will change? Stop and follow `characterization-tests.md` first.
2. Run the check before you touch code. It must pass. Record the result as the baseline.
3. Name each step from Fowler's catalog: Extract Function, Inline Variable, Move Function, Rename Variable,
   Introduce Parameter Object, Replace Conditional with Polymorphism. If you cannot name a step, split it until you can.
4. Make one step. Run the check. Green: continue. Red: revert that step (`git checkout -- <files>`). Do not patch forward.
5. Do not edit test logic to make a test pass. A test that must change means the step changed behavior.
6. Keep public APIs, error types, and error messages the same unless the user approved a change.
7. Do not fix bugs inside a refactoring. Write each bug you find in a list. Fix it later in its own commit with its own test.
8. Touch only the code the request names. Write nearby smells in a follow-up list.
9. Keep refactoring commits separate from feature and bug-fix commits. Use the `refactor:` prefix.
   Keep each commit under ~200 changed lines. Commit only when the user asks.
10. Before you claim the code is "more readable", measure it before and after: function length,
    nesting depth, and cyclomatic complexity. If the numbers got worse, revert the step.
11. Stop and ask when the step touches a public API, when there are 5 or more candidate sites,
    or when the scope (one site or all sites) is unclear. Give 2-3 concrete options.

Large refactors that cannot finish green in one sitting: use the Mikado method. Write the goal as the root of a list.
Try the change, write each failure as a prerequisite under it, revert everything, then do the leaf prerequisites
one at a time, each in its own green commit.

Stop / report: after 5 failed attempts at one step, revert and report the blocker. Otherwise report each step
by its catalog name, the files it touched, the check result after it, the metrics before and after, and the bug and smell lists.

Source: Fowler, *Refactoring*, 2nd ed., 2018 (refactoring.com/catalog); Ellnestam & Brolund, *The Mikado Method*, 2014; Liu et al., *Automated Software Engineering* 2025 (unsafe LLM refactorings); arXiv:2605.22526 (tangled refactorings in agent patches).
