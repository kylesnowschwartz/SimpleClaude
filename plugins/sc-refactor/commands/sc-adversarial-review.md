---
name: sc-adversarial-review
description: Multi-model adversarial review using external AI CLIs (Codex, Gemini) and Claude for diverse-perspective fault finding
argument-hint: "[target: file/directory/staged/branch]"
---

# Multi-Model Adversarial Review

Three AI models (OpenAI Codex, Google Gemini, Claude) independently review code with an attacker's mindset. Value comes from **model diversity** — different architectures, different training data, different blind spots. Where they agree, high confidence. Where they diverge, that's where the interesting findings live.

## Phase 1: Resolve Target & Check Tools

### Determine review scope

Parse $ARGUMENTS :

| Argument | Scope | Codex invocation | Gemini target |
|----------|-------|-----------------|---------------|
| *(empty)* | Uncommitted changes | `codex review --uncommitted` | `"Review uncommitted changes in this repo"` |
| `staged` | Uncommitted changes | `codex review --uncommitted` | `"Review uncommitted changes in this repo"` |
| `branch` | Current branch vs main | `codex review --base main` | `"Review changes on this branch vs main"` |
| File path | Specific file | `codex exec -s read-only` | `"Review [path]"` |
| Directory | Specific directory | `codex exec -s read-only` | `"Review code in [path]"` |

### Check CLI availability

!`codex --version 2>&1 && gemini --version 2>&1`

| Available | Action |
|-----------|--------|
| Both | Run all three models (Codex + Gemini + Claude) |
| One CLI only | Run that CLI + Claude (2 perspectives) |
| Neither | Stop. Tell the user: `npm install -g @openai/codex` and `brew install gemini-cli` |

## Phase 2: Launch External Reviews

Run both CLI commands in parallel using Bash with `run_in_background: true`. Set timeout to 180 seconds.

### Codex

Codex is git-aware and understands diffs natively. Use `codex review` for git targets, `codex exec` for file/directory targets.

**Git targets (uncommitted or branch):**

```bash
codex review [--uncommitted|--base main] \
  "Adversarial review. Find concrete failure modes: race conditions, missing error handling, unstated assumptions, boundary violations, and edge cases that tests don't cover. For each finding, state the specific scenario that triggers it and what breaks." \
  2>&1 | tee /tmp/adversarial-codex.txt
```

**File or directory target:**

```bash
codex exec -s read-only \
  "Adversarial review of [target]. Find ways this code breaks. For each finding: the concrete failure scenario, what triggers it, and the impact." \
  -o /tmp/adversarial-codex.txt
```

### Gemini

Gemini uses prompt-based analysis. Flags MUST come before `-p` (it is a string flag that consumes the next argument as the prompt value).

```bash
gemini -y -p \
  "Adversarial code review of [target description]. Your goal is to find ways this code breaks. For each finding state: WHAT breaks, the SPECIFIC trigger scenario, and the IMPACT. Focus on: assumptions that could be violated, missing error paths, resource leaks, security boundaries, concurrency issues." \
  2>&1 | tee /tmp/adversarial-gemini.txt
```

## Phase 3: Claude's Adversarial Pass

While external CLIs run, perform your own adversarial analysis of the target.

1. **Read the target** using Read, Grep, Glob — understand what you're reviewing.

2. **Apply these adversarial lenses:**

   **Premortem**: This code shipped and caused a production incident. Working backward — what was the root cause? What warning signs were rationalized away?

   **Mutation probing**: What if this operator were reversed? This condition negated? This constant off by one? Would existing tests catch the change?

   **Assumption surfacing**: What must be true for this code to work correctly? Consider: input format and range, ordering guarantees, concurrency safety, environmental dependencies, network reliability, time sensitivity.

   **STRIDE-lite**: For security-relevant code, briefly consider each component: Can identity be faked? Can data be tampered in transit? Can information leak? Can availability be disrupted? Can privileges be escalated?

3. **Record your findings** — keep them in the same structured format used in Phase 4.

## Phase 4: Synthesize

Read `/tmp/adversarial-codex.txt` and `/tmp/adversarial-gemini.txt`. Combine with your own findings from Phase 3.

### Categorization Rules

- **Consensus**: Two or more models flagged the same underlying issue (even with different wording). Highest confidence.
- **Unique**: Only one model flagged it. Worth investigating — could be a genuine blind spot the other models missed, or a false positive.
- **Divergent**: Models actively disagree about whether something is a problem or about the correct approach. Most interesting category.

### Synthesis Rules

- **Deduplicate**: Same issue described differently by two models = one consensus finding, not two unique findings.
- **Attribute**: Always state which model(s) found each issue.
- **Assess disputes**: When models disagree, state which position is technically correct and why.
- **No padding**: If a model found nothing, say so. Don't manufacture findings for symmetry.
- **Severity order**: Within each section, order by impact: data loss > incorrect behavior > security > performance > style.

### Output Format

```
# Adversarial Review: [target]

**Models**: Codex (gpt-5.3-codex) + Gemini (gemini-3-pro-preview) + Claude
**Target**: [what was reviewed]
**Scope**: [uncommitted | branch vs main | specific path]

---

## Consensus Findings
[Multiple models flagged — fix these]

**BREAK**: [concrete failure mode]
Source: [which models agreed]
Location: [file:line]
Scenario: [specific conditions that trigger it]
Impact: [what goes wrong]

---

## Unique Findings
[One model caught this — investigate]

**BREAK**: [concrete failure mode]
Source: Codex | Gemini | Claude
Location: [file:line]
Scenario: [specific trigger]
Impact: [what goes wrong]

---

## Divergent Analysis
[Models disagree — most interesting section]

**DISPUTE**: [topic]
- Codex: [position]
- Gemini: [position]
- Claude: [position]
- **Assessment**: [which is correct and why]

---

## Summary
- Models used: [N of 3]
- Consensus findings: N (high confidence)
- Unique findings: N (investigate)
- Disputes: N (interesting)
```

## Phase 5: User Choice

After presenting the synthesis, use AskUserQuestion:

| Option | Label | Description |
|--------|-------|-------------|
| report-only | Just the report | Output is complete, stop here |
| fix-plan | Generate fix plan | Step-by-step remediation for each finding |
| deep-dive | Deep dive | Re-run specific findings through all models with targeted prompts |

### If "Generate fix plan":

For each consensus and confirmed unique finding:

```
### [Finding title]
**Files**: [list]
**Steps**:
1. [specific action]
2. [specific action]
**Verification**: [how to confirm it's fixed]
```

### If "Deep dive":

Ask which findings to investigate. For each selected finding, construct a targeted prompt about that specific issue and re-run it through available CLIs. Report the deeper analysis.

### If "Just the report":

Done.

## Important

- Both CLIs operate on the working directory. Do NOT pipe file contents via `$(cat file)` — let them read files directly.
- If a CLI fails with a syntax error, run `<tool> --help` to verify current flags before retrying.
- If a CLI prints an upgrade notice, inform the user. Do NOT auto-upgrade.
- If a CLI produces empty output or errors, note it in the synthesis and proceed with remaining models.
- Two models finding nothing is a meaningful data point — it suggests the code may be solid.
