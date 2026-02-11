---
name: sc-adversarial-review
description: Multi-model adversarial review using external AI CLIs (Codex, Gemini) and Claude for diverse-perspective fault finding
allowed-tools: Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target: file/directory/staged/branch]"
---

# Multi-Model Adversarial Review

Three AI models (Codex, Gemini, Claude) independently review code with an attacker's mindset. Model diversity surfaces blind spots that single-model review misses.

## Phase 1: Resolve Target & Check Tools

Parse $ARGUMENTS to determine review scope:

| Argument               | Scope                  |
| ----------             | -------                |
| *(empty)* or `staged`  | Uncommitted changes    |
| `branch`               | Current branch vs main |
| File or directory path | That specific target   |

Check CLI availability: `codex --version` and `gemini --version`. Proceed with whatever's available. If neither is installed, stop and tell the user to install them.

## Phase 2: Launch External Reviews

Reference the `/sc-skills:external-agents` skill for CLI invocation patterns, flag reference, and model configuration.

Run both CLIs in parallel using Bash with `run_in_background: true`. Timeout: 180 seconds.

### Adversarial prompt

Adapt this core prompt to each CLI's interface:

> Find concrete failure modes in this code. For each finding state: WHAT breaks, the SPECIFIC scenario that triggers it, and the IMPACT. Focus on: race conditions, missing error handling, unstated assumptions, boundary violations, and edge cases that tests don't cover.

**Codex**: Use `codex review` for git targets (uncommitted/branch), `codex exec -s read-only` for file/directory targets. Capture output to `/tmp/adversarial-codex.txt`.

**Gemini**: Use `gemini -p` with the adversarial prompt. Capture output to `/tmp/adversarial-gemini.txt`.

## Phase 3: Claude's Adversarial Pass

While external CLIs run, perform your own adversarial analysis of the target using Read, Grep, Glob.

Apply these lenses:

- **Premortem**: This code caused a production incident. What was the root cause? What warning signs were rationalized away?
- **Mutation probing**: What if this operator were reversed? This condition negated? This constant off by one? Would tests catch it?
- **Assumption surfacing**: What must be true for this to work? Input format, ordering, concurrency, environment, network, time.
- **STRIDE-lite**: For security-relevant code — can identity be faked? Data tampered? Information leaked? Availability disrupted? Privileges escalated?

## Phase 4: Synthesize

Read `/tmp/adversarial-codex.txt` and `/tmp/adversarial-gemini.txt`. Combine with your Phase 3 findings.

### Categorization

- **Consensus**: Multiple models flagged the same issue. Highest confidence.
- **Unique**: One model only. Investigate — blind spot or false positive.
- **Divergent**: Models disagree. Most interesting category.

### Rules

- Deduplicate: same issue, different wording = one consensus finding.
- Attribute: always state which model(s) found each issue.
- Assess disputes: state which position is technically correct and why.
- No padding: if a model found nothing, say so.
- Severity order: data loss > incorrect behavior > security > performance > style.

### Output Format

```
# Adversarial Review: [target]

**Models**: [which participated]
**Scope**: [uncommitted | branch vs main | specific path]

## Consensus Findings

**BREAK**: [concrete failure mode]
Source: [which models]
Location: [file:line]
Scenario: [trigger conditions]
Impact: [what goes wrong]

## Unique Findings

**BREAK**: [concrete failure mode]
Source: Codex | Gemini | Claude
Location: [file:line]
Scenario: [trigger]
Impact: [consequence]

## Divergent Analysis

**DISPUTE**: [topic]
- Codex: [position]
- Gemini: [position]
- Claude: [position]
- **Assessment**: [which is correct and why]

## Summary
- Models used: N of 3
- Consensus: N | Unique: N | Disputes: N
```

## Phase 5: User Choice

Use AskUserQuestion:

| Option      | Description                                                       |
| --------    | -------------                                                     |
| Report only | Stop here                                                         |
| Fix plan    | Step-by-step remediation per finding (files, steps, verification) |
| Deep dive   | Re-run specific findings through all models with targeted prompts |
