---
name: using-simpleclaude-thinking
description: Use whenever any thinking skill might apply; classify the situation, then MUST invoke the best-matching one.
---

# Using SimpleClaude Thinking

Thinking skills are default tools, not rare exceptions. The failure mode this meta-skill exists to prevent is Claude defaulting to "none" when multiple thinking skills seem plausible.

## The 1% Rule

If there is even a weak chance (≥1%) that one of the thinking skills applies to the current turn, you MUST invoke the best-matching skill.

- Do NOT wait for exact trigger phrases.
- Do NOT require an explicit slash command.
- Do NOT skip invocation because the match feels imperfect.
- Do NOT "just answer" when a thinking skill fits the situation.

Prefer false positives over false negatives. Missed invocation is the failure mode. Slight over-invocation is the correct calibration.

## Routing

### Invoke `sc-socratic` when the user is still framing the problem

- Clarifying assumptions
- Testing beliefs
- Surfacing goals
- Finding the right question to ask
- Deciding what kind of decision this is
- Expressing uncertainty without named options

### Invoke `sc-hypothesize` when the decision already has, or clearly needs, competing options

- Generate alternatives
- Compare alternatives
- Test alternatives against constraints
- Preserve an auditable reasoning trail
- Support a human choice among viable paths

### Invoke `hud-first` when the user is designing an AI-enabled product, workflow, or feature

- Assistant / agent / copilot / chatbot is on the table
- Delegation by conversation is the implicit design
- The real opportunity may be perception augmentation rather than task handoff

## Tie-Breakers

If both `sc-socratic` and `sc-hypothesize` seem to apply:

- Use `sc-socratic` first when options are not yet well-formed.
- Use `sc-hypothesize` first when options are already explicit or should be made explicit immediately.

If `hud-first` applies, it takes precedence for AI-product design framing. After the HUD reframe, invoke `sc-socratic` or `sc-hypothesize` only if the design question is still unresolved.

## Multi-Phase Turns

A single turn may cross phases — e.g., the user lists options *and* doubts the underlying framing. In that case, sequencing is permitted:

1. Invoke `sc-socratic` first to resolve the framing doubt.
2. Then invoke `sc-hypothesize` to evaluate the options against the clarified frame.

Do not try to force one pick when the situation genuinely spans two phases. Sequencing beats compression.

## Enforcement

- MUST invoke a thinking skill on probable matches.
- MUST prefer false positives over false negatives.
- MUST route by situation type, not trigger phrase lists.
- MUST treat explicit skill names (`/sc-socratic`, etc.) as automatic invocation.

## Red Flags

Catch yourself about to rationalize skipping. These are signs you are under-invoking:

| Rationalization | Reality |
|---|---|
| "The user just wants a quick answer" | They used an uncertainty signal. Invoke. |
| "I already know the answer" | That's the bias the skill exists to check. Invoke. |
| "The match isn't perfect" | The 1% rule. Invoke. |
| "It would slow down the response" | Missed invocation is the failure, not latency. Invoke. |
| "Multiple skills match" | Route via tie-breakers above. Invoke one. |

## When NOT to invoke

These are the only exceptions:

- Pure execution request with no uncertainty (e.g., "run the tests", "commit this", "rename X to Y")
- Factual lookup with a definite answer (e.g., "what's the syntax for Y in Ruby?")
- User explicitly declined a thinking skill in the current thread

For anything else where reasoning, design, or decision-making is happening, invoke.
