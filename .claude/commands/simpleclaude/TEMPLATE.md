# [command-name]: [User Intent Description]

**Purpose**: [What user intent this command serves - "I need to..." statement]

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Multi-step coordination requiring handoffs
- Option 2: Specialized domain expertise beyond general capability
- Option 3: Parallel work streams with interdependencies
- Option 4: Complex analysis requiring multiple perspectives

**Smart Selection Process:**

1. Assess: Can I complete this efficiently without agents?
2. If agents needed: Which specific capabilities does this task require?
3. Deploy minimal viable agent set for the identified needs

**Available Specialized Agents**

- `context-analyzer` - Maps project structure, technology stack, and existing patterns to enable informed development decisions
- `context7-documentation-specialist` - Retrieves current, accurate documentation for libraries/frameworks through Context7 system
- `repo-documentation-finder` - Finds up-to-date documentation and examples from official GitHub repositories
- `test-runner` - Runs tests and analyzes failures for systematic validation without making fixes
- `web-search-researcher` - Conducts web research for current information and best practices

**Agent Selection Mapping:**

| Intent Type | Required Capabilities | Agent Set |
|------------|----------------------|-----------|
| Architecture Planning | Structure analysis + best practices | context-analyzer + web-search-researcher |
| Technology Migration | Documentation + current state | context7-documentation-specialist + context-analyzer |
| Feature Implementation | Patterns + examples | context-analyzer + repo-documentation-finder |
| Performance Analysis | Testing + optimization research | test-runner + web-search-researcher |
| Security Verification | Vulnerability research + testing | web-search-researcher + test-runner |

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: [Intent description - e.g., "I need to think through something", "I need to understand something"].

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate solution approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the core intent and context from natural language
2. **Classify Complexity**: Apply decision matrix for routing
3. **Validate Approach**: Confirm resources and fallback strategy
4. **Route Execution**: Execute based on classification results

**Complexity Classification Matrix:**

Direct Handling IF ALL are true:
- Single domain/technology focus
- Current project context sufficient
- No external research required
- Clear implementation path exists

Agent Orchestration IF ANY are true:
- Multi-technology integration needed
- Current best practices research required
- Unknown patterns in project
- Multiple analysis perspectives beneficial

**Pre-Execution Validation:**
- ☐ Intent correctly identified (confidence > medium)
- ☐ Required resources available (project context, agents)
- ☐ Output format appropriate for request type
- ☐ Fallback strategy defined if primary approach fails

Transforms: "${arguments}" into structured execution:

- Intent: [recognized-user-intent]
- Confidence: [high/medium/low based on pattern match clarity]
- Approach: [selected-execution-method]
- Agents: [minimal-viable-agent-set]
- Fallback: [alternative approach if confidence is low]

### Intent Recognition Examples

<example>
<input>${arguments} = [natural language request expressing core intent]</input>
<intent>[recognized user intent and context]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[direct handling OR agent orchestration with reasoning]</approach>
<agents>[none OR minimal-viable-agent-set]</agents>
<fallback>[alternative if primary fails]</fallback>
<output>[expected result that fulfills the user intent]</output>
</example>

<example>
<input>${arguments} = [different natural language request for same intent category]</input>
<intent>[different context but same core intent]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[different complexity requiring different approach]</approach>
<agents>[different agent set OR none]</agents>
<fallback>[alternative if primary fails]</fallback>
<output>[result tailored to the specific context]</output>
</example>

### Output Template Structure

All commands should return results in this format:

```
## Analysis Summary
[1-2 sentence overview of findings]

## Key Findings
- [Finding 1 with evidence/context]
- [Finding 2 with evidence/context]
- [Finding 3 with evidence/context]

## Recommendations
1. [Actionable recommendation with rationale]
2. [Actionable recommendation with rationale]
3. [Actionable recommendation with rationale]

## Next Steps
- [Immediate action item]
- [Follow-up consideration]
- [Long-term planning item]
```

---

**User Request**: ${arguments}
