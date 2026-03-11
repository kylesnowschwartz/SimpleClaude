# Example: Stuck on Architecture

Dialogue transcript showing how to help someone unstick on a design decision.

---

**User**: I'm stuck on how to structure the notification system. I've been going back and forth for days.

---

## Context

User is designing a notification system and experiencing decision paralysis. Need to understand the actual constraints before applying techniques.

## Inquiry

Before I can help you unstick, I need to understand the landscape:

1. **What options are you oscillating between?** (Not just "different approaches" - name them specifically)

2. **What happens if you pick wrong?** (Is this reversible? What's the actual cost of a bad choice?)

3. **What have you already ruled out, and why?**

---

**User**: I'm torn between a pub/sub system with a message queue vs. a simpler direct-call approach. Pub/sub feels more "correct" but adds complexity. Direct calls are simpler but might not scale. If I pick wrong, we'd have to rewrite it later, which would be painful but not catastrophic. I ruled out webhooks because our clients can't receive them.

---

## Context

The oscillation is between complexity (pub/sub) and simplicity (direct calls). The fear is "rewrite later." Webhooks ruled out for legitimate reason.

## Inquiry

The tradeoff is clear: complexity now vs. potential rework later. Let me probe the assumptions:

1. **"Might not scale"** - What does scale mean here? 100 notifications/day? 100,000? Do you have actual numbers, or is this hypothetical future load?

2. **"Rewrite would be painful"** - What specifically makes it painful? Is the notification system deeply coupled to other parts, or is it relatively isolated?

3. **What's your current notification volume, and what's your realistic growth trajectory?**

---

**User**: Honestly, we have maybe 50 notifications a day right now. Growth is uncertain—we could 10x in a year if things go well, but that's optimistic. The notification system touches a few places but isn't deeply coupled. The pain is mostly "I'll feel dumb for not doing it right the first time."

---

## The Question

The technical question you've been asking is "pub/sub or direct calls?"

The real question is: **"Am I building for current reality or hypothetical future?"**

50 notifications/day is nothing. Even 500/day is nothing. Direct calls will handle that trivially. You're designing for a scale you don't have and might never reach.

**The rewrite fear is about ego, not engineering.** You said "I'll feel dumb." That's not a technical constraint—that's anticipated embarrassment. And honestly? Shipping something simple that works, then rewriting it when you actually need scale, is better engineering than over-building for hypothetical load.

## Next

Ship the direct-call approach this week.

Document the decision: "We chose direct calls because our current volume (50/day) doesn't justify queue complexity. Revisit if volume exceeds 1000/day sustained."

When (if) you hit that threshold, you'll have real usage patterns to inform the design. Right now you're guessing.

---

**User**: ...yeah, you're right. I was solving a problem I don't have. Thanks.

---

## Techniques Used

1. **Assumption excavation**: "Do you have actual numbers, or is this hypothetical?"
2. **Consequence tracing**: "What specifically makes rewrite painful?"
3. **Meta-question**: Reframed from technical choice to underlying fear
4. **Evidence probing**: Surfaced that the scale concern was speculative
5. **Concrete action**: Specific recommendation with explicit revisit trigger
