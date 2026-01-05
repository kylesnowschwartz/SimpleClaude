---
description: Interactive wizard to create context packets for agent tasks
argument-hint: [optional: title or short description of the work]
---

# sc-context-wizard: Agent Context Packet Builder

_Structured workflow to create context packets that dramatically improve agent outcomes._

## What is a Context Packet?

A **context packet** is a tight, structured artifact that makes implicit requirements explicit before any coding starts. Based on [Where Good Ideas Come From (for Coding Agents)](https://sunilpai.dev/posts/seven-ways/), context packets transform vague requests into agent-compatible specifications.

**The key insight**: "Agents make code cheaper. They do not make judgment cheap." The scarce skill is expressing constraints, designing verification, and maintaining feedback loops—not keystrokes.

## Process:

### Phase 1: Human Judgment Fields

**These require explicit user-input - the user knows these better than any agent can discover:**

#### 1. Goal (1 sentence)
Use `AskUserQuestion` to prompt:
- **Question**: "What is the goal of this work? (1 sentence describing the outcome, not the mechanism)"
- **Examples**:
  - "Make webhook ingestion reliable under variable load"
  - "Add user profile editing with validation"
  - "Optimize database queries for the reporting dashboard"

#### 2. Non-Goals (Scope Boundaries)
Use `AskUserQuestion` to prompt:
- **Question**: "What are the explicit non-goals? (What's intentionally out of scope?)"
- **Examples**:
  - "Not changing the webhook payload format"
  - "Not building admin UI for this release"
  - "Not migrating existing data"

#### 3. Constraints (Budgets, Limits, Forbidden Actions)
Use `AskUserQuestion` to prompt:
- **Question**: "What are the constraints? (Budgets, safety properties, forbidden actions)"
- **Examples**:
  - "Must complete within 200ms p95"
  - "Cannot break existing API contracts"
  - "No new external dependencies without approval"
  - "Must maintain backward compatibility"

#### 4. Authority Order (Source Hierarchy)
Use `AskUserQuestion` to prompt:
- **Question**: "When sources disagree, what's the authority order? (Which sources win?)"
- **Default template**: "Tests > Documentation > Code comments > Implementation"
- **Allow customization**: User can modify or accept default

### Phase 2: Optional Agent-Assisted Discovery

**Leverage agents for codebase exploration:**

#### 5. Repo Anchors (3-10 Key Files)
Use `AskUserQuestion` with two options:
- **Question**: "How should we identify repo anchors (3-10 files defining truth)?"
- **Options**:
  - "Let me specify them manually" → Prompt for file paths
  - "Discover them automatically" → In the BACKGROUND, spawn 1-3 **Explore agent** with prompt:
    ```
    Find 3-10 key files that define the truth for: ${goal}

    Look for:
    - Core domain models/entities
    - Primary API endpoints or controllers
    - Key configuration files
    - Main business logic files
    - Critical integration points

    Return a ranked list with brief explanations of why each file is a truth anchor.
    ```

#### 6. Prior Art (Existing Patterns to Reuse)
Use `AskUserQuestion` with two options:
- **Question**: "How should we identify prior art (patterns to copy/reuse)?"
- **Options**:
  - "Let me specify manually" → Prompt for descriptions
  - "Discover automatically" → In the BACKGROUND, spawn **Explore agent** with prompt:
    ```
    Find existing patterns related to: ${goal}

    Search for:
    - Similar features or functionality
    - Comparable error handling patterns
    - Related test structures
    - Analogous validation logic
    - Existing integrations we should mirror

    Return specific file paths and pattern descriptions that should be reused.
    ```

### Phase 3: Success Criteria and Risk

#### 7. Oracle (Defining "Done")
Use `AskUserQuestion` to prompt:
- **Question**: "What's your oracle? (Tests, benchmarks, or checks that define 'done')"
- **Examples**:
  - "All existing tests pass + new test suite for retries"
  - "Lighthouse score > 90 on production build"
  - "Benchmark shows <100ms p95 latency"
  - "Manual QA checklist completed"

#### 8. Examples (Input → Output Cases)
Use `AskUserQuestion` to prompt:
- **Question**: "Provide 2-3 examples (input → expected output, including failure cases)"
- **Format guidance**:
  ```
  Example 1 (Happy path):
  Input: [specific input]
  Output: [expected result]

  Example 2 (Edge case):
  Input: [boundary condition]
  Output: [expected behavior]

  Example 3 (Failure case):
  Input: [invalid input]
  Output: [error handling]
  ```

#### 9. Risk and Rollout
Use `AskUserQuestion` to prompt:
- **Question**: "What are the risks and rollout considerations?"
- **Prompt for**:
  - Failure modes (what could go wrong?)
  - Mitigation strategies
  - Deployment approach (feature flag? gradual rollout? all-at-once?)
  - Rollback plan
  - **Default template**: "Create a Pull Request using the pr-template. Request reviews from the engineering team. Then verify in development and/or staging before deploying to production."


### Phase 4: Agent Instructions

#### 10. Procedural Guardrails
Present this template and ask for customizations:

**Default template**:
```markdown
## Agent Instructions

When implementing this work:

1. **Keep diffs small**: Aim for focused, reviewable changes
2. **Cite patterns**: Reference prior art from repo anchors explicitly
3. **Run tests frequently**: Execute oracle checks after each meaningful change
4. **Fail fast**: If assumptions break, stop and ask rather than guessing
5. **Document why**: Comments explain reasoning, not mechanics
6. **Preserve constraints**: Never violate stated constraints without explicit approval
```

Use `AskUserQuestion`:
- **Question**: "Review the agent instructions template. Any modifications or additions?"
- **Allow**: User can accept as-is or provide specific changes

---

## Output Generation

### Create the Context Packet File

**Location**: `.agent-history/context-packet-YYYYMMDD.md` or `.agent-history/context-packet-git-branch.md` if on a named branch

**Format**:
```markdown
# Context Packet: [Goal - Short Title]

Created: YYYY-MM-DD

## Goal

[1 sentence from Phase 1]

## Non-Goals

[Bulleted list from Phase 1]

## Constraints

[Bulleted list from Phase 1]

## Authority Order

[Hierarchy from Phase 1]

## Repo Anchors

[3-10 files from Phase 2, with brief descriptions]

## Prior Art

[Patterns to reuse from Phase 2, with file references]

## Oracle

[Success criteria from Phase 3]

## Examples

[2-3 input→output cases from Phase 3]

## Risk and Rollout

[Failure modes and deployment strategy from Phase 3]

## Agent Instructions

[Procedural guardrails from Phase 4]

---

_This context packet should be referenced at the start of agent sessions working on this goal. Include it with: `@.agent-history/context-packet-YYYYMMDD.md`_
```

### Completion Message

After generating the file, output:

```
✓ Context packet created: .agent-history/context-packet-[timestamp].md

To use this context packet in your next agent session:

1. Reference it in your prompt: @.agent-history/context-packet-[timestamp].md
2. Or invoke a command with context: /sc-work @.agent-history/context-packet-[timestamp].md

The context packet pins your objectives and installs success criteria before any coding starts.
```

---

## Implementation Notes

### Agent Spawning Strategy

When spawning Explore agents for discovery:

1. **Parallel execution**: Run repo anchor discovery and prior art discovery in parallel if user selects both
2. **Timeout**: Set reasonable timeouts (2-3 minutes per agent)
3. **Graceful degradation**: If agent fails, fall back to manual specification
4. **Model selection**: Use `haiku` for fast discovery tasks (specified in frontmatter: `model: opus` for main command, agents can use faster models)

### File Management

1. **Create `.agent-history/` if it doesn't exist**: `mkdir -p .agent-history/`
2. **Timestamp format**: `YYYYMMDD` and optional `-HHMMSS` for sortable, unique filenames

### Question Flow Optimization

1. **Progressive disclosure**: Only ask discovery questions if user wants automation
2. **Sensible defaults**: Offer templates that work out-of-box
3. **Skip redundancy**: If goal is simple, don't force complex examples
4. **Context preservation**: Keep previous answers visible during multi-question flow

---

### Iteration strategy:

Context packets aren't write-once artifacts:

1. **Initial creation**: Use wizard to establish baseline
2. **Refinement**: Update packet as constraints clarify
3. **Retrospective**: After completion, note what was accurate vs. what changed
4. **Template extraction**: Convert successful packets into templates for similar work

---

_Remember: The goal is to make implicit requirements explicit. If you're unsure about constraints or success criteria, that's exactly why you need a context packet. The wizard helps surface those uncertainties before they become bugs._

${ARGUMENTS}
