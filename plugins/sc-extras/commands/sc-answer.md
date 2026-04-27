---
name: sc-answer
description: Re-elicit the questions from your last message via the AskUserQuestion tool
argument-hint: "(no arguments — operates on your last assistant message)"
---

# sc-answer: Structured Answer Elicitation

The user has invoked this command because your **previous assistant message contained one or more questions directed at them**, and they would prefer to answer those questions through the structured `AskUserQuestion` prompt rather than typing a free-form reply.

Your job is to convert that prior message's questions into one or more `AskUserQuestion` calls, collect the answers, then resume the original task informed by what you learn.

## Protocol

### 1. Locate the Source

Re-read your **most recent assistant turn** in this conversation. That is the only place questions should be drawn from. Do **not** invent questions; do **not** pull from earlier turns; do **not** consult the user's most recent message (it is the `/sc-answer` invocation itself, which carries no content).

### 2. Extract the Questions

Identify each distinct question in that prior message that genuinely solicits user input. Preserve their original order. A question qualifies if you were waiting on the user to decide, choose, clarify, or supply information. Rhetorical questions, hypotheticals offered as illustration, and questions you already answered yourself do **not** qualify.

For each qualifying question, also note any **context** from the surrounding prose that the user would need in order to answer well (e.g. constraints you mentioned, options you proposed, a recommendation you made). This context belongs in the question's body, not buried in a separate message.

### 3. Handle the Empty Case

If, on careful reading, the prior assistant message contained **no** questions requiring user input, do not call `AskUserQuestion`. Instead, reply briefly: state that no outstanding questions were found, quote the closing sentence of your prior message so the user can verify, and ask whether they would like to clarify what they intended this command to elicit.

### 4. Issue the Question(s)

Call `AskUserQuestion`. Translate each extracted question into a single entry:

- **`question`**: the question text, rephrased for clarity if needed, with any essential context embedded so the prompt stands alone.
- **`header`**: a short label (a few words) summarising the question — this is what the user sees in the picker, not the full question.
- **Choices vs. free-form**: if your earlier message proposed a finite menu of options ("should I use X, Y, or Z?"), enumerate them as choices and let the user select. If the question is genuinely open-ended, omit the choices and let them type. The free-form "Other" option is supplied by the harness — do not duplicate it.
- **`multiSelect`**: true only if a single question may legitimately admit several simultaneous answers (e.g. "which of these files should I touch?"). Otherwise false.

If the tool's per-call limit on the number of questions is exceeded, batch them: ask the most logically prior questions first, then issue a follow-up `AskUserQuestion` call for the remainder once the first batch is answered. Do not ask everything at once when ordering matters — later answers may make some earlier questions moot.

### 5. Resume the Original Task

Once answers are returned, do **not** simply restate them. Continue with the work that prompted the questions in the first place: implement, plan, recommend, or report, now informed by what the user supplied. Treat the answers as the input you were waiting for, then act.

## Notes

- The mechanism the user is asking for is `AskUserQuestion`. Do not substitute a numbered list in chat and ask them to reply in prose — that defeats the purpose of the command.
- Be faithful to what was actually asked. A want of precision in the original questions will compound when the user is funnelled into a structured prompt; if a question in the prior message was ambiguous, sharpen it on the way through, but do not change its substance.
- This command operates entirely on conversation context already present. There is nothing to fetch, parse, or persist.
