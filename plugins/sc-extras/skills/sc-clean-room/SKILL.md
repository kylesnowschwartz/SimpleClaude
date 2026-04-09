---
name: sc-clean-room
description: >
  Clean-room reimplementation of a repository, library, API, protocol, or other software artifact.
  This skill SHOULD be used when the user says "clean room", "clean-room design", "reimplement from scratch",
  "build a clean version of", "reverse engineer", "reimagine this library", "write my own version of",
  "clone this functionality", "functional equivalent", "rewrite without looking at the source",
  "Chinese wall", "independent implementation", "sc-clean-room",
  or wants to create a functionally equivalent implementation of an existing artifact
  without copying its internal design or expression.
  NOT for refactoring existing code. Use /sc-work for that. NOT for adversarial analysis. Use /sc-adversarial-hunt.
argument-hint: "[target: repo URL, local path, or artifact name] [optional: scope or focus]"
allowed-tools: Task, Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite, WebSearch, WebFetch, Write, Edit
---

# Clean-Room Design

A structured approach to reimplementing a software artifact without copying its internals. A **discovery agent** examines the original and writes a behavioral specification with fixtures. Then a **separate implementation agent** builds from that specification alone. Fixtures captured during discovery verify the reimplementation in Phase 4.

Compaq used this technique in 1982 to clone the IBM PC BIOS — one team documented what the BIOS did, a second team (who had never seen IBM's code) wrote compatible firmware from those docs. Copyright protects expression, not ideas. A functional spec describes ideas.

## EXECUTION MODEL

**Phases 0 through 6 run in sequence. The core phases (1-4) MUST NOT be skipped or reordered.**

- Phase 0 establishes scope and pins the artifact version
- Phase 1 (Discovery) examines the original via a `Task()` agent, produces observations and fixtures
- Phase 2 (Specify) distills observations into a clean functional spec
- Phase 3 (Implement) builds from the spec in a fresh `Task()` agent that has never seen the original
- Phase 4 (Verify) confirms equivalence via spec compliance and fixture replay
- Phases 5-6 present results and offer next steps

**After each phase, present the output to the user and wait for approval before proceeding.**

### Isolation

Discovery and Implementation run in **separate `Task()` agents** with no shared context. The implementation agent receives only the specification file path. The original artifact, discovery notes, and fixtures never enter the implementation agent's prompt.

This provides process-level isolation, not OS-level sandboxing. For stronger isolation (IP-sensitive work), run Phase 3 in an entirely separate Claude session — the artifacts this skill produces support that handoff cleanly.

## Phase 0: Resolve Target and Scope

Parse $ARGUMENTS. The first argument is the target, anything after is a scope or focus hint.

### Target resolution

| Argument | Target | Version pin |
|----------|--------|-------------|
| Repository URL | Clone or fetch the repo | Record commit SHA |
| Local path | Examine directly | Record git commit SHA; if not a git repo, record a checksum |
| Package name | Locate via registry (npm, PyPI, RubyGems, crates.io, etc.) | Record exact package version |
| Protocol or API name | Fetch public docs and specs | Record document revision or access date |

**Version pinning is mandatory.** Record an immutable identifier so all artifacts reference the same version.

### Scope negotiation

Use `AskUserQuestion`:

- Which parts to reimplement (the whole thing, a subset, a single module)
- Target language and runtime (same as original, or different)
- Quality attributes that matter (performance parity, API compatibility, simplified interface)
- What's explicitly out of scope

Tell the user: "Target: [what]. Scope: [boundaries]. Language: [target stack]."

### Run directory

**Slug**: `<artifact-name>-<version-prefix>` (lowercase, hyphens). Create with `mkdir -p .agent-history/clean-room/<slug>`.

Run `git check-ignore -q .agent-history/` — if it fails, warn the user to add the ignore rule.

If the directory already exists, ask: start fresh, resume, or abort.

### Classify the artifact

| Type | Discovery focus |
|------|-----------------|
| **Library/Package** | Exported functions, types, behavior contracts |
| **CLI Tool** | Command interface, input/output formats, exit codes |
| **API/Service** | Routes, request/response schemas, error codes |
| **Protocol** | Message types, sequencing, state transitions |
| **Data Format** | Syntax, semantics, edge cases, error recovery |
| **Algorithm** | Inputs, outputs, invariants, complexity characteristics |

## Phase 1: Discovery (The Dirty Room)

Examine the original to document **what it does** (not how) and capture **behavioral fixtures** for verification.

**BLOCKING**: Complete discovery before moving to Phase 2.

Launch as a `Task()` agent. This agent reads the original freely. Its output goes to disk — the orchestrator reads those files afterward but does NOT pass the agent's context into later phases.

```
Task(
  description: "Clean-room discovery: examine original artifact",
  prompt: """
  ## Role: Discovery Agent (Dirty Room)

  Examine the original artifact and produce two deliverables:
  1. A behavioral discovery document
  2. A behavioral fixtures file

  Target: [resolved target from Phase 0]
  Scope: [scope from Phase 0]
  Source version: [pinned version from Phase 0]

  ## What to document
  - Public interface: function signatures, types, config options, error types
  - Behavioral contracts: input/output mappings, side effects, edge cases
  - Integration surface: dependencies, consumers, environment expectations
  - Non-functional characteristics: performance envelope, concurrency model

  ## What NOT to document (clean-room rule)
  - Internal data structures and their layout
  - Private helper functions and their signatures
  - Optimization techniques and implementation tricks
  - Comments, variable names, or code organization from the original

  ## Behavioral fixtures
  Capture black-box input/output recordings. Coverage requirements:
  - At least one fixture per public interface element
  - At least one per documented error condition
  - Edge-case fixtures for behaviors with boundary conditions
  - For stateful artifacts: fixtures covering key state transitions
  Scale with the artifact.

  Fixture capture can be passive (from docs/tests) or active (executing the target).
  Before active capture, use AskUserQuestion to confirm the user is comfortable
  running the target code.

  Each fixture records: input, expected output, how to replay it, and category.
  Default to behavioral matching (semantic equivalence). Use exact matching only
  for machine-stable contracts (wire protocols, status codes, serialization formats)
  and note the justification.

  Redact credentials, tokens, or PII from all fixtures.

  Write discovery to: .agent-history/clean-room/<slug>/discovery.md
  Write fixtures to: .agent-history/clean-room/<slug>/fixtures.md
  Both files MUST include the source version in their header.
  """
)
```

### Discovery output

Write to `.agent-history/clean-room/<slug>/discovery.md`:

```markdown
# Discovery: [Artifact Name]

**Source version**: [pinned identifier]

## Public Interface
[Documented API surface]

## Behavioral Contracts
[Input/output mappings, edge cases, error conditions]

## Integration Surface
[Dependencies, consumers, environment expectations]

## Non-Functional Characteristics
[Performance, concurrency, durability observations]

## Open Questions
[Behaviors that were ambiguous or couldn't be determined externally]
```

Write to `.agent-history/clean-room/<slug>/fixtures.md`:

```markdown
# Behavioral Fixtures: [Artifact Name]

**Source version**: [pinned identifier]

## Fixtures

### FIX-001: [behavior name]
**Replay**: [how to invoke: command, function call, HTTP request, etc.]
**Input**: [exact input — redact sensitive data]
**Output**: [expected output — behavioral description or exact if justified]
**Match level**: behavioral | exact
**Category**: happy-path | edge-case | error
```

Present both files to the user. Ask: "Does this capture the behavior you want to reimplement? Are the fixtures sufficient?"

## Phase 2: Specify (The Wall)

Transform discovery observations into a **functional specification** with no reference to the original's internals. This is the only artifact the implementation agent receives.

**BLOCKING**: Do NOT start until the user approves Phase 1 output.

### Specification rules

1. **Describe behavior, not mechanism.** "Returns the sorted elements" not "Uses quicksort with median-of-three pivot."
2. **Define contracts precisely.** Input types, output types, preconditions, postconditions.
3. **Enumerate edge cases.** Empty inputs, maximum sizes, malformed data.
4. **Specify error behavior.** What errors occur, what information they carry.
5. **Leave implementation choices open.** The spec says WHAT, the implementer decides HOW.

Write to `.agent-history/clean-room/<slug>/specification.md`:

```markdown
# Functional Specification: [Artifact Name]

**Source version**: [pinned identifier]

## Overview
[What this artifact does and why someone uses it]

## Interface
[Complete API surface with types, signatures, return values]

## Behavior
### [name]
- **Preconditions**: [what must be true before calling]
- **Postconditions**: [what is true after calling]
- **Edge cases**: [boundary conditions and expected behavior]
- **Errors**: [failure modes and error information]

## State and Side Effects
[For stateful artifacts: state transitions, ordering, atomicity. Omit for stateless.]

## Configuration
[Configurable options, types, defaults, effects]

## Compatibility Requirements
[What "compatible" means if drop-in replacement is needed]

## Out of Scope
[What the original does that this reimplementation will NOT do]
```

### Completeness gate

Before Phase 3, verify:
- Every fixture-captured behavior has a corresponding spec requirement
- Every Open Question from discovery is resolved, marked out of scope, or translated into a spec decision
- For stateful artifacts: state transitions and side effects are in the spec

Do NOT hand off a spec with unresolved ambiguities — the implementation agent cannot consult the original to fill gaps.

Present the specification and ask:
- "Does this spec accurately describe the behavior you want?"
- "Does anything here reference HOW the original works rather than WHAT it does?"

The user's approval is the formal handoff.

## Phase 3: Implement (The Clean Room)

**BLOCKING**: Do NOT start until the user approves the specification.

Gather implementation preferences via `AskUserQuestion`:
- Full interface or vertical slice?
- Preferred architecture or patterns
- Test strategy (TDD from spec, tests after, both)
- Libraries or frameworks to use (or avoid)

Launch a **new `Task()` agent** for implementation. This agent receives ONLY the spec file path and implementation preferences. It has never seen the original artifact.

```
Task(
  description: "Clean-room implementation from spec",
  prompt: """
  ## Role: Implementation Agent (Clean Room)

  Build a reimplementation from the specification alone.

  Specification: .agent-history/clean-room/<slug>/specification.md
  Output directory: [target path]
  Implementation preferences: [from user]

  ## Rules
  - The specification is your ONLY source of truth
  - If the spec is ambiguous, ask the user to clarify — do NOT search for an existing implementation
  - Write tests derived from the spec's contracts and edge cases

  ## Build sequence
  1. Read the specification
  2. Scaffold project structure, dependencies, build tooling
  3. Define types from the spec's interface section
  4. Implement behavior, edge cases, and error handling
  5. Write tests derived from spec contracts

  After each major section, report what's implemented, what's remaining.
  """
)
```

Wait for completion. Present a summary to the user.

## Phase 4: Verify (Functional Equivalence)

Confirm the reimplementation satisfies both the specification and the behavioral fixtures. The **orchestrator** runs verification, not the implementation agent. Fixtures never enter the implementation agent's context.

If fixture replay reveals failures, the fix path is: revise the spec to capture the missing behavior, then re-run Phase 3 with the updated spec. Do NOT leak fixtures or discovery notes into the implementation agent to fix failures — that breaks the wall.

**BLOCKING**: Do NOT start until implementation is complete.

### Layer 1: Spec compliance

| Requirement | Status | Evidence |
|-------------|--------|----------|
| [From spec] | PASS / FAIL / PARTIAL | [Test result or explanation] |

### Layer 2: Fixture replay

Replay every fixture from `fixtures.md` against the reimplementation using the documented replay method.

- **Behavioral fixtures**: Compare semantic equivalence. Correct type, status, error class, structural shape. Different wording or formatting is fine.
- **Exact fixtures**: Compare literally.

| Fixture | Match Level | Expected | Actual | Status |
|---------|-------------|----------|--------|--------|
| FIX-001 | behavioral | [expected] | [actual] | PASS / FAIL / DRIFT |

**DRIFT** means semantically equivalent but differently expressed. Document each case. DRIFT requires user approval.

The workflow MUST NOT proceed to Phase 5 with any FAIL fixtures unresolved.

Write to `.agent-history/clean-room/<slug>/verification.md`:

```markdown
# Verification: [Artifact Name]

**Source version**: [pinned identifier]

## Summary
- Spec requirements: N passing, N failing, N partial
- Fixture replays: N passing, N failing, N drift

## Spec Compliance
[Requirement checklist table]

## Fixture Replay Results
[Replay table]

## Drift Decisions
[For each DRIFT: what differed, acceptable or not]

## Gaps
[Behaviors that couldn't be verified and why]
```

## Phase 5: Present Results

```markdown
# Clean-Room Design: [Artifact Name]

**Target**: [original artifact]
**Scope**: [what was reimplemented]
**Language**: [implementation language/runtime]

## Process
- **Discovery** documented N interface elements, M behavioral contracts, K fixtures
- **Specification** covered N requirements
- **Implementation** produced [file count] files, [test count] tests
- **Verification** passed N/M spec requirements, K/K fixtures replayed

## Artifacts
- Discovery: `.agent-history/clean-room/<slug>/discovery.md`
- Fixtures: `.agent-history/clean-room/<slug>/fixtures.md`
- Specification: `.agent-history/clean-room/<slug>/specification.md`
- Verification: `.agent-history/clean-room/<slug>/verification.md`
- Implementation: [path to reimplemented code]

## Known Gaps
[Unimplemented or unverified requirements]
```

## Phase 6: User Choice

Use `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| Extend | Add more spec requirements, capture more fixtures, and implement |
| Harden | Focus on edge cases, error handling, and test coverage |
| Ship | Done. Package and finalize |

---

_Clean-room design trades speed for independence. The wall between specification and implementation is the whole point. A good spec produces a good implementation. Gaps in the spec surface in Phase 4 instead of in production._

${ARGUMENTS}
