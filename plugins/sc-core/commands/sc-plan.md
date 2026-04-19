---
name: sc-plan
description: Strategic planning and analysis for requirements and roadmaps
argument-hint: Planning task or requirement to analyze
---

# sc-plan: Strategic Planning and Analysis

**Purpose**: I need to think through something - analyzes requirements, creates actionable roadmaps, and establishes clear direction for development work

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Multi-step coordination requiring handoffs
- Specialized domain expertise beyond general capability
- Parallel work streams with interdependencies
- Complex analysis requiring multiple perspectives
- Operations that produce verbose intermediate output

**Direct Agent Rules (ALWAYS delegate these):**

- **Documentation lookups** → Use `sc-research-repo`
- **Web searches** → Use `sc-research-web`
- **GitHub searches** → Use `sc-research-github`
- **Deep codebase analysis** → Use `sc-code-explorer`
- **Architecture design** → Use `sc-code-architect`
- **Code quality review** → Use `sc-code-reviewer`

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Prior Work Context → Classify → Validate → Route → Execute → Synthesize

## Prior Work Context (Optional)

Before planning, check if `.agent-history/` and `.cloned-sources/` directories exist in the project root:

- **If present and relevant**: Read it and incorporate direct references with absolute paths into your plan. Note any conflicted areas where human judgment is needed.
- **If it does not exist**: Proceed normally. Do not block planning on prior-work context.

Prior work context is supplementary — it improves plan quality but is never required.

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: "I need to think through something" - planning, analysis, strategy, roadmap creation, or architectural decision-making.

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

Transforms: $AGENTS into structured execution:

- Intent: [recognized-user-intent]
- Approach: [direct/agent with reasoning]
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
