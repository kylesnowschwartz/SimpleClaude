# [command-name]: [Brief Command Description]

**Purpose**: [Command purpose - single clear statement]

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

- `context-analyzer` - analyze project structure and requirements
- `context7-documentation-specialist` - create documentation and knowledge synthesis
- `repo-documentation-finder` - investigate best practices from official repositories
- `test-runner` - run tests and verify implementation meets requirements
- `web-search-researcher` - research current best practices and solutions

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

[Main command description - explains how natural language is transformed into structured actions]

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Transformation Examples

<example>
<input>${arguments} = [natural language example]</input>
<what>[target description]</what>
<how>[approach description]</how>
<agents>[example-agent-sequence]</agents>
<output>[expected output]</output>
</example>

<example>
<input>${arguments} = [another natural language example]</input>
<what>[different target]</what>
<how>[different approach]</how>
<agents>[different-agent-sequence]</agents>
<output>[different output]</output>
</example>

---

**User Request**: ${arguments}
