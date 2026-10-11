# Deep review with one concern per pass

Use when: a risky change needs more than one general review, or the user names a concern
(concurrency, migrations, performance, API compatibility, operations).

The method is perspective-based reading: each reviewer takes one defect class or one stakeholder role,
answers one question, and the results are merged. A generic checklist does not find more defects than no checklist.

1. Pick 2-4 perspectives for this change. Give each one concrete question. Examples:
   - Data flow: where can a value be nil, stale, or unvalidated?
   - State and concurrency: which ordering of events breaks this?
   - Failure and operations: what happens on timeout, retry, partial write, or restart?
   - API consumer: which call that worked yesterday breaks today?
   - Performance: what grows with input size?
   - Change completeness: is every new route, env var, migration, export, doc, and renamed companion file wired up?
2. Run each perspective as a separate subagent with a fresh context. Give it the diff, read access to the repo,
   and only its own question. Do not give it the other perspectives, the PR description, or the author's reasoning.
3. Each pass returns findings as: location, failure scenario (input, path, wrong outcome),
   evidence (line, trace, or test output), and confidence from 0 to 100.
4. Merge the results. Combine duplicates. A finding from two perspectives gains confidence.
5. Verify every merged finding with `refute-findings.md`. Drop the ones that fail.
6. Rank the rest by severity, then confidence. Put blocking findings first. Put nits in a separate list or omit them.

Stop / report: the findings in rank order, the findings dropped by verification (one line each),
and the list of perspectives that ran, including the ones that found nothing.

Source: Porter, Votta & Basili, IEEE TSE 1995 (scenario-based reading found ~35% more defects than checklists); Laitenberger et al., Bosch study (perspective-based reading beat checklists on code); arXiv:2509.01494 (SWR-Bench, aggregating reviews raised F1).
