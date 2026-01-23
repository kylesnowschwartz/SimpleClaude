---
name: sc-cybw
description: Surfaces adversarial information intelligently
argument-hint: "Could you be wrong about [target statement or conclusion]?"
---

# Could You Be Wrong?

A single-question checkpoint that surfaces adversarial information absent from initial responses.

<optional_target>
$ARGUMENTS
</optional_target>

## Why This Works

Research shows that asking "Could you be wrong?" generates **adversarial information**—errors, biases, contradictory evidence, and alternatives—that doesn't appear in initial responses. It functions like getting a second opinion from the same source. (Hills, 2025)

This is not about doubt for doubt's sake. It's about systematically surfacing what you might be missing.

## Protocol

When invoked, execute this sequence:

### 1. Identify the Target
What exactly is being challenged? State it clearly:
- A conclusion or recommendation
- An assumption (explicit or implicit)
- A design decision
- A plan or approach

### 2. Ask the Core Question
> **Could you be wrong?**

Then genuinely attempt to answer it by exploring:

| Category | Prompt |
|----------|--------|
| **Errors** | What mistakes might be in this? What could be factually incorrect? |
| **Biases** | What cognitive biases might have shaped this? (confirmation, anchoring, availability, etc.) |
| **Contradictory Evidence** | What evidence exists against this position? What would falsify it? |
| **Alternatives** | What other approaches weren't considered? What would someone who disagrees suggest? |

### 3. Deliver Structured Output

```markdown
## Target
[What's being challenged]

## Could I Be Wrong?

### Potential Errors
- [Specific error or mistake that might exist]
- [Another potential error]

### Possible Biases
- [Bias that may have influenced the output]
- [How it might have distorted the response]

### Contradictory Evidence
- [Evidence or arguments against the position]
- [What would need to be true for this to be wrong]

### Unconsidered Alternatives
- [Alternative approach not mentioned]
- [Why it might be better or worse]

## Revised Assessment
[If any of the above changes the original position, state how. If the original holds, state why it survives scrutiny.]
```

---

*Based on: Hills, T. T. (2025). "Could You Be Wrong: Metacognitive Prompts for Improving Human Decision Making Help LLMs Identify Their Own Biases." AI, 7(1), 33.*
