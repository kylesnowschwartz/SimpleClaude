---
name: sc-adversarial-review
description: Multi-model adversarial review using external AI CLIs (Codex, Gemini) and Claude for diverse-perspective critique of any target
allowed-tools: Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target: file/directory/staged/branch] [context hint]"
---

# Multi-Model Adversarial Review

Three AI models (Codex, Gemini, Claude) independently review a target with an adversarial mindset. Model diversity surfaces blind spots that single-model review misses.

## Phase 1: Resolve Target, Classify Content

Parse $ARGUMENTS to determine review scope and content type.

### Scope resolution

| Argument               | Scope                  |
| ----------             | -------                |
| *(empty)* or `staged`  | Uncommitted changes    |
| `branch`               | Current branch vs main |
| File or directory path | That specific target   |

### Content classification

Read the target and classify it. The user may include a hint in $ARGUMENTS (e.g., "review this plan", "check this email"). If no hint, infer from the content:

| Type | Signals | Core adversarial question |
|------|---------|--------------------------|
| **Code** | Diffs, source files (.rb, .py, .js, .go, etc.), test files | What breaks, when, and why? |
| **Plan/Design** | PLAN.md, DESIGN.md, ARCHITECTURE.md, .agent-history/ docs, implementation plans, ADRs | What's missing, infeasible, or underestimated? |
| **Reasoning** | Analysis documents, investigations, decision records, arguments, trade-off evaluations | Where does the logic fail or the evidence fall short? |
| **Communication** | Emails, PR descriptions, RFCs, proposals, announcements, documentation for humans | What will be misunderstood or misinterpreted? |
| **General** | Config files, schemas, diagrams, prompt definitions, mixed-content, or anything that doesn't clearly match above | What's inconsistent, incomplete, or misleading? |

Default to **General** when classification is uncertain rather than forcing a bad fit. The user can always override via a hint in $ARGUMENTS.

Check CLI availability: `codex --version` and `gemini --version`. Proceed with whatever's available. If neither is installed, stop and tell the user to install them.

## Phase 2: Launch External Reviews

Reference the `/sc-skills:external-agents` skill for CLI invocation patterns, flag reference, and model configuration.

Run both CLIs in parallel using Bash with `run_in_background: true`. Timeout: 180 seconds.

### Adversarial prompt

Select the core prompt based on content type, then adapt it to each CLI's interface:

**Code:**
> Find concrete failure modes in this code. For each finding state: WHAT breaks, the SPECIFIC scenario that triggers it, and the IMPACT. Focus on: race conditions, missing error handling, unstated assumptions, boundary violations, and edge cases that tests don't cover.

**Plan/Design:**
> Critique this plan adversarially. For each finding state: WHAT is wrong, WHY it matters, and WHAT would happen if the plan is followed as-is. Focus on: missing steps, unstated dependencies, infeasible timelines or assumptions, alternatives not considered, risks that aren't acknowledged, and complexity that is underestimated.

**Reasoning:**
> Challenge this reasoning adversarially. For each finding state: WHERE the argument is weak, WHY it doesn't hold, and WHAT alternative conclusion is supported. Focus on: logical fallacies, confirmation bias, insufficient evidence, unstated premises, cherry-picked examples, and alternative explanations that weren't considered.

**Communication:**
> Review this communication adversarially from the reader's perspective. For each finding state: WHAT will confuse the reader, WHY it's ambiguous, and WHAT misinterpretation is likely. Focus on: unclear expectations, missing context, assumptions about reader knowledge, ambiguous phrasing, wrong tone for audience, and action items that aren't explicit.

**General:**
> Critique this artifact adversarially. For each finding state: WHAT is wrong or missing, WHY it matters, and WHAT consequence follows. Focus on: internal inconsistencies, unstated assumptions, completeness gaps, fitness for its stated purpose, and ways it could silently fail or mislead.

### CLI invocation

**Codex** — map scope to the correct subcommand and flags:

Note: `codex review` does not allow combining `--base`/`--uncommitted` with a `[PROMPT]` positional argument (they are mutually exclusive in clap). For scopes that need a custom prompt, pipe the diff to `codex exec` instead.

| Scope | Command |
|-------|---------|
| Uncommitted/staged | `git diff HEAD \| codex exec -s read-only "ADVERSARIAL_PROMPT"` |
| Branch vs main | `git diff main...HEAD \| codex exec -s read-only "ADVERSARIAL_PROMPT"` |
| File or directory | `codex exec -s read-only "ADVERSARIAL_PROMPT for [path]"` |

Capture output: `2>&1 \| tee /tmp/adversarial-codex.txt`

**Gemini** — always use headless mode with the adversarial prompt piped to `-p`:

| Scope | Command |
|-------|---------|
| Uncommitted/staged | `git diff HEAD \| gemini -p "ADVERSARIAL_PROMPT"` |
| Branch vs main | `git diff main...HEAD \| gemini -p "ADVERSARIAL_PROMPT"` |
| File or directory | `gemini -p "ADVERSARIAL_PROMPT for [path]"` |

Capture output: `2>&1 \| tee /tmp/adversarial-gemini.txt`

## Phase 3: Claude's Adversarial Pass

While external CLIs run, perform your own adversarial analysis of the target using Read, Grep, Glob.

Select analysis lenses based on content type:

### Code lenses
- **Premortem**: This code caused a production incident. What was the root cause? What warning signs were rationalized away?
- **Mutation probing**: What if this operator were reversed? This condition negated? This constant off by one? Would tests catch it?
- **Assumption surfacing**: What must be true for this to work? Input format, ordering, concurrency, environment, network, time.
- **STRIDE-lite**: For security-relevant code — can identity be faked? Data tampered? Information leaked? Availability disrupted? Privileges escalated?

### Plan/Design lenses
- **Gap analysis**: What steps are missing? What happens between step N and step N+1 that isn't addressed?
- **Stress test**: What if the key assumption is wrong? What if the dependency is unavailable? What if the data volume is 10x the estimate?
- **Devil's alternative**: What approach was NOT considered? Why might a completely different strategy work better?
- **Dependency chain**: What external factors could invalidate this plan? What's the blast radius if one piece fails?

### Reasoning lenses
- **Steel-man the opposite**: Construct the strongest argument against this conclusion. Does it hold?
- **Evidence audit**: Is each claim supported? Is supporting evidence cherry-picked, anecdotal, or generalizable?
- **Hidden premises**: What unstated assumptions connect the evidence to the conclusion? Are they justified?
- **Alternative explanations**: What other conclusions fit the same evidence equally well?

### Communication lenses
- **Hostile reader**: Someone who wants to misunderstand will latch onto what?
- **Missing context**: What does the writer know that the reader doesn't? Where is that gap widest?
- **Action clarity**: If the reader has to do something, is it unambiguous what, when, and why?
- **Tone calibration**: Does the tone match the relationship, stakes, and audience expectations?

### General lenses
- **Internal consistency**: Does the artifact contradict itself? Do different sections agree on facts, terminology, and intent?
- **Completeness**: What's defined but not used? Referenced but not defined? Implied but not stated?
- **Fitness for purpose**: Does this actually achieve what it claims to? Where does it fall short of its own stated goals?
- **Silent failure modes**: How could this be used correctly yet produce wrong results? What guardrails are missing?

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

Severity ordering by content type:

| Code | Plan/Design | Reasoning | Communication | General |
|------|-------------|-----------|---------------|---------|
| data loss | missing critical step | invalid conclusion | dangerous ambiguity | internal contradiction |
| incorrect behavior | infeasible assumption | insufficient evidence | missing action items | completeness gap |
| security vulnerability | unacknowledged risk | logical fallacy | wrong audience assumption | silent failure mode |
| performance issue | underestimated complexity | confirmation bias | unclear expectations | unfit for purpose |
| maintainability | missing alternative | unstated premise | tone mismatch | unstated assumption |

### Output Format

```
# Adversarial Review: [target]

**Models**: [which participated]
**Scope**: [uncommitted | branch vs main | specific path]
**Content type**: [Code | Plan/Design | Reasoning | Communication | General]

## Consensus Findings

**FINDING**: [concrete issue]
Source: [which models]
Location: [file:line or section reference]
Scenario: [trigger conditions or context]
Impact: [what goes wrong or is missed]

## Unique Findings

**FINDING**: [concrete issue]
Source: Codex | Gemini | Claude
Location: [file:line or section reference]
Scenario: [trigger or context]
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
