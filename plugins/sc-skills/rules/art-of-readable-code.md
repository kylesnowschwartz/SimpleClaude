---
paths:
  - "**/*.{rb,py,js,ts,jsx,tsx,go,rs,java,kt,swift,c,cc,cpp,h,hpp,cs,php,ex,exs,scala,clj,lua}"
---

# Art of Readable Code (Boswell/Foucher)

Core: Minimize time for others to understand. Readability > cleverness.

## Naming

- Be specific: `retval` -> `seconds_since_request`
- Encode units/types: `delay_secs`, `unsafe_html`, `num_errors`
- Concrete names: `ServerCanStart()` > `CanListenOnPort()`
- Attach details: `max_threads` > `threads`, `plaintext_password` > `password`
- Scope rule: Larger scope = longer name. Loop `i` is fine; class member needs context.

## Comments

- Describe WHY and non-obvious consequences. Code shows WHAT.
- Record thought process: "Tried X, didn't work because Y"
- Mark known issues: TODO, FIXME, HACK, XXX
- Comment constants: Why this value?
- Big picture first, then details.

## Structure

- Consistent style > "correct" style.
- Align similar code to show differences.
- Line breaks create paragraphs. Group related statements.
- Order: Important first, or logical flow.

## Control Flow

- Prefer positive: `if (is_valid)` > `if (!is_invalid)`
- Changing value on left: `if (length >= 10)` > `if (10 <= length)`
- Early returns > deep nesting.
- Guard clauses > nested success paths.

## Variables

- Eliminate intermediates that don't add clarity.
- Shrink scope: Define close to use.
- Prefer immutable: Write-once is easier to reason about.

## Decomposition

- Extract functions for logical chunks, even if called once.
- One task per function. "and" in description = split it.
- Unrelated subproblems = separate functions.
- Interface must be obvious. Unclear usage = redesign.

## Quality Checks

- Keep nesting shallow (2-3 levels max), flatten with early returns
- Keep functions focused and concise
- Minimize variable scope, define close to use
- Write obvious code that reads naturally
- Maintain consistent naming and formatting throughout

## Key

> Reader matters more than writer. Code is read 10x more than written.
