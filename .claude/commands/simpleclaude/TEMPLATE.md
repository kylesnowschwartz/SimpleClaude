# [command-name]: [User Intent Description]

**Purpose**: [What user intent this command serves - "I need to..." statement]

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Multi-step coordination requiring handoffs
- Specialized domain expertise beyond general capability
- Parallel work streams with interdependencies
- Complex analysis requiring multiple perspectives
- High token consumption operations (>1000 tokens)

**Execution Decision:**
- **Direct**: Single domain + clear path + <1000 tokens + no external needs
- **Agent**: Multi-tech OR research needed OR unknown patterns OR >1000 tokens OR verbose outputs

**Specialized Agents (with auto-deployment rules):**
- `context-analyzer` - Project structure mapping [use for: architecture, migration, features]
- `context7-documentation-specialist` - Library docs [saves ~9.5K tokens; use for: API lookups]
- `repo-documentation-finder` - GitHub examples [saves ~14K tokens; use for: patterns]
- `test-runner` - Test execution [saves ~4.8K tokens; use for: ANY test running]
- `web-search-researcher` - Current info [saves ~19K tokens; use for: best practices, security]

**Token Management Rules:**
- **Delegate >1000 tokens**: Context7 (10K→500), tests (5K→200), web (20K→1K), repos (15K→800)
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

| Condition | Direct Handling | Agent Required |
|-----------|----------------|----------------|
| Domain | Single, familiar | Multi-tech, unknown |
| Tokens | <1000 expected | >1000 expected |
| Context | Available locally | External research needed |
| Output | Concise, focused | Verbose, needs filtering |

**Pre-execution**: Validate confidence>medium, resources available, token impact assessed, fallback ready

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
<agents>[none OR minimal-viable-agent-set]</agents>
<token-impact>[estimated tokens saved by using agents]</token-impact>
<output>[expected result that fulfills the user intent]</output>
</example>

<example>
<input>${arguments} = [different natural language request for same intent category]</input>
<intent>[different context but same core intent]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[different complexity requiring different approach]</approach>
<agents>[different agent set OR none]</agents>
<token-impact>[estimated tokens saved by using agents]</token-impact>
<output>[result tailored to the specific context]</output>
</example>

### Output Template

```
## Summary
[1-2 sentence overview]

## Key Findings
- [Finding with evidence]
- [Finding with evidence]
- [Finding with evidence]

## Recommendations
1. [Action with rationale]
2. [Action with rationale]
3. [Action with rationale]

## Next Steps
- [Immediate action]
- [Follow-up item]
- [Long-term consideration]
```

---

**User Request**: ${arguments}
