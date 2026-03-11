# ADI Reasoning Cycle Reference

The ADI cycle comes from the First Principles Framework (FPF) by Anatoly Levenchuk. It maps three modes of philosophical inference to practical decision-making.

## The Three Inference Modes

### Abduction — "What could explain this?"

Generate plausible hypotheses. Abduction is inference to the best explanation — given an observation, what are the possible causes or solutions?

**In practice:** Brainstorm 3-5 competing approaches. The point is breadth — resist converging too early. Include at least one option you wouldn't normally consider.

**Failure mode:** Anchoring. You generate one good idea and then create minor variations of it. Force yourself to consider genuinely different approaches.

### Deduction — "Does this hold up logically?"

Verify hypotheses against known constraints and logic. Deduction moves from general rules to specific conclusions — if the premises are true, the conclusion must follow.

**In practice:** For each hypothesis, check:
- Does it actually address the problem? (Not a solution looking for a different problem)
- Is it compatible with known constraints? (Technical stack, team, timeline)
- Are there internal contradictions?

**Failure mode:** Rubber-stamping. Going through the motions without genuine scrutiny. If every hypothesis passes, you're not being rigorous enough.

### Induction — "What does the evidence say?"

Gather empirical evidence. Induction generalizes from specific observations — this worked here, so it should work there (with caveats about context).

**In practice:** Run actual tests, read actual code, check actual docs. Prefer evidence from your own project over generic advice.

**Failure mode:** Confirmation bias. Gathering evidence only for the option you already prefer. Actively look for disconfirming evidence.

## Evidence Quality

Not all evidence is equal. Rate by how well it transfers to your context:

| Source | Confidence | Why |
|--------|------------|-----|
| Test in this codebase | High | Same context, direct observation |
| Analysis of this codebase | Medium-High | Same context, inference-based |
| Similar project's experience | Medium | Similar context, may not transfer |
| Library documentation | Medium-Low | General context, covers happy path |
| Blog post / Stack Overflow | Low | Different context, selection bias |

### Weakest Link Principle (WLNK)

The reliability of a hypothesis is bounded by its weakest evidence, not the average.

If you have three supporting facts — two strong, one shaky — the hypothesis is shaky. Report the floor, not the average.

**Why this matters:** Averaging lets one strong piece of evidence mask a critical gap. The weakest link is where the hypothesis will break first.

## The Decision Record

After the user decides, document:

1. **What was decided** — The chosen approach, in one sentence
2. **What was rejected** — Other options and why they lost
3. **Key evidence** — What tipped the balance
4. **Revisit conditions** — When should this decision be reconsidered?

This creates an audit trail. Six months from now, someone asks "why did we use X instead of Y?" — the answer is in the decision record, not lost in chat history.

## When to Skip Phases

The ADI cycle serves the decision. If the answer becomes obvious partway through, stop.

- **After Phase 1:** If one hypothesis is clearly dominant and others are clearly inferior, just say so. Don't manufacture uncertainty.
- **After Phase 2:** If verification kills all but one option, that's your answer. No need to gather evidence for a single survivor.
- **Before starting:** If the user already has good options and just needs a comparison, skip to Phase 3 or 4.

Structured reasoning is a tool, not a ritual.
