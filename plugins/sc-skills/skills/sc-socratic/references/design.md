# Design Thinking Techniques

Techniques for helping users work through design and architecture decisions.

## The Diverge-Converge Pattern

Good design requires both exploration and focus. Don't jump to solutions.

### Phase 1: Diverge

**Goal**: Map the full landscape before committing to a path.

- Explore multiple approaches (at least 3)
- Understand tradeoffs, not just features
- Ask "what else could we do?" until ideas dry up
- No criticism yet—collect options

### Phase 2: Capture

**Goal**: Synthesize insights before context grows stale.

- What patterns emerged across approaches?
- What constraints are non-negotiable?
- What surprised you?

### Phase 3: Converge

**Goal**: Extract signal from noise.

- Which approaches survive the constraints?
- What's the MVP—smallest change that delivers value?
- What can we defer?

### The Key Insight

You can only design the minimal solution AFTER you've understood the full landscape. Premature convergence produces bloated designs.

## Constraint-First Design

Define boundaries before generating solutions:

### Constraint Types

| Type | Question |
|------|----------|
| **Format** | What structure must the output have? |
| **Scope** | What's in bounds? Explicitly out? |
| **Quality** | What standards must it meet? |
| **Resource** | Time, tokens, complexity budget? |
| **Negative** | What must it NOT do? (Via Negativa) |

### Why Constraints First

Constraints prevent:
- Scope creep during implementation
- Endless refinement ("just one more thing")
- Drift from original goals
- Rework from missed requirements

## The MVP Question

After exploring options, ask:

- "What's the smallest change that delivers value?"
- "What can we ship this week that moves the needle?"
- "What are we building that we might not need?"

## Premortem Technique

Before committing to a design:

1. **Imagine failure** - "It's 6 months from now. This failed. What happened?"
2. **Work backward** - List plausible failure modes
3. **Categorize**:
   - Likely failures (high probability)
   - Catastrophic failures (high impact)
   - Subtle failures (hard to detect)
4. **Mitigate** - Address the critical risks before starting

## Challenge Protocol

Strengthen a design through opposition:

### Four Frames

| Frame | Question |
|-------|----------|
| **Technical** | Does this work mechanically? What could break? |
| **User** | Does this serve the actual need? |
| **Maintenance** | Will future-you thank or curse present-you? |
| **Adversarial** | How could this be exploited or misused? |

If concerns converge across frames → critical vulnerability.
If they diverge → design may be more robust than initial analysis suggests.

## When Design Becomes Procrastination

Signs you're over-designing:
- Third revision of the same diagram
- Designing for hypothetical future requirements
- Unable to articulate what you're uncertain about
- "Let me just think about this more"

Ask: "What would you need to know to start implementing?"

If the answer is vague, the design work is avoidance, not progress.
