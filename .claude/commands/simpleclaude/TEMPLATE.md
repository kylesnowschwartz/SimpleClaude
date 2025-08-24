# [command-name]: [User Intent Description]

**Purpose**: [What user intent this command serves - "I need to..." statement]

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Multi-step coordination requiring handoffs
- Option 2: Specialized domain expertise beyond general capability
- Option 3: Parallel work streams with interdependencies
- Option 4: Complex analysis requiring multiple perspectives
- Option 5: High token consumption operations (>1000 tokens)

**Smart Selection Process:**

1. Assess: Can I complete this efficiently without agents?
   - Will this use <1000 tokens?
   - Is all needed context already available?
   - Will the output be concise?
   
2. If agents needed: Which specific capabilities does this task require?
   - What high-token operations need isolation?
   - Which intermediate data can be discarded?
   - What synthesis is needed from verbose outputs?
   
3. Deploy minimal viable agent set for the identified needs
   - Prioritize agents for token-heavy operations
   - Use agents as filters for verbose outputs
   - Keep only actionable results in main context

**Available Specialized Agents**

- `context-analyzer` - Maps project structure, technology stack, and existing patterns to enable informed development decisions
- `context7-documentation-specialist` - Retrieves current, accurate documentation for libraries/frameworks through Context7 system
- `repo-documentation-finder` - Finds up-to-date documentation and examples from official GitHub repositories
- `test-runner` - Runs tests and analyzes failures for systematic validation without making fixes
- `web-search-researcher` - Conducts web research for current information and best practices

**Token Management Best Practices:**

Always delegate to agents:
- **Context7 lookups**: Returns 10K+ tokens, agent extracts relevant ~500 tokens
- **Test execution**: Output can be 5K+ tokens, agent provides ~200 token summary
- **Web research**: Multiple pages = 20K+ tokens, agent synthesizes to ~1K
- **Repository documentation**: Full docs = 15K+ tokens, agent filters to ~800
- **Multi-file analysis**: Reading 10+ files, agent provides focused analysis

Keep in main context:
- User's original request
- Final actionable recommendations
- Critical code changes
- Summary of findings
- Next steps

Discard after use:
- Intermediate test output
- Full documentation pages
- Research source material
- Verbose error logs
- Exploratory file reads

**Agent Selection Mapping:**

| Intent Type | Required Capabilities | Agent Set | Token Rationale |
|------------|----------------------|-----------|-----------------|
| Architecture Planning | Structure analysis + best practices | context-analyzer + web-search-researcher | Web research produces high intermediate tokens |
| Technology Migration | Documentation + current state | context7-documentation-specialist + context-analyzer | Context7 returns large docs, only need relevant parts |
| Feature Implementation | Patterns + examples | context-analyzer + repo-documentation-finder | Repo docs can be extensive, agent filters to essentials |
| Performance Analysis | Testing + optimization research | test-runner + web-search-researcher | Test output verbose, only need failure analysis |
| Security Verification | Vulnerability research + testing | web-search-researcher + test-runner | Security scans produce extensive logs |
| Test Execution | Any test running | test-runner | Test output can be thousands of lines |
| Documentation Lookup | Library/framework docs | context7-documentation-specialist | Docs often 10K+ tokens, agent extracts relevant sections |

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: [Intent description - e.g., "I need to think through something", "I need to understand something"].

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate solution approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the core intent and context from natural language
2. **Classify Execution Strategy**: Apply decision matrix for routing
3. **Validate Approach**: Confirm resources and fallback strategy
4. **Route Execution**: Execute based on classification results

**Execution Strategy Matrix:**

Direct Handling IF ALL are true:
- Single domain/technology focus
- Current project context sufficient
- No external research required
- Clear implementation path exists
- Token usage will be minimal (<1000 tokens)
- No large output operations expected

Agent Orchestration REQUIRED IF ANY are true:
- Multi-technology integration needed
- Current best practices research required
- Unknown patterns in project
- Multiple analysis perspectives beneficial
- **High token consumption operations:**
  - Documentation fetching (Context7, repo docs)
  - Test execution with verbose output
  - Web research with multiple sources
  - Large file analysis or generation
  - Operations producing >1000 tokens of intermediate data

**Pre-Execution Validation:**
- ☐ Intent correctly identified (confidence > medium)
- ☐ Required resources available (project context, agents)
- ☐ Token impact assessed (delegate high-token operations)
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
<token-impact>[estimated tokens saved by using agents]</token-impact>
<fallback>[alternative if primary fails]</fallback>
<output>[expected result that fulfills the user intent]</output>
</example>

<example>
<input>${arguments} = [different natural language request for same intent category]</input>
<intent>[different context but same core intent]</intent>
<confidence>[high/medium/low]</confidence>
<approach>[different complexity requiring different approach]</approach>
<agents>[different agent set OR none]</agents>
<token-impact>[estimated tokens saved by using agents]</token-impact>
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
