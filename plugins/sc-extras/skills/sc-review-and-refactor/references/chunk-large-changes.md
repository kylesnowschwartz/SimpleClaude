# Review a large change in chunks

Use when: a diff is over ~300 changed lines or ~10 files, or covers more than one concern.

Review accuracy falls sharply as diff size grows. Split the change into units of one concern,
review each unit on its own, then review the places where units meet.

1. Measure first: `git diff --stat <base>...HEAD`. Under ~300 lines and one concern: use `/code-review` directly.
2. Split the diff into units of one concern each: a module, a layer, or a commit if the commits are clean.
   Aim for under 300 lines per unit.
3. Put generated files, vendored code, and lockfiles in their own unit. Check that unit by `--stat` only.
4. Review each unit in a fresh subagent with only that unit's diff and read access to the repo,
   or run `/code-review high <path>` on that unit. Record findings per unit.
5. Run one more pass on the seams between units: new or changed interfaces, call sites outside the diff,
   migrations and the code that reads them, config and the code that consumes it.
6. Merge findings and combine duplicates. Verify each finding with `refute-findings.md`. Rank by severity.
7. If the change cannot be split into independent units, report that as a finding about the change's shape.

Stop / report: the unit list with line counts, findings per unit, seam findings,
and every part you did not review (generated code, files that only moved).

Source: arXiv:2606.15689 ("Bigger Isn't Always Better": F1 0.657 under 10 lines, 0.043 over 150); di Biase et al., PeerJ CS 2019, arXiv:1805.10978 (split changes produce fewer false reports); Barnett et al., ICSE 2015 (ClusterChanges).
