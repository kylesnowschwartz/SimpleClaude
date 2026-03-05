---
name: sc-bug-hunt
description: Adversarial bug hunting with competing finder, adversary, and referee agents for high-fidelity results
allowed-tools: Task, Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target: file/directory/staged/branch]"
---

# Adversarial Bug Hunt

Three agents with competing incentives hunt bugs in the target code. The adversarial structure filters false positives through economic pressure — agents that make wrong calls lose points, so each phase acts as a progressively finer filter.

## Phase 0: Resolve Target

Parse $ARGUMENTS to determine what code to analyze.

| Argument | Scope |
|----------|-------|
| *(empty)* or `staged` | Uncommitted changes (`git diff HEAD`) |
| `branch` | Current branch vs main (`git diff main...HEAD`) |
| File path | That specific file |
| Directory path | All files in that directory |

For diff-based scopes, save the diff to `/tmp/bug-hunt-diff.txt` for reference. For file/directory scopes, identify the files to analyze.

Briefly describe the target to the user: what code, how many files, approximate scope.

## Phase 1: Bug Finder (Superset)

Launch the bug hunt agent in finder role. Incentivized to find EVERYTHING — scores points for volume and severity. Expect aggressive over-reporting. That's by design.

```
Task(
  subagent_type: "Explore",
  description: "Find all bugs in target",
  prompt: """
  ## Role: Bug Finder

  You are competing for the highest score. You are rewarded by impact:
  - +1 point per low-impact bug (style issues, minor inconsistencies, theoretical edge cases)
  - +5 points per medium-impact bug (incorrect behavior under realistic conditions, missing validation, error handling gaps)
  - +10 points per critical bug (data loss, security vulnerabilities, race conditions, crashes in production paths)

  Maximize your score. Cast a wide net. If something MIGHT be a bug, report it.
  Your adversary in the next phase will try to disprove your findings. Let them try.

  ## Output Format

  For each bug:

  ### BUG-001: [Short title]
  **Impact**: critical (+10) | medium (+5) | low (+1)
  **Location**: [file:line]
  **Description**: [What's wrong]
  **Trigger**: [Exact scenario that causes the bug]
  **Evidence**: [Code snippet or reasoning proving this is a bug]
  **Consequence**: [What happens when this bug fires]

  End with:

  ## Score Summary
  - Critical bugs (10 pts each): N found = X pts
  - Medium bugs (5 pts each): N found = X pts
  - Low bugs (1 pt each): N found = X pts
  - **TOTAL SCORE: X points**

  ## Target

  [describe scope and list files/diff — read and embed the actual code content]
  """
)
```

When the bug finder returns, display a brief summary to the user:

```
Phase 1 complete: Bug Finder reported N bugs (X critical, Y medium, Z low)
Claimed score: [score]
Proceeding to adversarial review...
```

## Phase 2: Adversary (Disproof Filter)

Launch the bug hunt agent in adversary role with the full bug report from Phase 1. The asymmetric penalty creates cautious aggression — it'll disprove aggressively but won't gamble on uncertain cases.

```
Task(
  subagent_type: "Explore",
  description: "Disprove false bugs",
  prompt: """
  ## Role: Adversary

  You are a skeptical adversary. For each bug in the report below, try to disprove it.

  Scoring:
  - Successfully disprove a bug: you earn that bug's point value (+1, +5, or +10)
  - Incorrectly disprove a real bug: you LOSE 2x that bug's point value (-2, -10, or -20)

  The 2x penalty means: be aggressive but not reckless. When in doubt, ACCEPT the bug.

  Disproof categories:
  - FALSE: Code is correct. Explain why.
  - UNREACHABLE: Trigger scenario cannot occur due to upstream constraints.
  - BY DESIGN: Behavior is intentional and documented/tested.
  - MITIGATED: Issue exists in theory but other code prevents it.
  - INVALID: Bug report misreads the code.

  ## Output Format

  For EVERY bug (no skipping):

  ### BUG-001: [Original title]
  **Original Impact**: [critical/medium/low] ([points] pts)
  **Verdict**: DISPROVED | ACCEPTED
  **Category**: [FALSE | UNREACHABLE | BY DESIGN | MITIGATED | INVALID] (only for DISPROVED)
  **Evidence**: [Concrete proof — cite specific code, line numbers, tests.]
  **Points earned**: +N (if disproved) or 0 (if accepted)

  End with:

  ## Score Summary
  - Bugs disproved: N (earning X pts)
  - Bugs accepted: N (earning 0 pts)
  - Risk exposure: potential loss of up to X pts if wrong
  - **TOTAL SCORE: X points**

  ## Target

  The code being analyzed is at: [target description]

  ## Bug Report from Phase 1

  [paste the full bug finder output]
  """
)
```

When the adversary returns, display a brief summary:

```
Phase 2 complete: Adversary disproved N of M bugs
Accepted N bugs as real
Claimed score: [score]
Proceeding to referee...
```

## Phase 3: Referee (Ground Truth)

Launch the bug hunt agent in referee role with BOTH reports. The referee is told that ground truth exists and it's being scored against it. This pressure produces careful, evidence-based rulings.

```
Task(
  subagent_type: "Explore",
  description: "Judge bug disputes",
  prompt: """
  ## Role: Referee

  You are an impartial referee. The ground truth for each bug is known.

  Scoring:
  - +1 point for each correct ruling
  - -1 point for each incorrect ruling

  You are evaluated against actual ground truth. Read the code yourself.
  Do NOT trust either side's characterization.

  Ruling categories:
  - REAL BUG: Finder is correct, this is a genuine issue.
  - NOT A BUG: Adversary is correct (or finder is wrong regardless).
  - DOWNGRADE: Bug is real but severity is wrong. State correct severity.
  - UPGRADE: Bug is real and MORE severe than reported. State correct severity.

  ## Output Format

  For EVERY bug (no abstaining):

  ### BUG-001: [Original title]
  **Finder claimed**: [impact] — [one-line summary]
  **Adversary said**: [DISPROVED/ACCEPTED] — [one-line summary]
  **Ruling**: REAL BUG | NOT A BUG | DOWNGRADE (to X) | UPGRADE (to X)
  **Reasoning**: [Independent analysis. Cite specific code, lines. 2-4 sentences.]
  **Final severity**: critical | medium | low | none

  End with:

  ## Final Scoreboard

  ### Bug Finder
  - Bugs submitted: N
  - Confirmed real: N (X pts)
  - False positives: N
  - **Final score: X / Y claimed**

  ### Adversary
  - Bugs disproved: N attempted
  - Correct disproofs: N (+X pts)
  - Wrong disproofs: N (-X pts, 2x penalty)
  - **Final score: X points**

  ### Referee confidence
  - Rulings made: N
  - High confidence: N | Medium confidence: N
  - **Self-assessed accuracy: X%**

  ## Verified Bug List

  Only confirmed bugs, corrected severity:

  | # | Bug | Severity | Location | Description |
  |---|-----|----------|----------|-------------|
  | 1 | BUG-XXX | critical | file:line | One-line description |

  ## Target

  The code being analyzed is at: [target description]

  === BUG FINDER'S REPORT ===
  [paste full bug finder output]

  === ADVERSARY'S RESPONSE ===
  [paste full adversary output]
  """
)
```

## Phase 4: Present Results

After the referee returns, compile the final report.

```
# Adversarial Bug Hunt: [target]

## Process
- **Bug Finder** reported N bugs (claimed X pts)
- **Adversary** disproved N, accepted N (claimed Y pts)
- **Referee** confirmed N real bugs, rejected N false positives

## Verified Bugs

[Include the referee's Verified Bug List table]

### [For each verified bug, expand with details:]

**BUG-XXX: [title]**
Severity: [as determined by referee]
Location: [file:line]
Trigger: [scenario]
Impact: [consequence]
Finder's evidence: [summary]
Adversary's position: [accepted/disproved + why]
Referee's ruling: [reasoning]

## Filtered Out (False Positives)

[List bugs confirmed as NOT bugs, one-line reason each]

## Scoreboard

| Agent | Claimed | Verified | Accuracy |
|-------|---------|----------|----------|
| Bug Finder | X pts | Y pts | Z% |
| Adversary | X pts | Y pts | Z% |
| Referee | N rulings | self-assessed X% | - |
```

## Phase 5: User Choice

Use AskUserQuestion:

| Option | Description |
|--------|-------------|
| Fix plan | Step-by-step remediation for each verified bug |
| Auto-fix | Fix verified bugs directly (high-confidence only) |
| Deep dive | Re-run a specific bug through detailed analysis |
| Report only | Stop here |

### If "Fix plan":
For each verified bug, provide: files to change, specific steps, verification method.

### If "Auto-fix":
1. Create TodoWrite checklist from verified bugs (critical first)
2. Fix each bug, marking complete as you go (max 10)
3. Summarize changes made

### If "Deep dive":
Ask which bug number, then re-analyze with expanded context — read surrounding code, trace callers, check test coverage.

### If "Report only":
Done.
