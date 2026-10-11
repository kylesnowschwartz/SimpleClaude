# Review test quality with mutation testing

Use when: you must judge whether tests can catch bugs, especially tests an agent wrote for code it also wrote,
or before you refactor against a test suite.

Mutation testing judges a test suite by whether it fails when you inject a fault (a mutant). Coverage does not measure this.

1. Run the stack's mutation tool if there is one: mutmut (Python), Stryker (JS/TS, C#), PIT (Java),
   mutant (Ruby), cargo-mutants (Rust), go-mutesting (Go). Limit it to the files under review.
   Report the mutation score per file.
2. No tool? Inject 5-10 mutants by hand into the code under test, one at a time:
   flip a condition, move a boundary by one, drop a nil or null check, swap two return values, delete a call.
   Run the suite after each one, then revert it. A mutant that survives is a finding.
3. Read every assertion. Flag assertions that cannot fail (`x == x`, truthy checks on an object that is never nil),
   tests that only assert "no exception", mock assertions that repeat the setup, and snapshots nobody checked.
4. Flag expected values copied from the implementation's output. They make current bugs the expected result.
   Check each expected value against the spec or a hand calculation.
5. Check that each test covers one behavior and its name says which. `test_function_works` is a finding.
6. Check boundaries where the code has a branch: empty, one, many, maximum, negative, unicode, timeout, concurrent calls.
   A branch with no boundary test is a finding.
7. Do not report coverage percentage as a measure of quality.

Stop / report: the mutation score per file, each surviving mutant with file and line, each weak assertion
with file and line, and the three tests to add first.

Source: Just et al., FSE 2014 (mutant detection correlates with real-fault detection); Meta ACH, arXiv:2501.12862; DeCon, arXiv:2501.02901 (over 62% of LLM-written assertions incorrect).
