---
name: sc-adversarial-hunt
description: General-purpose adversarial analysis with competing finder, skeptic, and arbiter agents. Works on code, plans, docs, configs, or any artifact.
allowed-tools: Task, Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target] [optional: focus hint e.g. 'security', 'architecture', 'accuracy']"
---

# Adversarial Hunt

Three agents with competing economic incentives analyze any target. A maximizer finds all possible issues, a skeptic filters false positives through asymmetric penalties, and an arbiter produces the final ground-truth ruling. Domain-agnostic — works on code, plans, documentation, configs, reasoning, or any artifact.

## EXECUTION MODEL: STRICTLY SEQUENTIAL

**Phases 2, 3, and 4 MUST run in strict sequence. NEVER launch them in parallel.**

Each phase depends on the previous phase's output:
- Phase 2 (Maximizer) runs first, produces findings
- Phase 3 (Skeptic) REQUIRES the Maximizer's findings as input — cannot start until Phase 2 completes
- Phase 4 (Arbiter) REQUIRES both Maximizer AND Skeptic reports as input — cannot start until Phase 3 completes

**After each Task() call, you MUST wait for the task to complete and read its output before proceeding to the next phase.** Use `TaskOutput` with `block: true` to wait. Display the phase summary to the user. Only then move to the next phase.

## Phase 0: Resolve Target and Classify

Parse $ARGUMENTS. The first argument is the target, anything after is a focus hint.

### Target resolution

| Argument | Target |
|----------|--------|
| *(empty)* or `staged` | Uncommitted changes — run `git diff HEAD` |
| `branch` | Current branch vs main — run `git diff main...HEAD` |
| `pr <number>` | PR diff — run `gh pr diff <number>` |
| File or directory path | That specific path |

For diff-based targets, save the diff to `/tmp/adversarial-hunt-diff.txt` and verify non-empty. This file is referenced by agents.

### Deep read

Before classifying or generating lenses, YOU (the orchestrator) must actually read the target thoroughly:

- For diffs: read the diff AND the changed source files. Understand what the code does, not just what changed.
- For files/directories: read the files, check imports, trace key call paths with Grep.
- For plans/docs: read the full document and any referenced files.

This deep read is what makes the lenses specific rather than generic. Skip it and the whole process degrades.

### Classification

| Domain | Signals |
|--------|---------|
| **Code** | Source files, diffs, test files |
| **Plan/Design** | PLAN.md, ARCHITECTURE.md, ADRs, implementation plans |
| **Documentation** | README, API docs, guides, comments |
| **Configuration** | YAML, JSON configs, CI/CD pipelines, infrastructure |
| **Reasoning** | Analysis documents, investigations, decision records, trade-off evaluations |
| **Communication** | Emails, PR descriptions, RFCs, proposals, announcements |

Tell the user: "Target: [what]. Domain: [classified]. Focus: [hint or inferred]."

## Phase 1: Generate Lenses

Before launching any agents, generate three domain-specific artifacts from your Phase 0 deep read:

### 1. Analysis Lenses (for the Maximizer)

Generate 5-8 concrete lenses appropriate to the domain and target. Each lens is a specific angle of attack that references actual elements you found in the target.

Examples of what good lenses look like (do NOT copy these — generate fresh lenses from the actual target):

- Code: "Null propagation paths where X returns nil but Y assumes non-nil"
- Plan: "Dependencies between steps 3 and 7 that aren't acknowledged"
- Config: "Environment variables referenced but never defined"
- Docs: "API examples that contradict the parameter descriptions"

"Check error handling" is too vague. "Error handling gap in the retry loop at auth.rb:45 where TimeoutError isn't caught" is a lens.

### 2. Severity Scale (for scoring)

Define what +1, +5, and +10 mean for THIS domain and target:

```
+1  (low):    [domain-specific definition]
+5  (medium): [domain-specific definition]
+10 (critical): [domain-specific definition]
```

### 3. Disproof Categories (for the Skeptic)

Generate 4-6 categories for valid disproofs, specific to the domain:

```
- [CATEGORY]: [what it means for this domain]
```

Show all three artifacts to the user before proceeding. This lets them steer if the lenses are off-target.

## Phase 2: Maximizer (Superset)

**BLOCKING**: Launch the Maximizer agent. Wait for it to complete. Read its full output. Display the summary. Only then proceed to Phase 3.

The Maximizer has full read access to the codebase — point it at the files, don't paste content into the prompt.

For diff-based targets, tell the Maximizer where the diff file is AND which source files changed, so it can read both.

```
Task(
  subagent_type: "Explore",
  description: "Find all issues in target",
  prompt: """
  ## Role: Maximizer

  You are competing for the highest score. You are rewarded by impact:
  - +1 point: [GENERATED low definition]
  - +5 points: [GENERATED medium definition]
  - +10 points: [GENERATED critical definition]

  Maximize your score. If something MIGHT be an issue, report it.
  Your adversary will try to disprove your findings. Let them try.

  ## Target

  [For diffs]: The diff is at /tmp/adversarial-hunt-diff.txt. The changed files are: [list paths]. Read both the diff and the source files for full context. Also read tests for the changed code if they exist.
  [For files]: Analyze these files: [list paths]. Read them and any closely related files (tests, callers, config).

  ## Analysis Lenses

  Examine the target through each of these lenses:
  [GENERATED lenses, numbered]

  You are not limited to these lenses. If you find issues outside them, report those too.

  ## Output Format

  ### FINDING-001: [Short title]
  **Impact**: critical (+10) | medium (+5) | low (+1)
  **Location**: [file:line, section reference, or specific element]
  **Description**: [What's wrong]
  **Trigger**: [Scenario or condition that causes the issue]
  **Evidence**: [Concrete proof — quote the artifact, cite specifics]
  **Consequence**: [What happens if this isn't addressed]

  End with:

  ## Score Summary
  - Critical (10 pts each): N = X pts
  - Medium (5 pts each): N = X pts
  - Low (1 pt each): N = X pts
  - **TOTAL SCORE: X points**
  """
)
```

Display summary: "Phase 2 complete: Maximizer reported N findings (X critical, Y medium, Z low). Claimed score: [score]."

**Store the Maximizer's full output — you will paste it into the Skeptic's prompt next.**

## Phase 3: Skeptic (Disproof Filter)

**BLOCKING**: This phase REQUIRES the Maximizer's completed output. Do NOT start until Phase 2 is done and you have read the full Maximizer report.

Launch the Skeptic agent. Paste the complete Maximizer report into the Skeptic's prompt (see `## Maximizer Report` section in the prompt template). The Skeptic also has independent file access to verify claims against the actual artifact.

```
Task(
  subagent_type: "Explore",
  description: "Disprove false findings",
  prompt: """
  ## Role: Skeptic

  For each finding in the report below, try to disprove it.

  Scoring:
  - Successful disproof: you earn the finding's point value (+1, +5, or +10)
  - Incorrect disproof: you LOSE 2x the finding's value (-2, -10, or -20)

  The 2x penalty means: be aggressive but not reckless. When in doubt, ACCEPT.

  ## Independent Verification

  Do NOT trust the Maximizer's description of the code. Read the actual files yourself.
  The Maximizer may have misquoted, mischaracterized, or cited the wrong line numbers.
  Every disproof must include YOUR OWN evidence from the actual artifact.

  [For diffs]: The diff is at /tmp/adversarial-hunt-diff.txt. Changed files: [list paths].
  [For files]: Target files: [list paths].

  Disproof categories:
  [GENERATED categories from Phase 1]

  ## Output Format

  For EVERY finding (no skipping):

  ### FINDING-001: [Original title]
  **Original Impact**: [level] ([points] pts)
  **Verdict**: DISPROVED | ACCEPTED
  **Category**: [disproof category] (only for DISPROVED)
  **Evidence**: [YOUR OWN evidence from reading the actual files. Cite specifics.]
  **Points earned**: +N (if disproved) or 0 (if accepted)

  End with:

  ## Score Summary
  - Findings disproved: N (earning X pts)
  - Findings accepted: N (earning 0 pts)
  - Risk exposure: potential loss of up to X pts if wrong
  - **TOTAL SCORE: X points**

  ## Maximizer Report

  [paste the full maximizer output]
  """
)
```

Display summary: "Phase 3 complete: Skeptic disproved N of M findings. Accepted N."

**Store the Skeptic's full output — you will paste both reports into the Arbiter's prompt next.**

## Phase 4: Arbiter (Ground Truth)

**BLOCKING**: This phase REQUIRES both the Maximizer's AND Skeptic's completed outputs. Do NOT start until Phase 3 is done and you have read the full Skeptic report.

Launch the Arbiter agent. Paste both complete reports into the Arbiter's prompt (see `=== MAXIMIZER'S REPORT ===` and `=== SKEPTIC'S RESPONSE ===` sections in the prompt template). The Arbiter also has independent file access.

```
Task(
  subagent_type: "Explore",
  description: "Judge disputed findings",
  prompt: """
  ## Role: Arbiter

  You are an impartial judge. The ground truth for each finding is known.

  Scoring:
  - +1 for each correct ruling
  - -1 for each incorrect ruling

  You are evaluated against actual ground truth. Examine the artifact yourself.
  Do NOT trust either side's characterization.

  [For diffs]: The diff is at /tmp/adversarial-hunt-diff.txt. Changed files: [list paths].
  [For files]: Target files: [list paths].

  Ruling categories:
  - CONFIRMED: Maximizer is correct, this is a genuine issue.
  - REJECTED: Skeptic is correct (or maximizer is wrong). Not a real issue.
  - DOWNGRADE: Issue is real but severity is wrong. State correct severity.
  - UPGRADE: Issue is real and MORE severe than reported. State correct severity.

  ## Output Format

  For EVERY finding (no abstaining):

  ### FINDING-001: [Original title]
  **Maximizer claimed**: [impact] — [one-line summary]
  **Skeptic said**: [DISPROVED/ACCEPTED] — [one-line summary]
  **Ruling**: CONFIRMED | REJECTED | DOWNGRADE (to X) | UPGRADE (to X)
  **Reasoning**: [Independent analysis. Cite the artifact directly. 2-4 sentences.]
  **Final severity**: critical | medium | low | none

  End with:

  ## Final Scoreboard

  ### Maximizer
  - Findings submitted: N
  - Confirmed: N (X pts)
  - False positives: N
  - **Final score: X / Y claimed**

  ### Skeptic
  - Disproofs attempted: N
  - Correct disproofs: N (+X pts)
  - Wrong disproofs: N (-X pts, 2x penalty)
  - **Final score: X points**

  ### Arbiter confidence
  - Rulings made: N
  - High confidence: N | Medium confidence: N
  - **Self-assessed accuracy: X%**

  ## Verified Findings

  Only confirmed issues, corrected severity:

  | # | Finding | Severity | Location | Description |
  |---|---------|----------|----------|-------------|
  | 1 | FINDING-XXX | critical | location | One-line description |

  === MAXIMIZER'S REPORT ===
  [paste full maximizer output]

  === SKEPTIC'S RESPONSE ===
  [paste full skeptic output]
  """
)
```

## Phase 5: Present Results

```
# Adversarial Hunt: [target]
**Domain**: [classified domain] | **Focus**: [hint or inferred]

## Process
- **Maximizer** reported N findings (claimed X pts)
- **Skeptic** disproved N, accepted N (claimed Y pts)
- **Arbiter** confirmed N real issues, rejected N false positives

## Verified Findings

[Include the arbiter's Verified Findings table]

### [For each verified finding, expand:]

**FINDING-XXX: [title]**
Severity: [as determined by arbiter]
Location: [reference]
Trigger: [scenario/condition]
Impact: [consequence]
Maximizer's evidence: [summary]
Skeptic's position: [accepted/disproved + why]
Arbiter's ruling: [reasoning]

## Filtered Out (False Positives)

[List rejected findings, one-line reason each]

## Scoreboard

| Agent | Claimed | Verified | Accuracy |
|-------|---------|----------|----------|
| Maximizer | X pts | Y pts | Z% |
| Skeptic | X pts | Y pts | Z% |
| Arbiter | N rulings | self-assessed X% | - |
```

## Phase 6: User Choice

Use AskUserQuestion:

| Option | Description |
|--------|-------------|
| Fix plan | Step-by-step remediation for each verified finding |
| Deep dive | Re-run a specific finding through detailed analysis |
| Report only | Stop here |
