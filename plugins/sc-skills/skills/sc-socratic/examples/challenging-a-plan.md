# Example: Challenging a Plan

Dialogue transcript showing how to strengthen a proposal through opposition.

---

**User**: I'm planning to rewrite our authentication system from scratch. The current one is a mess—hardcoded roles, no proper session management, security issues. I want to replace it with a proper RBAC system with JWT tokens. Can you review my plan?

---

## Context

User wants to rewrite authentication system. Claims current system has issues. Proposing RBAC + JWT replacement.

Before reviewing the plan, need to understand if a full rewrite is the right approach.

## Inquiry

Before I review the plan itself, let me challenge the premise:

1. **"The current one is a mess"** - Messy how? Is it messy-but-working, or messy-and-actively-causing-problems? What incidents have you had?

2. **"Security issues"** - Specific vulnerabilities, or general unease? Have you had a security audit, or is this intuition?

3. **Why rewrite vs. incremental improvement?** What makes surgical fixes insufficient?

---

**User**: Fair questions. It's messy-but-working—no major incidents yet. The security concern is more intuition than audit findings; the code just "feels" insecure. As for incremental vs. rewrite... I guess I assumed rewrite because the code is hard to follow.

---

## Context

No incidents. No audit findings. "Feels" insecure. Hard to follow code.

This is a rewrite proposed for aesthetic reasons, not operational necessity.

## Inquiry

Let me steelman the opposition:

**The case against rewriting:**

1. Working auth systems are high-risk to replace. Even "better" systems introduce new bugs. You're trading known problems for unknown ones.

2. "Hard to follow" is a reading problem, not a running problem. The code doesn't care if you understand it.

3. JWT isn't automatically more secure than sessions. It's different, with its own pitfalls (token revocation, secret rotation, payload size).

4. RBAC is more flexible than hardcoded roles—but do you need that flexibility? How often do your permission requirements actually change?

**Could you be wrong about needing a rewrite?**

---

**User**: Okay, you're making me uncomfortable, which probably means you're right. We don't actually change permissions often. And I haven't thought about JWT revocation at all. But the code really is hard to maintain—that's a real problem, not just aesthetics.

---

## The Question

The question isn't "How do I rewrite auth?"

It's: **"What's the minimum intervention that addresses the actual pain?"**

Your pain is maintainability, not functionality. Those require different solutions.

**Reframe the options:**

| Approach | Addresses | Risk |
|----------|-----------|------|
| Full rewrite | Everything | High (new bugs, timeline, unknown unknowns) |
| Refactor existing | Maintainability | Medium (could break things) |
| Document + test existing | Understanding | Low (no behavior change) |

## Next

Before deciding on approach:

1. **Get a security audit** - Replace intuition with evidence. If there are real vulnerabilities, fix those specifically.

2. **Write tests for current behavior** - This gives you a safety net whether you refactor or rewrite.

3. **Document the current system** - The "hard to follow" problem might be solved by a good diagram and comments, not new code.

If after that you still want to rewrite, you'll have tests to verify the new system matches the old behavior, and you'll know what security issues you're actually fixing.

---

**User**: That's... much more responsible than my original plan. I was going to spend a month on something I don't actually need. Thanks for pushing back.

---

## Techniques Used

1. **Premise challenge**: Questioned the rewrite assumption before reviewing the plan
2. **Evidence probing**: "Specific vulnerabilities, or intuition?"
3. **Opposition steelmanning**: Made the strongest case against the user's position
4. **"Could you be wrong?"**: Direct question that surfaces doubt
5. **Reframing**: Shifted from "how to rewrite" to "what intervention fits the pain"
6. **Graduated options**: Presented alternatives with different risk profiles
