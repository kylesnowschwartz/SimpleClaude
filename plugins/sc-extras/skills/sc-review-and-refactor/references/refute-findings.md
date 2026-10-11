# Refute findings and claims

Use when: you must decide whether a finding, a whole review, or a "done" or "fixed" claim is real,
whoever produced it (another agent, a human, a tool, an earlier session, or you).

The method is independent refutation: a fresh agent gets the claim and the code, not the reasoning,
and tries to disprove it with a check it can run.

1. Write each claim as one sentence that a check can prove false.
   Examples: "handler X returns 500 when the body is empty", "all callers of Y were updated".
2. Start one fresh subagent per claim. Give it the claim, the diff or the files, read access to the repo, and a shell.
   Do not give it the original reviewer's reasoning, the PR description, your opinion, or other claims' verdicts.
3. Tell it to try to disprove the claim. It prefers a check it can run: write and run a failing test,
   run the reproduction, grep every call site, or trace the code path. Reading alone is the last resort,
   and it must say so in the verdict.
4. Tell it to ask "could this be wrong?" of its own verdict before it returns:
   which evidence would contradict it, and which other explanation fits the same output.
5. Accept one of three verdicts only:
   - CONFIRMED, with the command or test and its output.
   - REFUTED, with the counterexample.
   - UNVERIFIABLE, with the evidence that would settle it.
6. Treat "I checked and it looks fine" with no evidence attached as UNVERIFIABLE.
7. Keep only CONFIRMED findings. List REFUTED ones in one line each so the reader knows they were checked.

Different model family: models from one family share blind spots. For a code change on a branch,
also run a Codex review and treat its output as more claims to refute:

    codex review --base main          # committed branch changes
    codex review --uncommitted        # working tree changes

Run Codex directly, or through a Codex delegation tool if you have one. Mark each finding that Claude and Codex
both report as agreed. Look harder at findings only one of them reports, and at places where they disagree.

Stop / report: one line per claim with its verdict and evidence, CONFIRMED first, then UNVERIFIABLE, then REFUTED.

Source: Anthropic, Claude Code best practices, 2026 (fresh-context reviewer); arXiv:2604.19049 (Refute-or-Promote); arXiv:2310.01798 (self-correction without outside feedback does not help); arXiv:2404.13076 (self-preference); Hills, *AI* 7(1):33, 2025 ("Could you be wrong?").
