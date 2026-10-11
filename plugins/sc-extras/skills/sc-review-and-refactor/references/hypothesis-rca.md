# Find the root cause with competing hypotheses

Use when: a bug has an unclear cause, a failure keeps coming back, a test is flaky, or the user asks why something fails.

The method is hypothesis-driven debugging (Zeller's scientific debugging): list several explanations,
then run the observation that tells them apart. A single chain of "why" questions tends to stop at a symptom.

1. Reproduce first. Write the smallest input or test that fails every time.
   If the failure is flaky, run it N times and record the failure rate. No reproduction means no root-cause claim.
2. Write the observed behavior and the expected behavior, one line each.
3. List 2-4 competing hypotheses before you test any of them. For each, write the observation that would
   confirm it and the observation that would rule it out.
4. Run the cheapest observation that separates the hypotheses: a log line, a breakpoint, a smaller input,
   or `git bisect` over the history. Record the result against every hypothesis.
5. Cross out each hypothesis the result rules out. Add a new hypothesis only when evidence points to it.
6. Repeat steps 4-5. Stop when one hypothesis explains every observation, including why the failure is
   intermittent or why it started when it did.
7. Reject causes that stop at a person or a process ("human error", "no time", "random"). Ask what in the code
   or the checks let it happen.
8. Fix the cause in the shared code path that every affected caller goes through, not at one call site.
   Do not silence the error. Confirm the reproduction now passes and the rest of the suite still passes.
9. Ask once why the existing checks did not catch this, and propose the one check that would have.

Stop / report: the reproduction, each hypothesis with its verdict and evidence, the cause, the fix,
the regression test, and the proposed check.

Source: Alaboudi & LaToza, arXiv:2005.13652, 2020 (offering candidate hypotheses made debugging success about six times more likely); Zeller, *Why Programs Fail*, 2nd ed., 2009.
