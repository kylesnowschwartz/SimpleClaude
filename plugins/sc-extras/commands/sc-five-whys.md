---
name: sc-five-whys
description: Systematic root cause analysis using Five Whys method
argument-hint: Problem statement or issue to analyze
---

# sc-five-whys: Autonomous Root Cause Analysis Protocol

_A systematic approach to finding root causes in software problems._

## Process:

### 1. Capture the Problem

**Define specifically what's broken:**

- Problem statement exists in ${ARGUMENTS} or conversation context
- You have access to relevant data/logs/documentation
- What's the observed issue? (error, wrong behavior, visual bug)
- When does it occur? (specific triggers, conditions, frequency)
- Where does it manifest? (backend/frontend/specific component)
- Who/what is affected? (users, systems, features)

**Gather evidence:**

- Error messages, stack traces, console logs
- Screenshots for visual issues
- Steps to reproduce
- Recent changes that might relate

### 2. Ask "Why?" (Usually 5 Times, Sometimes Less)

**Build your causal chain:**

```
Problem: [Specific issue]
├── Why? → [Technical cause A]
│   └── Why? → [Deeper cause A2]
│       └── Why? → [Continue until root]
└── Why? → [Technical cause B] (if multiple factors)
    └── Why? → [Continue separately]
```

**Focus your whys based on problem type:**

- **Backend issues**: logic errors, data state, resources, timing
- **Frontend issues**: events, state management, CSS, browser differences
- **Visual bugs**: often only need 2-3 whys (styling → specificity → root)
- **Performance**: may need 6-7 whys to reach architectural roots

**Watch for false roots (keep digging if you hit these):**

- "Human error" / "Someone made a mistake"
- "Lack of time/resources"
- "That's how it's always been"
- "Random occurrence"
- "Just make the test pass"
- "I'll commit this with --no-verify"

### 3. Validate Your Root Cause

**Can you answer YES to:**

- Can I point to specific code/config that embodies this cause?
- If I fix this exact thing, will the problem definitely stop?
- Does this cause explain all observed symptoms?

**For UI/UX issues also check:**

- Can I demonstrate the fix in DevTools?
- Does this explain why it works in some contexts but not others?

### 4. Develop the Fix

**Address multiple levels:**

- **Immediate**: Stop the bleeding (workaround, feature flag, revert)
- **Root fix**: Address the actual cause you found
- **Prevention**: Ensure this class of issue can't recur (tests, types, linting)

## Example - Backend:

**Problem**: API returns 500 error for specific users

1. **Why?** → Database query times out
2. **Why?** → Query joins 5 tables for these users
3. **Why?** → These users have 1000x normal data volume
4. **Why?** → No pagination on user data retrieval
5. **Why?** → Original design assumed <100 items per user

**Root**: Missing pagination in data access layer
**Fix**: Add pagination, set query limits, add volume tests

## Example - Frontend:

**Problem**: Button doesn't respond on mobile

1. **Why?** → Click handler not firing
2. **Why?** → Parent div has touch handler that prevents bubbling
3. **Why?** → Swipe gesture detection consumes all touch events

**Root**: Overly aggressive event.preventDefault() in swipe handler
**Fix**: Add conditional logic to allow tap-through on buttons

## Smart Patterns:

**When to stop before 5:**

- Found the exact line of broken code
- Identified the specific config value
- Located the CSS rule causing misalignment
- Going deeper would just explain "why coding exists"

**When to go beyond 5:**

- Intermittent failures (race conditions need deep tracing)
- Performance degradation (often architectural)
- Complex state corruption (may have long cause chains)

**When to branch your investigation:**

- "Works on dev but not prod" → investigate environment differences
- "Sometimes fails" → investigate timing/concurrency separately
- "Only certain users" → investigate data patterns separately

## Output Template:

```markdown
### Problem

[One sentence description]

### Five Whys Analysis

1. Why? [Answer] - _Evidence: [what proves this]_
2. Why? [Answer] - _Evidence: [what proves this]_
   [...continue to root]

### Root Cause

**Location**: [file:line or component]
**Issue**: [Specific technical problem]
**Confidence**: [High/Medium/Low based on evidence]

### Solution

**Immediate mitigation**: [If urgent]
**Root fix**: [Code/config change needed]
**Prevention**: [Test/process to prevent recurrence]

### Notes

[Any branches explored, assumptions made, or additional context]
```

---

_Remember: Five Whys is a thinking tool, not a rigid formula. Sometimes three whys finds the root. Sometimes you need seven. The goal is understanding, not completing a checklist._

${ARGUMENTS}
