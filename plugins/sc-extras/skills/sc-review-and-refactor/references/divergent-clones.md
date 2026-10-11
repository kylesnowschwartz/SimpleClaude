# Find duplicated code that has diverged

Use when: the user asks to find duplication, asks whether code was copy-pasted, plans a refactor,
or fixed a bug that may also exist in a copy elsewhere.

The method follows Juergens et al.: duplication matters when copies change inconsistently.
Judge a clone by how its copies differ, not by the fact that it exists.

1. Run a clone detector over the repository: jscpd, PMD CPD, flay (Ruby), or `ast-grep` for structural matches.
   Keep clones of at least ~6 lines or ~50 tokens.
2. For each clone group, diff the copies against each other.
   - Identical: low priority.
   - Divergent: read what differs. A bug fix, a bounds check, or error handling present in some copies
     and missing in others is a blocking finding.
3. When the task started from a bug fix, grep the repository for the same faulty pattern before you close it.
   A fix applied to one copy leaves the bug alive in the others.
4. Classify the remaining groups:
   - Forking: an intentional variant. Leave it and note why it differs.
   - Templating: boilerplate. A generator or shared helper may fit.
   - Customization: a candidate for Extract Function or Pull Up Method.
   - Accidental: a candidate for removal.
5. Recommend merging only accidental and customization clones whose copies change together in history
   (`git log -L` or co-change counts). Do not merge copies that diverged on purpose.
6. Skip test setup boilerplate, import lists, types that mirror each other by design, and per-environment config.

Stop / report: divergent groups first, each with locations and the exact difference, then the other groups
with their class and the refactoring step for each. Apply changes with `refactor-safely.md`.

Source: Juergens et al., "Do code clones matter?", ICSE 2009, arXiv:1701.05472; Kapser & Godfrey, EMSE 2008 (many clones are deliberate and harmless).
