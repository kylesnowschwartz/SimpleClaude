---
name: sc-work
description: Build, fix, or modify code - handles all implementation tasks
argument-hint: Description of what to build, fix, or modify
---

# sc-work: Universal Implementation Command

**Purpose**: I need to build/fix/modify something - handles all implementation tasks from creating new features to fixing bugs to refactoring code

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Multi-step coordination requiring handoffs
- Specialized domain expertise beyond general capability
- Parallel work streams with interdependencies
- Complex analysis requiring multiple perspectives
- Operations that produce verbose intermediate output

**Direct Agent Rules (ALWAYS delegate these):**

- **Documentation lookups** → Use `sc-repo-documentation-expert`
- **Web searches** → Use `sc-web-search-researcher`
- **GitHub searches** → Use `sc-github-researcher`
- **Deep codebase analysis** → Use `sc-code-explorer`
- **Architecture design** → Use `sc-code-architect`
- **Code quality review** → Use `sc-code-reviewer`

**Available Agents:**

- `sc-code-explorer` - Deeply analyzes existing codebase features by tracing execution paths and mapping architecture
- `sc-code-architect` - Designs feature architectures by analyzing existing patterns and providing implementation blueprints
- `sc-code-reviewer` - Reviews code for bugs, security vulnerabilities, and adherence to project conventions
- `sc-repo-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `sc-web-search-researcher` - Searches web for current information
- `sc-github-researcher` - Searches GitHub for repos, code, issues, and PRs via gh CLI

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Pattern Context → Classify → Validate → Route → Execute → Synthesize

## Pattern Context (Optional)

Before implementing, check if `.patterns/brief.json` exists in the project root:

- **If it exists and is fresh**: Read it and follow the relevant pattern constraints for the implementation scope. Match enforceable patterns. Use golden files as concrete examples to follow. Respect negative guidance (what NOT to copy).
- **If it exists but is stale**: Note this to the user and suggest running `/sc-patterns analyze` to refresh.
- **If it does not exist**: Proceed normally. Do not block implementation on pattern analysis.

Pattern context is supplementary — it improves implementation consistency but is never required.

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: "I need to build/fix/modify something" - implementation work including creating, modifying, fixing, refactoring, optimizing, or enhancing code.

**Command Execution:**

**Empty $ARGUMENTS**: Display usage suggestions → stop
**Has content**: Parse intent → apply strategy → route execution

**Intent Processing:** Extract intent → Apply strategy matrix → Validate → Execute

**Strategy Matrix:**

| Condition | Direct Handling     | Agent Required                 |
| --------- | ------------------- | ------------------------------ |
| Task Type | Simple, single-step | See "Direct Agent Rules" above |
| Domain    | Single, familiar    | Multi-tech, unknown            |
| Context   | Available locally   | External research needed       |
| Output    | Concise, focused    | Verbose, needs filtering       |

Transforms: $ARGUMENTS into structured execution:

- Intent: [implementation-goal-and-scope]
- Approach: [direct-implementation OR research-then-implement]
- Agents: [none OR minimal-viable-set]

### Output Template

```
## Response
[Direct answer or action taken - 1-3 sentences addressing the core request]

## Details
[Main content based on command type:
- Plan: Strategy breakdown with phases
- Work: Code changes and implementation steps
- Explore: Research findings and analysis
- Review: Issues found and quality assessment]

## Next Actions
[What to do next:
- Plan: Implementation steps to begin
- Work: Testing and validation needed
- Explore: Areas for deeper investigation
- Review: Fixes and improvements to make]

## Notes
[Optional - context, warnings, alternatives, or additional considerations]
```

---

**User Request**: $ARGUMENTS
