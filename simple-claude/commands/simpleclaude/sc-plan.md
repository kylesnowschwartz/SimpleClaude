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

- **Documentation lookups** → Use `repository-documentation-expert`
- **Test execution** → Use `test-runner`
- **Web searches** → Use `web-search-researcher`
- **Deep codebase analysis** → Use `code-explorer`
- **Architecture design** → Use `code-architect`
- **Code quality review** → Use `code-reviewer`

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Classify → Validate → Route → Execute → Synthesize

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

### Intent Recognition Examples

<example>
<input>$ARGUMENTS = "How should I approach adding real-time notifications to this app?"</input>
<intent>Architecture planning for real-time notifications feature</intent>
<approach>Direct analysis + agent research for best practices</approach>
<agents>web-search-researcher (per Direct Agent Rules)</agents>
<output>Structured plan with technology recommendations and implementation phases</output>
</example>

<example>
<input>$ARGUMENTS = "I need to plan the migration from React 16 to React 18"</input>
<intent>Technology migration strategy and roadmap</intent>
<approach>Documentation research + codebase analysis + migration planning</approach>
<agents>repository-documentation-expert (per Direct Agent Rules), context-analyzer if 10+ files</agents>
<output>Phased migration plan with breaking changes, testing strategy, and timeline</output>
</example>

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
