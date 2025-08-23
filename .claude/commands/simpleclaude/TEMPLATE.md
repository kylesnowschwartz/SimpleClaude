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

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: [Intent description - e.g., "I need to think through something", "I need to understand something"].

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate solution approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the core intent and context from natural language
2. **Assess Complexity**: Determine if direct handling or agent orchestration is needed
3. **Route Execution**: Apply appropriate approach based on intent and complexity

Transforms: "${arguments}" into structured execution:

- Intent: [recognized-user-intent]
- Approach: [selected-execution-method]
- Agents: [minimal-viable-agent-set]

### Intent Recognition Examples

<example>
<input>${arguments} = [natural language request expressing core intent]</input>
<intent>[recognized user intent and context]</intent>
<approach>[direct handling OR agent orchestration with reasoning]</approach>
<agents>[none OR minimal-viable-agent-set]</agents>
<output>[expected result that fulfills the user intent]</output>
</example>

<example>
<input>${arguments} = [different natural language request for same intent category]</input>
<intent>[different context but same core intent]</intent>
<approach>[different complexity requiring different approach]</approach>
<agents>[different agent set OR none]</agents>
<output>[result tailored to the specific context]</output>
</example>

---

**User Request**: ${arguments}
