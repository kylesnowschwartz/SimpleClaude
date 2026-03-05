---
name: sc-adversarial-hunt
description: General-purpose adversarial analysis with competing finder, skeptic, and arbiter agents. Works on code, plans, docs, configs, or any artifact.
allowed-tools: Task, Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target] [optional: focus hint e.g. 'security', 'architecture', 'accuracy']"
---

# Adversarial Hunt

Three agents with competing economic incentives analyze any target. A maximizer finds all possible issues, a skeptic filters false positives through asymmetric penalties, and an arbiter produces the final ground-truth ruling. Domain-agnostic — works on code, plans, documentation, configs, reasoning, or any artifact.

## Phase 0: Classify and Prepare

Parse $ARGUMENTS. The first argument is the target, anything after is a focus hint.

Read the target. Classify it into a domain:

| Domain | Signals |
|--------|---------|
| **Code** | Source files, diffs, test files |
| **Plan/Design** | PLAN.md, ARCHITECTURE.md, ADRs, implementation plans |
| **Documentation** | README, API docs, guides, comments |
| **Configuration** | YAML, JSON configs, CI/CD pipelines, infrastructure |
| **Reasoning** | Analysis documents, investigations, decision records, trade-off evaluations |
| **Communication** | Emails, PR descriptions, RFCs, proposals, announcements |

If the user provided a focus hint, use it to steer analysis. Otherwise infer from content.

Tell the user: "Target: [what]. Domain: [classified]. Focus: [hint or inferred]."

## Phase 1: Generate Lenses

This is the critical step. Before launching any agents, YOU (the orchestrator) must generate three domain-specific artifacts by analyzing the target:

### 1. Analysis Lenses (for the Maximizer)

Generate 5-8 concrete lenses appropriate to the domain and target. Each lens is a specific angle of attack.

Examples of what good lenses look like (do NOT copy these literally — generate fresh lenses from the actual target):

- Code: "Null propagation paths where X returns nil but Y assumes non-nil"
- Plan: "Dependencies between steps 3 and 7 that aren't acknowledged"
- Config: "Environment variables referenced but never defined"
- Docs: "API examples that contradict the parameter descriptions"

Lenses must reference specific elements of the target, not generic categories. "Check error handling" is too vague. "Error handling gap in the retry loop at auth.rb:45 where TimeoutError isn't caught" is a lens.

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

Launch the finder with your generated lenses baked into the prompt.

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

  ## Target

  [EMBED the actual target content here — read files and include them]
  """
)
```

Display summary: "Phase 2 complete: Maximizer reported N findings (X critical, Y medium, Z low). Claimed score: [score]."

## Phase 3: Skeptic (Disproof Filter)

Launch the skeptic with the full maximizer report and your generated disproof categories.

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

  Disproof categories:
  [GENERATED categories from Phase 1]

  ## Output Format

  For EVERY finding (no skipping):

  ### FINDING-001: [Original title]
  **Original Impact**: [level] ([points] pts)
  **Verdict**: DISPROVED | ACCEPTED
  **Category**: [disproof category] (only for DISPROVED)
  **Evidence**: [Concrete proof. Cite specifics from the actual artifact.]
  **Points earned**: +N (if disproved) or 0 (if accepted)

  End with:

  ## Score Summary
  - Findings disproved: N (earning X pts)
  - Findings accepted: N (earning 0 pts)
  - Risk exposure: potential loss of up to X pts if wrong
  - **TOTAL SCORE: X points**

  ## Target

  The artifact being analyzed: [target description]

  ## Maximizer Report

  [paste the full maximizer output]
  """
)
```

Display summary: "Phase 3 complete: Skeptic disproved N of M findings. Accepted N."

## Phase 4: Arbiter (Ground Truth)

Launch the arbiter with both reports.

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

  ## Target

  The artifact being analyzed: [target description]

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
