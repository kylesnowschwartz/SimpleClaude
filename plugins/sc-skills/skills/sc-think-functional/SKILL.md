---
name: sc-think-functional
description: >
  Reframe code design through functional programming principles for agent-assisted development.
  This skill SHOULD be used when the user says "think functional", "think FP", "make this pure",
  "separate effects", "where should this side effect go", "this function does too much",
  "how should I structure this for agents", "make this easier to review", "reduce context needed",
  or when planning module structure, store design, or code that agents will write and humans will review.
  Applies FP discipline within any language to maximize agent effectiveness and human reviewability.
---

# Think Functional

FP discipline for agent-assisted development. Not about switching languages — about structuring code so agents write it well and humans review it fast.

## Why FP Matters for Agents

<thesis>

**Agents are pattern matchers.** They compress training data into a world model, then map between representations: `f(pattern_in, context, constraints) => pattern_out`. FP makes the patterns explicit.

| FP Property                           | Agent Benefit                                                         | Human Benefit                          |
| -------------                         | ---------------                                                       | ---------------                        |
| **Type signatures encode intent**     | One line = full context. Input, output, effects. No retrieval needed. | Skim signatures, skip bodies           |
| **Pure functions are self-contained** | Entire function is contiguous text. No hidden state to chase.         | Trust pure code, scrutinize edges      |
| **Composition is the architecture**   | Agents pattern-match the wiring, generate the parts                   | Review wiring, ignore parts            |
| **Constraints prevent laziness**      | Can't introduce side effects where the type system forbids them       | Structural enforcement, not convention |

</thesis>

## The Reframe

When approaching any design decision:

**Instead of:** "What object/class should own this behavior?"
**Ask:** "What's the pure transform, and where does the effect happen?"

Every function is one of three things:

| Type                   | What It Does                   | Who Reviews              | Agent Writes Well?                      |
| ------                 | -------------                  | -------------            | -------------------                     |
| **Pure transform**     | Data in, data out. No effects. | Skim or skip             | Yes — self-contained, testable          |
| **Effect at the edge** | IO, network, DOM, persistence  | Read every line          | Needs guidance — effects are contextual |
| **Composition**        | Wires pure + edge together     | This IS the architecture | No — human decides the wiring           |

## The Toolkit

Apply these operations to any code design problem:

<operations>

### Separate: Pure from Impure

Ask: "If I deleted every side effect from this function, what computation remains?"

That computation is your pure core. Extract it. The side effects become a thin shell that calls the pure function and does IO with the result.

```
BEFORE: fetchUser(id) { data = await fetch(url); return validate(data); }
AFTER:  validateUser(data) { ... }  // pure
        fetchUser(id) { data = await fetch(url); return validateUser(data); }  // edge
```

### Push Effects Outward

Ask: "Can the caller handle this effect instead of the callee?"

Effects belong at the outermost layer possible. A function that reads localStorage is harder to test than one that receives the data as an argument. Push effects toward main(), toward the composition root, toward the entry point.

### Make Illegal States Unrepresentable

Ask: "Can the type system prevent this bug, or does it rely on runtime discipline?"

Branded types prevent coordinate confusion. Discriminated unions with exhaustive matching prevent missed cases. `Result<T, E>` makes failure explicit in the return type instead of hidden in exceptions.

### Enforce Through Structure, Not Convention

Ask: "If an agent ignores my instructions, does the code still work correctly?"

Agents are lazy. They'll take shortcuts if shortcuts compile. Convention says "don't put side effects here." Structure says "this module physically cannot import the side-effect library." Prefer structure.

Examples:
- ESLint rules blocking Zustand/React imports in `*.pure.ts` files
- Branded types that prevent passing pixel coords to hex math
- Separate directories where the import graph enforces purity

### Narrow the Interface

Ask: "What's the minimum this function needs to know?"

A function that takes `AgentState` when it only needs `{ hex: HexCoordinate }` carries unnecessary context. Narrow the input type. This reduces the context an agent needs to understand the function, and makes the function reusable across more call sites.

</operations>

## Applied to Stores (Zustand, Redux, etc.)

State management is where FP discipline pays off most in frontend code:

| Rule                                | Why                                                                                    |
| ------                              | -----                                                                                  |
| **No side effects in actions**      | Actions become pure state transitions. Testable without mocking.                       |
| **No cross-store calls in actions** | Wire cross-cutting concerns at the composition root. Stores stay independent.          |
| **No persistence in store files**   | Extract to subscription files. Store logic is pure; persistence is an edge effect.     |
| **No logging in actions**           | Event stores or subscriptions handle observability. Actions compute new state, period. |

Store action template:
```
1. Read current state
2. Compute new state (call pure functions)
3. Single set() call
4. Return value for caller — no side effects
```

## Applied to Handlers

Handlers dispatch on message type and perform effects. Use dependency injection to keep them testable:

```typescript
interface HandlerDeps {
  getAgent: (id: string) => Agent | undefined;
  // inject only what's needed
}
function createHandler(deps: HandlerDeps): (msg: Message) => void
```

The handler factory is pure (given deps, returns a function). The deps are wired at the composition root. Testing injects mock deps without touching real stores.

## File Organization

Make purity visible in the filesystem:

```
feature/
  types.ts          # Pure types, no runtime
  foo.pure.ts       # Pure transforms — agents write these freely
  fooStore.ts       # State transitions — review action shapes
  fooPersistence.ts # Edge effects — review carefully
  Foo.tsx           # UI — inherently impure, review interaction logic
```

The `.pure.ts` suffix signals to both agents and reviewers: this file has no side effects, is enforced by linting, and can be trusted if the types check.

## Review Protocol

When reviewing agent-written code through an FP lens:

1. **Architecture (composition):** Read this carefully. Does the wiring make sense? Are effects at the edges?
2. **Edge functions (IO, DOM, network):** Read every line. These are where bugs live.
3. **Pure functions:** Check types match. Skim body. If types are right and tests pass, the implementation is almost certainly correct.
4. **Test summaries:** Are edge cases covered? Are pure functions tested with property-based or example-based tests?

Time allocation: 60% on composition + edges, 30% on tests, 10% on pure function bodies.

## Anti-Patterns

| Anti-Pattern                | Symptom                                              | Fix                                                     |
| --------------              | ---------                                            | -----                                                   |
| **Purity theater**          | `.pure.ts` file that secretly mutates a closure      | Enforce with linting, not just naming                   |
| **Effect sandwich**         | Pure-impure-pure in one function body                | Split into three functions, compose at call site        |
| **Overly narrow types**     | 15 tiny interfaces when 3 would do                   | Group by usage pattern, not by minimal surface          |
| **Monadic overengineering** | `Result<Option<Either<T, E>>>`                       | Use discriminated unions. `if (result.ok)` is readable. |
| **Convention cop**          | Writing comments like "DO NOT add side effects here" | Add a lint rule instead. Agents don't read comments.    |

## When NOT to Use This

- **Performance-critical hot paths** where mutation is measurably faster
- **Inherently effectful code** (terminal emulation, canvas rendering, WebSocket lifecycle) — don't force purity where the entire purpose is effects. Wrap it cleanly instead.
- **Prototyping** where you're still discovering the right abstraction — premature purity extraction slows exploration
- **One-off scripts** that run once and get deleted

## The Question

For your current design problem:

1. What's the pure computation hiding inside the effectful function?
2. Can the effect be pushed one layer outward?
3. If an agent writes this, what context does it need? Can the type signature provide that context instead of retrieval?

The best code for agent-assisted development is code where the types tell the whole story.
