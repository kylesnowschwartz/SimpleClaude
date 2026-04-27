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

A structured approach to porting a software artifact to a different language or platform while consulting its internals. A **reading agent** examines the original and produces discovery, fixtures, and a translation brief — notes on which algorithms, data structures, and idioms are worth carrying across the language boundary. The implementation agent receives all three artifacts and explicit permission to read the original source directly.

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

### Run State

Before leaving Phase 0, fix the following named variables.

**Substitution contract.** Two grammars appear in this skill and must not be confused:

- Tokens of the form `<UPPER_SNAKE>` are Run State variables. The orchestrator MUST replace them with the resolved value before sending any prompt to a `Task()` agent. Every Phase 1 and Phase 3 prompt body performs this literal substitution before invocation.
- Tokens of the form `[brief description]` inside example artifact templates (the `discovery.md`, `fixtures.md`, `specification.md`, and `verification.md` blocks) are human-readable scaffolds the spawned agent fills with its findings — do NOT replace these.

| Variable | Definition | Derivation rule |
|----------|------------|-----------------|
| `ARTIFACT_NAME` | Short canonical name of the original artifact | Lowercase, hyphens; strip versions, namespaces, and registry decorations. For repo URLs, use the repo's basename; for packages, the registry name without scope (`@org/foo` → `foo`); for protocols, the common abbreviation (e.g. `http2`, `grpc`). |
| `SOURCE_LANG` / `TARGET_LANG` | Canonical language tokens | Lowercase, hyphens. Use the canonical short names: `go`, `rust`, `python`, `typescript`, `javascript`, `ruby`, `java`, `kotlin`, `swift`, `c`, `cpp`, `csharp`, `elixir`, `erlang`, `scala`, `clojure`, `haskell`, `ocaml`. Pick the closest match for variants (`ts` → `typescript`, `py` → `python`). |
| `SLUG` | Run identifier | `<ARTIFACT_NAME>-<SOURCE_LANG>-to-<TARGET_LANG>` |
| `RUN_DIR` | Run directory (absolute path) | `<repo-root>/.agent-history/dirty-room/<SLUG>/` |
| `SOURCE_PATH` | Absolute path to the materialised original | Set by Phase 0 Materialisation, below. |
| `TARGET_PATH` | Absolute path where the port will be written | Confirm with the user; default to `<repo-root>/<ARTIFACT_NAME>-<TARGET_LANG>/` if unspecified. |
| `SOURCE_VERSION` | Immutable version pin of the materialised source | Read after Materialisation; this is the `version_pin` field recorded by the Materialisation recipe in `<RUN_DIR>provenance.json`. |
| `SCOPE` | Negotiated scope of the port | Captured during Phase 0 scope negotiation. A short prose summary of which parts are in scope and out of scope. |
| `IMPL_PREFS` | Porter's preferred architecture, test strategy, libraries | Captured at the start of Phase 3, immediately before the porting Task() is launched, via `AskUserQuestion`. |
| `APPROVAL_SIGNAL` | What counts as user approval at each blocking gate | An explicit affirmative from the user — "yes", "approved", "proceed", "lgtm", "go ahead", or equivalent. Silence, partial approval ("looks mostly good but…"), or any qualified response does NOT count; re-ask explicitly until you receive an unambiguous affirmative or an explicit halt. |

Echo the Run State back to the user as a compact block before Phase 1 so they can confirm:

```
SLUG=<resolved>
RUN_DIR=<resolved>
ARTIFACT_NAME=<resolved>
SOURCE_LANG=<resolved>
TARGET_LANG=<resolved>
SOURCE_PATH=<resolved>
TARGET_PATH=<resolved>
SOURCE_VERSION=<resolved>
SCOPE=<resolved>
```

(`IMPL_PREFS` is filled in at Phase 3.)

### Phase 0 Materialisation

After resolving Run State, the orchestrator MUST materialise the source on disk and record its version pin to `<RUN_DIR>provenance.json` before proceeding to Phase 1. Run exactly one row from the table below — the row whose target type matches what the user supplied.

`provenance.json` shape (uniform across all rows):

```json
{
  "target_type": "repo_url | local_path | package | protocol",
  "identifier": "<the original argument as supplied>",
  "version_pin": "<commit SHA, package version, or doc revision/access date>",
  "captured_at": "<ISO-8601 UTC timestamp>",
  "source_path": "<absolute path>"
}
```

| Target type | Materialisation recipe |
|-------------|------------------------|
| **Repository URL** | `git clone <url> <RUN_DIR>source/<ARTIFACT_NAME>` then capture `git -C <RUN_DIR>source/<ARTIFACT_NAME> rev-parse HEAD` as `version_pin`. `source_path` = `<RUN_DIR>source/<ARTIFACT_NAME>`. |
| **Local path** | No copy. `source_path` = absolute path of `<SOURCE_INPUT>`. If `git -C <SOURCE_INPUT> rev-parse HEAD` succeeds, use its output as `version_pin`. Otherwise compute `find <SOURCE_INPUT> -type f -exec sha256sum {} \; \| sha256sum` and use that digest as `version_pin`. |
| **Package name** | Resolve and unpack into `<RUN_DIR>source/<ARTIFACT_NAME>/` per ecosystem, then record the resolved version as `version_pin`: <br>• npm: `npm pack <pkg>@<ver>` then `tar -xzf <pkg>-<ver>.tgz -C <RUN_DIR>source/<ARTIFACT_NAME> --strip-components=1` <br>• PyPI: `pip download --no-deps --no-binary=:all: -d <RUN_DIR>source/ <pkg>==<ver>` then unpack the sdist into `<RUN_DIR>source/<ARTIFACT_NAME>/` <br>• RubyGems: `gem fetch <pkg> -v <ver>` then `gem unpack <pkg>-<ver>.gem --target=<RUN_DIR>source/` <br>• crates.io: `cargo download <pkg>==<ver> -x -o <RUN_DIR>source/<ARTIFACT_NAME>/` (or fetch the `.crate` and `tar -xzf` it) |
| **Protocol / API** | `curl -fsSL <spec-url> -o <RUN_DIR>source/<ARTIFACT_NAME>/<filename>` (repeat per document). `version_pin` = the document's published revision if stated in the spec, otherwise the ISO-8601 fetch date. `source_path` = `<RUN_DIR>source/<ARTIFACT_NAME>`. |

Update `SOURCE_PATH` and `SOURCE_VERSION` in Run State from `<RUN_DIR>provenance.json` (the `source_path` and `version_pin` fields, respectively). From Phase 1 onward, all agent prompts derive `<SOURCE_PATH>` and `<SOURCE_VERSION>` from `<RUN_DIR>provenance.json`.

## Phase 1: Read the Source

Examine the original to document **what it does**, **how it does the parts worth preserving**, and capture **behavioural fixtures** for verification.

**BLOCKING**: Complete the reading before moving to Phase 2.

Launch as a `Task()` agent. This agent reads the original freely. Its output goes to disk; the orchestrator reads those files afterward. Unlike clean-room, there is no contamination concern — the implementation agent will see the same source material itself.

Per the substitution contract above, replace every `<UPPER_SNAKE>` token in the prompt body with its Run State value before invoking. Leave the `[bracket]` scaffolds inside the example artifact templates untouched — those are for the spawned agent to fill.

```
Task(
  description: "Dirty-room reading: examine original artifact for port",
  prompt: """
  ## Role: Reading Agent

  Examine the original artifact and produce three deliverables:
  1. A discovery document (behaviour and noteworthy internals)
  2. A behavioural fixtures file
  3. A translation brief (how to carry this across the language boundary)

  Target: <ARTIFACT_NAME>
  Scope: <SCOPE>
  Provenance: <RUN_DIR>provenance.json is authoritative for SOURCE_PATH and SOURCE_VERSION; read it before starting.
  Source version: <SOURCE_VERSION>
  Source language: <SOURCE_LANG>
  Target language: <TARGET_LANG>
  Source path: <SOURCE_PATH>
  Run directory: <RUN_DIR>

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
  - **Source pattern**: the technique as expressed in <SOURCE_LANG>
  - **Target pattern**: the equivalent in <TARGET_LANG> — idiomatic, not literal
  - **Mapping notes**: gotchas, semantic differences, performance implications

  Cover at minimum:
  - Concurrency model translation (e.g. Promise → goroutine, callback → channel)
  - Error handling translation (e.g. exceptions → Result types, panics → errors)
  - Type system translation (e.g. structural → nominal, generics differences)
  - Memory and lifetime model (e.g. GC → ownership, refcount → arena)
  - Standard-library substitutions for any std lib calls in the source
  - Idiom mismatches: places where the source is idiomatic in <SOURCE_LANG> but
    would be unidiomatic in <TARGET_LANG>, with proposed local equivalents

  Write to:
  - <RUN_DIR>discovery.md
  - <RUN_DIR>fixtures.md
  - <RUN_DIR>translation-brief.md

  All three files MUST include the source version in their header.
  """
)
```

### Reading output

Write to `<RUN_DIR>discovery.md`:

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

Write to `<RUN_DIR>fixtures.md`:

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

Write to `<RUN_DIR>translation-brief.md`:

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

**BLOCKING**: Do NOT start until the user approves Phase 1 output (per `APPROVAL_SIGNAL`).

### Specification rules

The spec describes behaviour, not mechanism — exactly as in clean-room. Keeping the spec clean means a future operator could promote this to a /sc-clean-room run if licence concerns surface. The translation brief is where mechanism lives.

1. **Describe behaviour, not mechanism.** "Returns the sorted elements" not "Uses quicksort with median-of-three pivot."
2. **Define contracts precisely.** Input types, output types, preconditions, postconditions.
3. **Enumerate edge cases.** Empty inputs, maximum sizes, malformed data.
4. **Specify error behaviour.** What errors occur, what information they carry.
5. **Leave implementation choices to the porter and the brief.** The spec says WHAT; the brief and the source say HOW.

Write to `<RUN_DIR>specification.md`:

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

The user's approval (per `APPROVAL_SIGNAL`) is the formal handoff.

## Phase 3: Port

**BLOCKING**: Do NOT start until the user approves Phase 2 output (per `APPROVAL_SIGNAL`).

Gather implementation preferences via `AskUserQuestion`. The user's answers populate `<IMPL_PREFS>` in Run State for use in the porting Task() prompt below:
- Full interface or vertical slice?
- Preferred architecture or patterns in the target language
- Test strategy (TDD from spec, tests after, both)
- Libraries or frameworks to use (or avoid)
- How aggressively to follow the source's structure (literal port → idiomatic re-expression)

Launch a `Task()` agent for implementation. This agent receives the spec, the brief, the path to the original source, and implementation preferences.

Per the substitution contract, replace every `<UPPER_SNAKE>` token in the prompt body with its resolved Run State value before invoking.

```
Task(
  description: "Dirty-room port: implement from spec, brief, and source",
  prompt: """
  ## Role: Porting Agent

  Build a port of <ARTIFACT_NAME> from <SOURCE_LANG> to <TARGET_LANG>.

  Specification: <RUN_DIR>specification.md
  Translation brief: <RUN_DIR>translation-brief.md
  Original source: <SOURCE_PATH>
  Source version: <SOURCE_VERSION>
  Output directory: <TARGET_PATH>
  Implementation preferences: <IMPL_PREFS>

  ## Authority hierarchy
  1. The specification is authoritative for behaviour. The port must satisfy it.
  2. The translation brief is the recommended HOW. Follow it unless target-language
     idiom strongly argues otherwise; record any deviation in your final summary.
  3. The original source is available for tie-breaking, clarifying ambiguity,
     and observing techniques marked "preserve" or "adapt" in the brief.

  ## Rules
  - Prefer idiomatic <TARGET_LANG> over a literal transcription.
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
  3. Scaffold project structure, dependencies, build tooling in <TARGET_LANG>
  4. Define types from the spec's interface section, in <TARGET_LANG> idiom
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

Write to `<RUN_DIR>verification.md`:

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
- **Reading** documented N interface elements, M behavioural contracts, K fixtures, P translation brief sections
- **Specification** covered N requirements
- **Port** produced [file count] files, [test count] tests
- **Verification** passed N/M spec requirements, K/K fixtures replayed

## Artifacts
- Discovery: `<RUN_DIR>discovery.md`
- Fixtures: `<RUN_DIR>fixtures.md`
- Specification: `<RUN_DIR>specification.md`
- Translation brief: `<RUN_DIR>translation-brief.md`
- Verification: `<RUN_DIR>verification.md`
- Port: `<TARGET_PATH>`

## Known Gaps
[Unimplemented or unverified requirements]

## Notable Brief Deviations
[Where the porter chose target-language idiom over the brief's recommendation]
```

## Phase 6: User Choice

Use `AskUserQuestion`:

| Option | Description |
|--------|-------------|
| Extend | Port more of the original; capture more fixtures and translation brief sections |
| Idiomatise | Revisit places where the port still reads as transcription, not translation |
| Harden | Focus on edge cases, error handling, and test coverage |
| Ship | Done. Package and finalise |

---

_Dirty-room design trades independence for fidelity. The wall would have prevented borrowing what the original got right; the absence of the wall obliges the porter to distinguish those things from idioms that do not survive the crossing. A literal transcription is no more a translation than a phonetic transliteration is a poem._

${ARGUMENTS}
