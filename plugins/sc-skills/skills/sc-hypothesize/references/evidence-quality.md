# Evidence Quality Reference

## Confidence Tiers

### Tier 1: Internal Test (High)
Evidence gathered by running code, benchmarks, or prototypes in the target project.

- Same codebase, same environment, same constraints
- Direct observation, not inference
- Examples: unit test passes, benchmark shows 5ms latency, prototype handles edge case

### Tier 2: Internal Analysis (Medium-High)
Evidence from reading and analyzing the target codebase without running anything.

- Same codebase, but reasoning about behavior rather than observing it
- Risk: your analysis could miss runtime behavior
- Examples: "this module already handles X pattern", "the existing auth system supports this"

### Tier 3: Similar Context (Medium)
Evidence from a related project, similar tech stack, or comparable scale.

- Transfer risk: what worked there may not work here
- Useful when internal testing isn't practical
- Examples: "our other service uses this pattern successfully", "company X (similar scale) reported good results"

### Tier 4: External Documentation (Medium-Low)
Official library docs, framework guides, API references.

- Covers the general case, not your specific use case
- Often documents the happy path, not edge cases
- Examples: library README, official migration guide, API documentation

### Tier 5: General Advice (Low)
Blog posts, Stack Overflow answers, conference talks, "best practices" articles.

- Different context, potentially different constraints
- Selection bias: people write about what worked, not what failed
- Useful for generating hypotheses, not for validating them
- Examples: "Redis vs Memcached" blog post, Stack Overflow accepted answer

## Weakest Link Principle

**Confidence of a hypothesis = confidence of its weakest supporting evidence.**

```
Evidence A: Internal test (High)
Evidence B: Internal analysis (Medium-High)
Evidence C: Blog post (Low)

Hypothesis confidence: Low (bounded by Evidence C)
```

This is deliberate. If your decision rests partly on a blog post, that blog post is where it could break. Acknowledge the weak link rather than hiding it behind stronger evidence.

### Reporting Weak Links

When presenting evidence, always call out:

1. **The weakest piece** — What's the least certain thing supporting this hypothesis?
2. **What it means** — If this evidence is wrong, does the hypothesis collapse or just weaken?
3. **How to strengthen** — What would upgrade this from low to high confidence?

## Known Unknowns

Some things can't be verified during reasoning. Document them:

- **Performance under load** — Can't know until you benchmark at scale
- **Team adoption** — Can't predict how easily the team learns a new pattern
- **Long-term maintenance** — Can't fully evaluate maintenance burden upfront
- **Integration surprises** — Dependencies may behave differently than documented

Known unknowns aren't evidence gaps — they're honest acknowledgments of what you can't verify yet. Document them so they become testing priorities after the decision.
