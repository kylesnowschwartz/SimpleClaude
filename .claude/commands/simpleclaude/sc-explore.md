# sc-explore: Research and Understanding Command

**Purpose**: I need to understand something - conducts research, analysis, codebase exploration, and knowledge synthesis to build understanding

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
- **Multi-file analysis (10+ files)** → Use `context-analyzer`

**Available Agents:**

- `context-analyzer` - Maps project structure, patterns, and architecture
- `repository-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `test-runner` - Executes tests and analyzes failures
- `web-search-researcher` - Searches web for current information

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Classify → Validate → Route → Execute → Synthesize

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: "I need to understand something" - research, analysis, exploration, learning, or investigation of codebases, technologies, concepts, or domain knowledge.

**Command Execution:**

**Empty "${arguments}"**: Display usage suggestions → stop
**Has content**: Parse intent → apply strategy → route execution

**Intent Processing:** Extract intent → Apply strategy matrix → Validate → Execute

**Strategy Matrix:**

| Condition | Direct Handling     | Agent Required                 |
| --------- | ------------------- | ------------------------------ |
| Task Type | Simple, single-step | See "Direct Agent Rules" above |
| Domain    | Single, familiar    | Multi-tech, unknown            |
| Context   | Available locally   | External research needed       |
| Output    | Concise, focused    | Verbose, needs filtering       |

Transforms: "${arguments}" into structured execution:

- Intent: [recognized-user-intent]
- Approach: [direct/agent with reasoning]
- Agents: [none OR minimal-viable-set]

### Intent Recognition Examples

<example>
<input>${arguments} = "How does the authentication flow work in this application?"</input>
<intent>Codebase exploration - understanding authentication architecture</intent>
<approach>Direct codebase analysis to map authentication flow and patterns</approach>
<agents>context-analyzer (authentication components and flow mapping)</agents>
<output>Detailed authentication flow documentation with code references, security patterns, and integration points</output>
</example>

<example>
<input>${arguments} = "What are the best practices for implementing microservices with Docker?"</input>
<intent>Technology research - microservices and containerization knowledge</intent>
<approach>Comprehensive research combining documentation and current best practices</approach>
<agents>repository-documentation-expert (Docker official docs and examples), web-search-researcher (microservices best practices)</agents>
<output>Comprehensive guide covering microservices patterns, Docker optimization, orchestration, monitoring, and real-world examples</output>
</example>

<example>
<input>${arguments} = "Analyze the performance bottlenecks in our data processing pipeline"</input>
<intent>System analysis - performance investigation and bottleneck identification</intent>
<approach>Multi-perspective analysis combining codebase review, testing, and research</approach>
<agents>context-analyzer (pipeline architecture analysis), test-runner (performance testing), web-search-researcher (optimization techniques)</agents>
<output>Performance analysis report with bottleneck identification, metrics, optimization recommendations, and implementation strategies</output>
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

**User Request**: ${arguments}
