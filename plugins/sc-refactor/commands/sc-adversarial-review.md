---
name: sc-adversarial-review
description: Multi-model adversarial review using external AI CLIs (Codex, Gemini) and Claude for diverse-perspective critique of any target
allowed-tools: Read, Bash, Grep, Glob, AskUserQuestion, TodoWrite
argument-hint: "[target: file/directory/staged/branch/pr] [context hint]"
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
| `pr <number>`          | PR diff from GitHub    |
| File or directory path | That specific target   |

For `pr` scope, extract the PR number from the argument. Supports `pr 15`, `pr #15`, or `pr https://github.com/owner/repo/pull/15`. Fetch the diff with `gh pr diff <number>` and save to `/tmp/adversarial-diff.txt`.

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

Check CLI availability: `codex --version 2>/dev/null`, `gemini --version 2>/dev/null`, and `gh --version` (required for `pr` scope). Record which CLIs are available. If neither Codex nor Gemini is installed, tell the user and proceed with Claude-only review.

## Phase 2: Launch External Reviews

Reference the `/sc-skills:external-agents` skill for CLI invocation patterns, flag reference, and model configuration.

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

### Prepare diff for Gemini

Codex has full tool access and can run `git diff` itself — no pre-saved diff needed. Gemini in headless mode cannot reliably access filesystem tools (known bug: folder trust check fails in `-p` mode). So save a diff file for Gemini only.

| Scope | Command |
|-------|---------|
| Uncommitted/staged | `git diff HEAD > /tmp/adversarial-diff.txt` |
| Branch vs main | `git diff main...HEAD > /tmp/adversarial-diff.txt` |
| PR | `gh pr diff <number> > /tmp/adversarial-diff.txt` |
| File or directory | `cat [path] > /tmp/adversarial-diff.txt` (or for directories: `find [path] -type f -name '*.rb' -exec cat {} + > /tmp/adversarial-diff.txt`) |

Verify non-empty: `wc -l /tmp/adversarial-diff.txt`. If 0 lines, tell the user and stop.

### CLI invocation

Launch both CLIs using Bash with `run_in_background: true`. No hard timeouts — these are agentic tools that take variable time depending on diff size and model load.

**Codex** — has `git`, filesystem tools, and a read-only sandbox. Tell it what to review and let it use its tools. Keep the prompt focused on the *task* (find bugs), not on *how* to get the data.

Build the scope instruction based on target:

| Scope | Scope instruction for prompt |
|-------|------------------------------|
| Uncommitted/staged | `Run git diff HEAD to see the uncommitted changes, then review them.` |
| Branch vs main | `Run git diff main...HEAD to see the branch changes, then review them. You can also read the changed files for full context.` |
| PR | `The file /tmp/adversarial-diff.txt contains a PR diff. Read it and review the changes. You can also read the changed source files for full context.` |
| File or directory | `Review [path] for issues.` |

Full command pattern:
```
codex exec -C "$PWD" -s read-only "SCOPE_INSTRUCTION ADVERSARIAL_PROMPT" -o /tmp/adversarial-codex.txt 2>/tmp/adversarial-codex-err.txt; echo "CODEX_EXIT:$?" >> /tmp/adversarial-codex-err.txt
```

The `-o` flag captures only the final assistant message. Stderr captures the full agent trace (thinking, exec calls) for progress monitoring. **Known issue**: if Codex exhausts its turns without producing a final summary, `-o` creates no file. Always check file existence, not just content.

**Gemini** — headless mode only (`-p`). Cannot reliably use filesystem tools when spawned non-interactively (known bug [#18776](https://github.com/google-gemini/gemini-cli/issues/18776)). Must receive content via stdin.

**CRITICAL stdin bug**: `cat file | gemini -p "..."` fails with "Cannot use both a positional prompt and the --prompt flag together." Use `< file` redirection instead — this works correctly.

Pin the model with `-m` to prevent auto-routing to Flash.

Run the Gemini fallback chain as a single background command:

```bash
for MODEL in gemini-3.1-pro-preview gemini-2.5-pro gemini-2.5-flash; do
  gemini -m "$MODEL" -p "ADVERSARIAL_PROMPT" < /tmp/adversarial-diff.txt > /tmp/adversarial-gemini.txt 2>/tmp/adversarial-gemini-err.txt
  EXIT_CODE=$?
  if [ $EXIT_CODE -eq 0 ] && [ -s /tmp/adversarial-gemini.txt ]; then
    echo "GEMINI_MODEL:$MODEL" >> /tmp/adversarial-gemini-err.txt
    echo "GEMINI_EXIT:0" >> /tmp/adversarial-gemini-err.txt
    break
  fi
  echo "GEMINI_ATTEMPT:$MODEL failed (exit $EXIT_CODE)" >> /tmp/adversarial-gemini-err.txt
done
if [ ! -s /tmp/adversarial-gemini.txt ]; then
  echo "GEMINI_EXIT:1" >> /tmp/adversarial-gemini-err.txt
fi
```

### Progress monitoring and fail-fast

After launching both CLIs in background, do your Phase 3 analysis. When Phase 3 is done, check on the background tasks:

1. **Use TaskOutput with `block: false`** to check if each task has completed. Check them **one at a time** — never in a single parallel block, because a failure reading one task cancels all parallel calls.

2. **If a task is still running**, check its progress by reading the stderr trace file:

```bash
# How much output so far? Is it still growing?
wc -l /tmp/adversarial-codex-err.txt 2>/dev/null
tail -5 /tmp/adversarial-codex-err.txt 2>/dev/null
```

3. **Classify the state:**

| Stderr pattern | State | Action |
|----------------|-------|--------|
| Recent `thinking` or `exec` lines, line count growing | **Active** — model is working | Wait, check again after reading the other CLI's output |
| No stderr file, or file unchanged after two checks | **Stuck** — process may have hung | Kill the background task, mark as failed |
| `CODEX_EXIT:0` or `GEMINI_EXIT:0` at end of stderr | **Done** | Read output file |
| Error messages, stack traces, `RESOURCE_EXHAUSTED` | **Failed** | Mark as error, report to user |

4. **Tell the user immediately** when you know a CLI's status: "Codex: still running (85 lines of trace so far). Gemini: done, 1200 bytes of findings." This way they know whether the wait is productive.

5. **If both tasks are done**, proceed to output validation. If one is still active and the other is done, start reading the finished output while waiting. Don't block on both.

### Output validation

Before synthesizing, classify each output:

| Status | Criteria | Action |
|--------|----------|--------|
| **Valid** | File exists, non-empty, contains substantive findings | Include in synthesis |
| **Empty** | File missing, empty, or whitespace only | Mark as "did not participate" |
| **Error** | Non-zero exit code in stderr | Mark as "CLI error" with reason |
| **Noise** | >2000 chars but no analytical content — filesystem exploration, git history, file listings without analysis | Mark as "unusable output" |

**Noise detection**: If output contains repeated exploration patterns (`Reading file`, `exec`, `git log`, `git show`, `searching`) but lacks analytical language (no mentions of bugs, risks, issues, vulnerabilities, concerns, or recommendations), classify as noise.

Report status to the user: "Codex: [valid/failed/empty]. Gemini: [valid/failed/empty]. Proceeding with N of 3 models."

## Phase 3: Claude's Adversarial Pass

Perform your own adversarial analysis of the target using Read, Grep, Glob. This runs regardless of external CLI results — Claude always participates.

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

Read `/tmp/adversarial-codex.txt` and `/tmp/adversarial-gemini.txt` (only the ones marked valid in Phase 2.5). Combine with your Phase 3 findings.

### Handling partial results

If Phase 2.5 marked any model as failed, empty, or noise:

- **2 of 3 models produced findings**: Proceed normally. Consensus requires both remaining models to agree. Note the missing model in the report header.
- **1 of 3 models (Claude only)**: Skip consensus/unique/divergent categories — they require multiple models. Present Claude's findings as a flat list under "## Findings (single-model)". Add a note that model diversity was not available.
- **All external models failed**: Same as above, plus add a "Degraded Review" note at the top suggesting re-run when CLIs are available.

Update the `**Models**` header line to show participation status, e.g.: `**Models**: Codex (valid), Gemini (failed: 503 capacity), Claude (valid)`

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
