# [command-name]: [User Intent Description]

**Purpose**: [What user intent this command serves - "I need to..." statement]

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Multi-step coordination requiring handoffs
- Specialized domain expertise beyond general capability
- Parallel work streams with interdependencies
- Complex analysis requiring multiple perspectives
- Operations that produce verbose intermediate output

**Direct Agent Rules (ALWAYS delegate these):**

- **Documentation lookups** → Use `context7-documentation-specialist` (fallback: `repo-documentation-finder`)
- **Test execution** → Use `test-runner`
- **Web searches** → Use `web-search-researcher`
- **Multi-file analysis (10+ files)** → Use `context-analyzer`

**Available Agents:**

- `context-analyzer` - Maps project structure, patterns, and architecture
- `context7-documentation-specialist` - Fetches library/framework documentation
- `repo-documentation-finder` - Finds examples from GitHub repositories
- `test-runner` - Executes tests and analyzes failures
- `web-search-researcher` - Searches web for current information

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Classify → Validate → Route → Execute → Synthesize

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: [Intent description - e.g., "I need to think through something", "I need to understand something"].

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

**Pre-execution**: Validate confidence>medium, resources available, appropriate agents selected, fallback ready

Transforms: "${arguments}" into structured execution:

- Intent: [recognized-user-intent]
- Confidence: [high/medium/low]
- Approach: [direct/agent with reasoning]
- Agents: [none OR minimal-viable-set]
- Fallback: [alternative if low confidence]

### Intent Recognition Examples

<example>
<input>${arguments} = [natural language request expressing core intent]</input>
<intent>[recognized user intent and context]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[direct handling OR agent orchestration with reasoning]</approach>
<agents>[none OR specific agents per Direct Agent Rules]</agents>
<output>[expected result that fulfills the user intent]</output>
</example>

<example>
<input>${arguments} = [different natural language request for same intent category]</input>
<intent>[different context but same core intent]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[different complexity requiring different approach]</approach>
<agents>[different agent set OR none per Direct Agent Rules]</agents>
<output>[result tailored to the specific context]</output>
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
