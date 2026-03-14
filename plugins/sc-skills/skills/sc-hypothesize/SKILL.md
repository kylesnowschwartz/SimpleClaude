---
name: sc-hypothesize
description: >
  Structured reasoning through competing hypotheses using the ADI cycle (Abduction, Deduction, Induction).
  This skill SHOULD be used when the user says "reason through", "compare approaches", "evaluate options",
  "which approach", "what's the best way to", "I have multiple options", "help me decide between",
  "structured analysis", "hypothesis", "trade-off analysis", "hypothesize", "sc-hypothesize",
  or faces a decision with multiple viable approaches that need systematic evaluation.
  NOT for quick decisions with obvious answers — use sc-socratic for open-ended dialogue instead.
argument-hint: Problem or decision to reason through
---

# Structured Reasoning (ADI Cycle)

Reason through problems by generating competing hypotheses, verifying them against constraints, gathering evidence, and presenting a comparison for the user to decide.

Based on the ADI reasoning cycle: **Abduction** (generate options) -> **Deduction** (verify logic) -> **Induction** (gather evidence) -> **Decision** (user picks).

## When to Use This

- Architectural decisions with long-term consequences
- Multiple viable approaches that need systematic comparison
- Decisions that benefit from an auditable reasoning trail
- Problems where anchoring on the first idea is a risk

## When NOT to Use This

- Quick fixes with obvious solutions (just do the work)
- Easily reversible decisions (just try it)
- Open-ended uncertainty without clear options (use `/sc-socratic` instead)
- Pure implementation tasks (use `/sc-work`)

## Core Principle: Transformer Mandate

**You generate options with evidence. The human decides.**

Do not select winners autonomously. Present the comparison, surface the trade-offs, and wait for the user to choose.

## The ADI Cycle

Each phase is a conversational turn. The user drives transitions — you don't auto-advance through all phases in one response.

### Phase 1: Abduction (Generate Hypotheses)

Generate 3-5 competing approaches. Resist anchoring on the first idea that seems reasonable.

**Requirements:**
- At least one **conservative** option (safe, proven, lower risk)
- At least one **radical** option (novel, higher potential, less proven)
- Each hypothesis states: what it is, key assumptions, and where it applies (scope)
- Classify each as **system** (code/architecture) or **process** (methodology/workflow)

**Anti-anchoring check:** Before generating, ask yourself — am I just listing variations of the same idea? If yes, force at least one genuinely different approach.

**Output format:**

```
## Hypotheses

### H1: [Name] (conservative)
**Approach**: [What and how]
**Assumptions**: [What must be true]
**Scope**: [Where this applies]

### H2: [Name]
...

### H3: [Name] (radical)
...
```

**After presenting hypotheses, ask the user:**
- Are any missing? Should we add one?
- Should we kill any before going deeper?
- Ready to verify?

### Phase 2: Deduction (Verify Logic)

Check each surviving hypothesis against constraints. Kill the ones that don't hold up.

**For each hypothesis, check:**
1. **Logical consistency** — Does the approach actually solve the stated problem?
2. **Constraint compatibility** — Does it fit within known technical constraints (existing stack, team skills, timeline)?
3. **Type correctness** — Does the solution shape match the problem shape? (e.g., proposing a caching solution for a data modeling problem)

**Verdicts:**
- **PASS** — Logically sound, survives to evidence gathering
- **FAIL** — Contradicts constraints or logic. Document why and drop it
- **REFINE** — Has potential but needs adjustment. Modify and re-check

**Output format:**

```
## Verification Results

### H1: [Name] — PASS
**Logic**: [Why it holds up]
**Constraints**: [Compatible because...]

### H2: [Name] — FAIL
**Reason**: [Specific contradiction or logical flaw]

### H3: [Name] — REFINE
**Issue**: [What needs adjustment]
**Refined**: [Updated approach]
```

**After verification, confirm with user:** These hypotheses survived. Ready to gather evidence?

### Phase 3: Induction (Gather Evidence)

Collect actual evidence for each surviving hypothesis. This is where you do real work — read code, run searches, check docs, analyze feasibility.

**Evidence quality tiers:**

| Tier | Source | Confidence |
|------|--------|------------|
| **Internal test** | Run code, benchmark, prototype in this project | High |
| **Internal analysis** | Read this codebase, check compatibility | Medium-High |
| **Similar context** | Evidence from similar project/stack | Medium |
| **External docs** | Library docs, blog posts, general advice | Low-Medium |

**Weakest Link Principle (WLNK):** A hypothesis is only as strong as its weakest piece of evidence. Don't average — report the floor.

**For each hypothesis, gather:**
- Best available evidence (prefer internal over external)
- The weakest link — what's the least certain thing?
- Known unknowns — what couldn't you verify?

Use Agent tools to parallelize evidence gathering when hypotheses are independent.

**Output format:**

```
## Evidence

### H1: [Name]
**Evidence**: [What you found, with sources]
**Weakest link**: [Least certain element]
**Unknowns**: [What couldn't be verified]
**Confidence floor**: [high / medium / low]

### H3: [Name]
...
```

### Phase 4: Decision (User Decides)

Present a comparison table and let the user choose.

**Output format:**

```
## Comparison

| | H1: [Name] | H3: [Name] |
|---|---|---|
| **Approach** | ... | ... |
| **Evidence** | ... | ... |
| **Weakest link** | ... | ... |
| **Confidence** | ... | ... |
| **Trade-offs** | ... | ... |
| **Reversibility** | ... | ... |

## Recommendation

[Your analysis of which is stronger and why — but the user decides]

## What would you like to go with?
```

After the user decides, document the rationale:

```
## Decision Record

**Problem**: [Original question]
**Chosen**: [H-name] — [one-line summary]
**Rationale**: [Why this won, citing evidence]
**Rejected**: [Other hypotheses and why they lost]
**Revisit when**: [Conditions that should trigger re-evaluation]
```

## Persistence

Save reasoning artifacts to `.agent-history/reasoning/<slug>/`:

```
.agent-history/reasoning/<slug>/
  hypotheses.md    # Phase 1 output
  verification.md  # Phase 2 output
  evidence.md      # Phase 3 output
  decision.md      # Phase 4 output (if reached)
```

Create the directory at the start of Phase 1. Write each file as its phase completes.

**Slug generation:** Lowercase the problem statement, take first 4-5 words, join with hyphens. Example: "how should we handle caching" -> `how-should-we-handle-caching`

## Execution

1. **Parse the problem** — Read `$ARGUMENTS`. If empty, ask what decision needs reasoning.

2. **Gather context** — Use Read, Grep, Glob to understand the relevant codebase before generating hypotheses. Don't hypothesize in a vacuum.

3. **Run Phase 1** — Generate hypotheses, present to user, wait for confirmation.

4. **Run Phase 2-4 on user request** — Each phase is a separate turn. Don't auto-advance. The user says "verify" or "gather evidence" or "decide" to move forward.

5. **Early exit is fine** — If the answer becomes obvious during Phase 1 or 2, say so. The framework serves the decision, not the other way around.

## Shortcuts

- `/sc-hypothesize [problem]` — Start from Phase 1
- "verify" / "check logic" — Run Phase 2 on existing hypotheses
- "evidence" / "test these" — Run Phase 3
- "decide" / "compare" — Run Phase 4
- "add hypothesis: [idea]" — Add a user-supplied hypothesis at any point
- "kill H2" — Remove a hypothesis from consideration

## Related Commands

| Situation | Command |
|-----------|---------|
| Open-ended uncertainty, no clear options | `/sc-socratic` |
| Quick implementation after deciding | `/sc-work` |
| Challenge a conclusion adversarially | `/sc-challenge-assumptions` |
| Full feature workflow with architecture | `/sc-workflow` |
