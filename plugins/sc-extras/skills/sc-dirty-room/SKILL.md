---
name: sc-dirty-room
description: >
  Lift-and-shift port of a repository, library, API, protocol, or other software artifact
  to a different language, runtime, or platform, with the original source available as a reference.
  This skill SHOULD be used when the user says "port from X to Y", "lift and shift",
  "rewrite in Go", "rewrite in Rust", "translate this codebase", "convert to TypeScript",
  "language migration", "rewrite in another language", "carry over the algorithms",
  "borrow techniques from", "dirty room", "dirty-room design", "sc-dirty-room",
  or wants to reimplement an existing artifact while studying its internals
  to preserve algorithms, data structures, or idioms worth keeping.
  NOT for legally-constrained reimplementation — use /sc-clean-room when copyright
  isolation matters.
argument-hint: "[target: repo URL, local path, or artifact name] [optional: target language or scope]"
---

# Dirty-Room Design

This is a bastardization of the technique used by Compaq 1982 to clone the IBM PC BIOS.

A structured approach to porting a software artifact to a different language or platform while consulting its internals. A **reading agent** examines the original and produces a behavioral specification, behavioral fixtures, AND a translation brief — notes on which algorithms, data structures, and idioms are worth carrying across the language boundary. The implementation agent receives all three artifacts and explicit permission to read the original source directly.

The clean-room skill builds a wall between specification and implementation to preserve copyright independence; the dirty-room takes notes through the open window because the constraints here are technical, not legal. Use this when the goal is a faithful port rather than an independent reimplementation.

## EXECUTION MODEL

**Phases 0 through 6 run in sequence. The core phases (1-4) MUST NOT be skipped or reordered.**

- Phase 0 establishes scope, target language, and pins the artifact version
- Phase 1 (Read) examines the original via a `Task()` agent and produces discovery, fixtures, and a translation brief
- Phase 2 (Refine) finalises the spec and translation brief for handoff
- Phase 3 (Port) builds in a `Task()` agent that may consult the original directly
- Phase 4 (Verify) confirms equivalence via spec compliance and fixture replay
- Phases 5-6 present results and offer next steps

**After each phase, present the output to the user and wait for approval before proceeding.**

### No isolation, by design

The implementation agent in Phase 3 receives the original artifact's path and may read it freely. The reading agent's notes flow through to the porter. This is the explicit difference from /sc-clean-room — the wall is gone because the work is a translation, not a clean reimplementation. Process-level separation between agents is preserved only for token efficiency; it is no longer load-bearing for independence.

## Phase 0: Resolve Target, Scope, and Languages

Parse $ARGUMENTS. The first argument is the target, anything after is a scope, focus, or target-language hint.

### Target resolution

| Argument | Target | Version pin |
|----------|--------|-------------|
| Repository URL | Clone or fetch the repo | Record commit SHA |
| Local path | Examine directly | Record git commit SHA; if not a git repo, record a checksum |
| Package name | Locate via registry (npm, PyPI, RubyGems, crates.io, etc.) | Record exact package version |
| Protocol or API name | Fetch public docs and specs | Record document revision or access date |

**Version pinning is mandatory.** Record an immutable identifier so all artifacts reference the same version.

### Scope and language negotiation

Use `AskUserQuestion`:

- Source language and runtime
- **Target language and runtime** (this is the defining input; if same as source, ask whether /sc-work is a better fit)
- Which parts to port (the whole thing, a subset, a single module)
- Quality attributes that matter (performance parity, API compatibility, idiomatic target-language code)
- What is explicitly out of scope
- **Licence check**: confirm the user has rights to study the original and produce a port. If unclear, redirect to /sc-clean-room.

Tell the user: "Target: [what]. Scope: [boundaries]. Languages: [source] → [target]."

### Run directory

**Slug**: `<artifact-name>-<source-lang>-to-<target-lang>` (lowercase, hyphens). Create with `mkdir -p .agent-history/dirty-room/<slug>`.

Run `git check-ignore -q .agent-history/` — if it fails, warn the user to add the ignore rule.

If the directory already exists, ask: start fresh, resume, or abort.

### Classify the artifact

| Type | Reading focus |
|------|---------------|
| **Library/Package** | Exported functions, types, behaviour contracts, internal algorithms |
| **CLI Tool** | Command interface, input/output formats, exit codes, argument parsing strategy |
| **API/Service** | Routes, request/response schemas, error codes, middleware ordering |
| **Protocol** | Message types, sequencing, state transitions, framing |
| **Data Format** | Syntax, semantics, edge cases, error recovery, parser strategy |
| **Algorithm** | Inputs, outputs, invariants, complexity, optimisations worth preserving |

## Phase 1: Read the Source

Examine the original to document **what it does**, **how it does the parts worth preserving**, and capture **behavioural fixtures** for verification.

**BLOCKING**: Complete the reading before moving to Phase 2.

Launch as a `Task()` agent. This agent reads the original freely. Its output goes to disk; the orchestrator reads those files afterward. Unlike clean-room, there is no contamination concern — the implementation agent will see the same source material itself.

```
Task(
  description: "Dirty-room reading: examine original artifact for port",
  prompt: """
  ## Role: Reading Agent

  Examine the original artifact and produce three deliverables:
  1. A discovery document (behaviour and noteworthy internals)
  2. A behavioural fixtures file
  3. A translation brief (how to carry this across the language boundary)

  Target: [resolved target from Phase 0]
  Scope: [scope from Phase 0]
  Source version: [pinned version]
  Source language: [from Phase 0]
  Target language: [from Phase 0]

  ## What to capture in discovery.md
  - Public interface: function signatures, types, config options, error types
  - Behavioural contracts: input/output mappings, side effects, edge cases
  - Integration surface: dependencies, consumers, environment expectations
  - Non-functional characteristics: performance envelope, concurrency model
  - **Internal techniques worth noting**: algorithms, data structures,
    optimisation tricks, ordering of operations, invariants the code relies on

  Unlike a clean-room reading, you are encouraged to record HOW the original
  works where the technique is worth preserving. Annotate each internal note
  with: "preserve" (carry across), "adapt" (idea is sound but the form must
  change), or "discard" (idiomatic to the source language only).

  ## Behavioural fixtures (fixtures.md)
  Capture black-box input/output recordings. Coverage requirements:
  - At least one fixture per public interface element
  - At least one per documented error condition
  - Edge-case fixtures for behaviours with boundary conditions
  - For stateful artifacts: fixtures covering key state transitions
  Scale with the artifact.

  Fixture capture can be passive (from docs/tests) or active (executing the target).
  Before active capture, use AskUserQuestion to confirm the user is comfortable
  running the target code.

  Each fixture records: input, expected output, how to replay it, and category.
  Default to behavioural matching (semantic equivalence). Use exact matching only
  for machine-stable contracts (wire protocols, status codes, serialisation formats)
  and note the justification.

  Redact credentials, tokens, or PII from all fixtures.

  ## Translation brief (translation-brief.md)
  This is the dirty-room-specific deliverable. For each notable internal:
  - **Source pattern**: the technique as expressed in [source language]
  - **Target pattern**: the equivalent in [target language] — idiomatic, not literal
  - **Mapping notes**: gotchas, semantic differences, performance implications

  Cover at minimum:
  - Concurrency model translation (e.g. Promise → goroutine, callback → channel)
  - Error handling translation (e.g. exceptions → Result types, panics → errors)
  - Type system translation (e.g. structural → nominal, generics differences)
  - Memory and lifetime model (e.g. GC → ownership, refcount → arena)
  - Standard-library substitutions for any std lib calls in the source
  - Idiom mismatches: places where the source is idiomatic in [source] but
    would be unidiomatic in [target], with proposed local equivalents

  Write to:
  - .agent-history/dirty-room/<slug>/discovery.md
  - .agent-history/dirty-room/<slug>/fixtures.md
  - .agent-history/dirty-room/<slug>/translation-brief.md

  All three files MUST include the source version in their header.
  """
)
```

### Reading output

Write to `.agent-history/dirty-room/<slug>/discovery.md`:

```markdown
# Discovery: [Artifact Name]

**Source version**: [pinned identifier]
**Source language**: [language]
**Target language**: [language]

## Public Interface
[Documented API surface]

## Behavioural Contracts
[Input/output mappings, edge cases, error conditions]

## Integration Surface
[Dependencies, consumers, environment expectations]

## Non-Functional Characteristics
[Performance, concurrency, durability observations]

## Internals Worth Noting
### [technique name]
- **Disposition**: preserve | adapt | discard
- **What it does**: [behavioural description]
- **How it does it**: [implementation sketch — concise, just enough for the porter]
- **Why it matters**: [the reason this is worth carrying or adapting]

## Open Questions
[Behaviours that were ambiguous or couldn't be determined]
```

Write to `.agent-history/dirty-room/<slug>/fixtures.md`:

```markdown
# Behavioural Fixtures: [Artifact Name]

**Source version**: [pinned identifier]

## Fixtures

### FIX-001: [behaviour name]
**Replay**: [how to invoke: command, function call, HTTP request, etc.]
**Input**: [exact input — redact sensitive data]
**Output**: [expected output — behavioural description or exact if justified]
**Match level**: behavioural | exact
**Category**: happy-path | edge-case | error
```

Write to `.agent-history/dirty-room/<slug>/translation-brief.md`:

```markdown
# Translation Brief: [Artifact Name]

**Source version**: [pinned identifier]
**Source language**: [language]
**Target language**: [language]

## Cross-Language Model Mappings

### Concurrency
- **Source pattern**: [e.g. async/await on Promise]
- **Target pattern**: [e.g. goroutine + channel]
- **Mapping notes**: [gotchas, ordering differences]

### Error Handling
[same shape]

### Types
[same shape]

### Memory and Lifetimes
[same shape]

### Standard Library Substitutions
| Source call | Target equivalent | Notes |
|-------------|-------------------|-------|

## Per-Technique Translation
### [technique name from discovery]
- **Source pattern**: [the technique in source language]
- **Target pattern**: [the idiomatic equivalent in target language]
- **Trade-offs**: [what changes; what is gained or lost]

## Idiom Mismatches
[Places where the source idiom does not survive translation; proposed alternatives]
```

Present all three files to the user. Ask: "Does this capture the behaviour you want and the techniques worth preserving? Are the fixtures sufficient?"

## Phase 2: Refine Spec and Translation Brief

Distil the discovery into a **functional specification** (the WHAT) and finalise the **translation brief** (the HOW guidance). Both go to the implementation agent.

**BLOCKING**: Do NOT start until the user approves Phase 1 output.

### Specification rules

The spec describes behaviour, not mechanism — exactly as in clean-room. Keeping the spec clean means a future operator could promote this to a /sc-clean-room run if licence concerns surface. The translation brief is where mechanism lives.

1. **Describe behaviour, not mechanism.** "Returns the sorted elements" not "Uses quicksort with median-of-three pivot."
2. **Define contracts precisely.** Input types, output types, preconditions, postconditions.
3. **Enumerate edge cases.** Empty inputs, maximum sizes, malformed data.
4. **Specify error behaviour.** What errors occur, what information they carry.
5. **Leave implementation choices to the porter and the brief.** The spec says WHAT; the brief and the source say HOW.

Write to `.agent-history/dirty-room/<slug>/specification.md`:

```markdown
# Functional Specification: [Artifact Name]

**Source version**: [pinned identifier]

## Overview
[What this artifact does and why someone uses it]

## Interface
[Complete API surface with types, signatures, return values, expressed in target-language types]

## Behaviour
### [name]
- **Preconditions**: [what must be true before calling]
- **Postconditions**: [what is true after calling]
- **Edge cases**: [boundary conditions and expected behaviour]
- **Errors**: [failure modes and error information]

## State and Side Effects
[For stateful artifacts: state transitions, ordering, atomicity. Omit for stateless.]

## Configuration
[Configurable options, types, defaults, effects]

## Compatibility Requirements
[What "compatible" means: drop-in replacement, behaviourally equivalent, or
idiomatic re-expression. State the level explicitly.]

## Out of Scope
[What the original does that this port will NOT do]
```

### Completeness gate (lighter than clean-room)

Before Phase 3, verify:
- Every fixture-captured behaviour has a corresponding spec requirement
- Every Open Question from discovery is resolved, marked out of scope, or noted as "porter may consult source to resolve"
- For stateful artifacts: state transitions and side effects are in the spec
- The translation brief covers every "preserve" or "adapt" item from discovery

Spec gaps are recoverable here in a way they are not in clean-room — the porter can consult the source. Aim for clarity, but do not block the handoff over irreducible ambiguity.

Present the spec and brief together. Ask:
- "Does the spec accurately describe the behaviour you want?"
- "Does the translation brief reflect how you want techniques carried across?"
- "Anything in the brief that should be reclassified as out-of-scope or as discard?"

The user's approval is the formal handoff.

## Phase 3: Port

**BLOCKING**: Do NOT start until the user approves Phase 2 output.

Gather implementation preferences via `AskUserQuestion`:
- Full interface or vertical slice?
- Preferred architecture or patterns in the target language
- Test strategy (TDD from spec, tests after, both)
- Libraries or frameworks to use (or avoid)
- How aggressively to follow the source's structure (literal port → idiomatic re-expression)

Launch a `Task()` agent for implementation. This agent receives the spec, the brief, the path to the original source, and implementation preferences.

```
Task(
  description: "Dirty-room port: implement from spec, brief, and source",
  prompt: """
  ## Role: Porting Agent

  Build a port of [artifact] from [source language] to [target language].

  Specification: .agent-history/dirty-room/<slug>/specification.md
  Translation brief: .agent-history/dirty-room/<slug>/translation-brief.md
  Original source: [absolute path to source]
  Output directory: [target path]
  Implementation preferences: [from user]

  ## Authority hierarchy
  1. The specification is authoritative for behaviour. The port must satisfy it.
  2. The translation brief is the recommended HOW. Follow it unless target-language
     idiom strongly argues otherwise; record any deviation in your final summary.
  3. The original source is available for tie-breaking, clarifying ambiguity,
     and observing techniques marked "preserve" or "adapt" in the brief.

  ## Rules
  - Prefer idiomatic [target language] over a literal transcription.
  - Items marked "discard" in discovery MUST NOT cross over.
  - Items marked "preserve" should retain their behaviour and, where the brief
    says so, their structural shape.
  - Items marked "adapt" require judgment: keep the idea, change the form.
  - Write tests derived from the spec's contracts and edge cases.
  - If the spec is silent on a behaviour, you may consult the source to determine
    intended behaviour, then either update the spec (preferred) or document the
    decision in your final summary.

  ## Build sequence
  1. Read the specification and translation brief in full
  2. Skim the original source for architectural orientation
  3. Scaffold project structure, dependencies, build tooling in target language
  4. Define types from the spec's interface section, in target-language idiom
  5. Implement behaviour, edge cases, error handling — consulting source where
     marked "preserve" or "adapt"
  6. Write tests derived from spec contracts

  After each major section, report what's implemented, what's remaining, and
  any deviations from the brief with rationale.
  """
)
```

Wait for completion. Present a summary to the user, including any deviations from the translation brief and their rationale.

## Phase 4: Verify

Confirm the port satisfies the specification and the behavioural fixtures. The **orchestrator** runs verification.

**BLOCKING**: Do NOT start until implementation is complete.

### Layer 1: Spec compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| [From spec] | PASS / FAIL / PARTIAL | [Test result or explanation] |

### Layer 2: Fixture replay

Replay every fixture from `fixtures.md` against the port using the documented replay method.

- **Behavioural fixtures**: Compare semantic equivalence. Correct type, status, error class, structural shape. Different wording or formatting is fine.
- **Exact fixtures**: Compare literally.

| Fixture | Match Level | Expected | Actual | Status |
|---------|-------------|----------|--------|--------|
| FIX-001 | behavioural | [expected] | [actual] | PASS / FAIL / DRIFT |

**DRIFT** means semantically equivalent but differently expressed. For a port, drift is often correct — the target language renders the same concept differently. Document each case. DRIFT requires user approval.

### Layer 3 (advisory): Idiomaticity

A short subjective pass. Does the port read as native [target language] code, or does it betray its origin in [source language]? Note any places where the port still reads as a transcription rather than a translation. This layer does not block; it informs Phase 6.

The workflow MUST NOT proceed to Phase 5 with any FAIL fixtures unresolved.

If fixture replay reveals failures, the fix path is: revise the spec or brief to capture the missing behaviour, then re-run Phase 3. The porter may also re-read the source to diagnose. Unlike clean-room, this is fully permitted.

Write to `.agent-history/dirty-room/<slug>/verification.md`:

```markdown
# Verification: [Artifact Name]

**Source version**: [pinned identifier]

## Summary
- Spec requirements: N passing, N failing, N partial
- Fixture replays: N passing, N failing, N drift
- Idiomaticity: [brief subjective note]

## Spec Compliance
[Requirement checklist table]

## Fixture Replay Results
[Replay table]

## Drift Decisions
[For each DRIFT: what differed, acceptable or not, why]

## Brief Deviations
[Where the porter departed from the translation brief and why]

## Gaps
[Behaviours that couldn't be verified and why]
```

## Phase 5: Present Results

```markdown
# Dirty-Room Port: [Artifact Name]

**Target**: [original artifact]
**Languages**: [source] → [target]
**Scope**: [what was ported]

## Process
- **Reading** documented N interface elements, M behavioural contracts, K fixtures, P translation entries
- **Specification** covered N requirements
- **Port** produced [file count] files, [test count] tests
- **Verification** passed N/M spec requirements, K/K fixtures replayed

## Artifacts
- Discovery: `.agent-history/dirty-room/<slug>/discovery.md`
- Fixtures: `.agent-history/dirty-room/<slug>/fixtures.md`
- Specification: `.agent-history/dirty-room/<slug>/specification.md`
- Translation brief: `.agent-history/dirty-room/<slug>/translation-brief.md`
- Verification: `.agent-history/dirty-room/<slug>/verification.md`
- Port: [path to ported code]

## Known Gaps
[Unimplemented or unverified requirements]

## Notable Brief Deviations
[Where the porter chose target-language idiom over the brief's recommendation]
```

## Phase 6: User Choice

Use `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| Extend | Port more of the original; capture more fixtures and translation entries |
| Idiomatise | Revisit places where the port still reads as transcription, not translation |
| Harden | Focus on edge cases, error handling, and test coverage |
| Ship | Done. Package and finalise |

---

_Dirty-room design trades independence for fidelity. The wall would have prevented borrowing what the original got right; the absence of the wall obliges the porter to distinguish those things from idioms that do not survive the crossing. A literal transcription is no more a translation than a phonetic transliteration is a poem._

${ARGUMENTS}
