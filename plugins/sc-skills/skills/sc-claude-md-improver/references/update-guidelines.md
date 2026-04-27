# CLAUDE.md Update Guidelines

## Core Principle

Only add information that will genuinely help future Claude sessions. The context window is precious - every line must earn its place.

## What TO Add

### 1. Commands/Workflows Discovered

```markdown
## Build

`npm run build:prod` - Full production build with optimization
`npm run build:dev` - Fast dev build (no minification)
```

Why: Saves future sessions from discovering these again.

### 2. Gotchas and Non-Obvious Patterns

```markdown
## Gotchas

- Tests must run sequentially (`--runInBand`) due to shared DB state
- `yarn.lock` is authoritative; delete `node_modules` if deps mismatch
```

Why: Prevents repeating debugging sessions.

### 3. Package Relationships

```markdown
## Dependencies

The `auth` module depends on `crypto` being initialized first.
Import order matters in `src/bootstrap.ts`.
```

Why: Architecture knowledge that isn't obvious from code.

### 4. Testing Approaches That Worked

```markdown
## Testing

For API endpoints: Use `supertest` with the test helper in `tests/setup.ts`
Mocking: Factory functions in `tests/factories/` (not inline mocks)
```

Why: Establishes patterns that work.

### 5. Configuration Quirks

```markdown
## Config

- `NEXT_PUBLIC_*` vars must be set at build time, not runtime
- Redis connection requires `?family=0` suffix for IPv6
```

Why: Environment-specific knowledge.

## What NOT to Add

### 1. Obvious Code Info

Bad:
```markdown
The `UserService` class handles user operations.
```

The class name already tells us this.

### 2. Generic Best Practices

Bad:
```markdown
Always write tests for new features.
Use meaningful variable names.
```

This is universal advice, not project-specific.

### 3. One-Off Fixes

Bad:
```markdown
We fixed a bug in commit abc123 where the login button didn't work.
```

Won't recur; clutters the file.

### 4. Verbose Explanations

Bad:
```markdown
The authentication system uses JWT tokens. JWT (JSON Web Tokens) are
an open standard (RFC 7519) that defines a compact and self-contained
way for securely transmitting information between parties as a JSON
object. In our implementation, we use the HS256 algorithm which...
```

Good:
```markdown
Auth: JWT with HS256, tokens in `Authorization: Bearer <token>` header.
```

### 5. Lint-Enforceable Rules

Bad:
```markdown
Use 2 spaces for indentation. Always use single quotes. Lines max 100 chars.
```

The linter or formatter already enforces these. Documenting them in the memory file just duplicates what the toolchain does, costing attention budget for zero behavioural gain. *(Source: HumanLayer, "Writing a good CLAUDE.md" — "Never send an LLM to do a linter's job.")*

### 6. Task-Specific Edge-Cases

Bad:
```markdown
When adding a new endpoint to /api/v2/payments, remember to update the
StripeWebhookHandler tests, the OpenAPI spec, the rate-limit config, and
the legal team's audit log mapping.
```

This level of task-specific detail "won't matter and will distract the model when you're working on something else." If the workflow is durable, encode it in a script or test fixture, not in the memory file. *(Source: HumanLayer.)*

### 7. Brittle If-Else Logic

Bad:
```markdown
If the file is in src/legacy/, use the old patterns. If in src/v2/, use
hooks. If in src/v3/, use signals. Unless it's a test file, in which case
use whatever the surrounding tests use, except for snapshot tests, where...
```

Anthropic's *Effective context engineering* (Sept 2025) warns against "brittle if-else logic embedded in prompts" and recommends "diverse, canonical examples rather than exhaustive edge cases." If the rules are this branchy, the abstraction is wrong — fix the code, not the prompt.

### 8. Auto-Incorporated Content (Uncurated)

Bad: Treating the `#` shortcut as a write-and-forget mechanism, leaving every captured line in the file unreviewed.

The `#` shortcut adds material on the fly; it does not curate. HumanLayer cites cases where AI-authored CLAUDE.md content produced *negative* effect on benchmarks. Treat any `#`-added line as a draft and prune within the same session.

## Diff Format for Updates

For each suggested change:

### 1. Identify the File

```
File: ./CLAUDE.md
Section: Commands (new section after ## Architecture)
```

### 2. Show the Change

```diff
 ## Architecture
 ...

+## Commands
+
+| Command | Purpose |
+|---------|---------|
+| `npm run dev` | Dev server with HMR |
+| `npm run build` | Production build |
+| `npm test` | Run test suite |
```

### 3. Explain Why

> **Why this helps:** The build commands weren't documented, causing
> confusion about how to run the project. This saves future sessions
> from needing to inspect `package.json`.

## Validation Checklist

Before finalizing an update, verify:

- [ ] Each addition is project-specific
- [ ] No generic advice or obvious info
- [ ] Commands are tested and work
- [ ] File paths are accurate
- [ ] Would a new Claude session find this helpful?
- [ ] Is this the most concise way to express the info?

**Displacement test (apply to every line, added or pre-existing):**

- [ ] Could this line be deleted with no loss of useful guidance?
- [ ] Is this duplicated by a linter, type-checker, or test? (If yes, cut.)
- [ ] Is this content where it should be a pointer, or a pointer where it should be content?
