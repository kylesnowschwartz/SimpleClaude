# Verify the claims in a text

Use when: you must check that a PR description, README, ADR, changelog, research note, or an agent's summary is true.

The method is decompose-and-verify, as in FActScore: split the text into atomic claims,
gather evidence for each one, and judge each claim on its own.

1. Extract the claims. Write each as one sentence that states one fact and that evidence could check.
   Keep one claim per asserted fact, not one per clause; over-splitting inflates the count and hides what matters.
2. List opinions, plans, and hypotheticals separately as "not checkable". Do not verify them.
3. For each claim, name the evidence that would settle it: a file and line, a command and its output,
   a test, a URL, or a commit.
4. Gather that evidence. Prefer running to reading: run the command, run the test, open the URL.
   Quote the exact evidence next to the claim.
5. Give each claim one verdict:
   - SUPPORTED, with the evidence.
   - CONTRADICTED, with the evidence that contradicts it.
   - UNVERIFIABLE, with what is missing.
6. Mark claims you cannot check from here as UNVERIFIABLE, not SUPPORTED. Examples: performance numbers
   with no benchmark, "all callers updated" with no grep of the callers.
7. For a long text, check claims about numbers, versions, dates, and behavior first.
8. Do not average the verdicts into a score.

Stop / report: CONTRADICTED claims first, each with a corrected sentence; then UNVERIFIABLE claims with
the missing evidence; then the count of SUPPORTED claims; then the "not checkable" list.

Source: Min et al., "FActScore", EMNLP 2023; Wei et al., "SAFE", 2024; Song et al., "VeriScore", arXiv:2406.19276; arXiv:2411.02400 ("Decomposition Dilemmas").
