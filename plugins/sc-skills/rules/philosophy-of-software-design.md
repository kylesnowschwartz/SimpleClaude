---
paths:
  - "**/*.{rb,py,js,ts,jsx,tsx,go,rs,java,kt,swift,c,cc,cpp,h,hpp,cs,php,ex,exs,scala,clj,lua}"
---

# Philosophy of Software Design (Ousterhout)

Core: Complexity is the enemy. Good design minimizes cognitive load.

## Modules

- **Deep**: Simple interface, powerful implementation. High benefit/cost.
- **Shallow**: Complex interface, trivial implementation. No abstraction value.
- Goal: Maximum functionality behind minimal interface.

## Programming Approach

- **Tactical**: Quick fixes, "just make it work." Accumulates complexity.
- **Strategic**: Invest 10-20% extra time in good design upfront. Pays dividends.
- Working code isn't enough. Well-designed code is the goal.

## Practices

- **Information hiding**: Bury complexity behind simple interfaces.
- **Pull complexity downward**: Implementers work harder so users work less.
- **Different layer, different abstraction**: Each layer must transform or add value.
- **Design it twice**: First idea is rarely best.
- **General-purpose > special-case**: Fewer flexible methods > many specialized ones.
- **Define errors out of existence**: Design APIs so errors can't happen.

## Design Checks

- Each layer adds meaningful abstraction
- Handle edge cases through API design, not proliferating special cases
- Return values for expected outcomes, exceptions for truly exceptional failures
- Comments explain WHY and intent, not WHAT code does
- Encapsulate state behind behavior

## Mantra

> Modules should be deep, interfaces simple, special cases eliminated.
