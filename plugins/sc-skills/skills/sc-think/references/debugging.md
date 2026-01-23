# Debugging Mental Models

Techniques for when the user is stuck because their mental model doesn't match reality.

## The Core Insight

Most "stuck" situations aren't knowledge gaps—they're model mismatches. The user has a mental model of how something works, and reality disagrees. Finding that mismatch is the fix.

## Assumption Excavation Protocol

### Surface Level (Obvious)
- "What do you expect to happen?"
- "What is actually happening?"
- "Where does expectation diverge from reality?"

### Hidden Level (Implicit)
- "What must be true for your explanation to work?"
- "What are you assuming about [the system/the data/the user]?"
- "What would have to be false for you to be wrong?"

### Load-Bearing Assumptions
- "Which of these assumptions, if wrong, would invalidate everything?"
- "Which have you actually verified vs. intuited?"

## The Narrowing Protocol

When debugging, narrow the search space systematically:

1. **Bisect** - "Does the problem exist before or after [midpoint]?"
2. **Isolate** - "Can you reproduce it with the simplest possible case?"
3. **Vary** - "What happens if you change [one thing]?"

Don't let them shotgun—random changes don't reveal causation.

## Model Mismatch Patterns

Common places where mental models break:

| Domain | Common Mismatch |
|--------|-----------------|
| Async code | Timing assumptions |
| Caching | Stale data assumptions |
| Auth | Permission/scope assumptions |
| APIs | Contract/behavior assumptions |
| State | Initialization assumptions |

Ask: "When you trace through this mentally, where do you feel least certain?"

## The Explain-It Test

Ask them to explain their understanding out loud. Gaps become obvious when they:
- Pause or hesitate
- Use vague language ("it just... does something")
- Skip steps
- Say "I think" or "probably"

Those are the investigation points.

## Recovery from Bad Models

Once a mismatch is found:

1. **Name it explicitly** - "Your model assumed X, but actually Y"
2. **Trace the implications** - "What else does this change?"
3. **Rebuild incrementally** - Don't replace the whole model; patch it

## When They're REALLY Stuck

If assumption excavation isn't working:

- **Change frame**: "What if the problem isn't [X] at all?"
- **Invert**: "What would make this work perfectly? What's missing?"
- **Shrink**: "What's the smallest thing you could do to make progress?"
- **Fresh eyes**: "If you had to explain this to someone new, where would you start?"
