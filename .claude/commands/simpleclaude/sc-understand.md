# sc-understand: Understand Codebases Through Intelligent Analysis

**Purpose**: Understand codebases through intelligent analysis, explanation, and documentation

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Multi-faceted analysis requiring different perspectives
- Option 2: Complex architectural understanding beyond surface level
- Option 3: Parallel investigation of multiple system components
- Option 4: Deep knowledge synthesis requiring specialized expertise

**Smart Selection Process:**

1. Assess: Can I explain this code directly without agents?
2. If agents needed: Which specific understanding capabilities does this require?
3. Deploy minimal viable agent set for the identified understanding needs

**Available Specialized Agents**

- `context-analyzer` - analyze codebase structure and understanding requirements
- `debugging-specialist` - trace execution flows and analyze code behavior for comprehension
- `documentation-specialist` - synthesize findings into clear explanations and documentation
- `implementation-specialist` - break down complex implementations into understandable components
- `research-analyst` - investigate patterns, libraries, and implementation approaches
- `system-architect` - identify and explain architectural patterns and design decisions
- `validation-review-specialist` - confirm understanding accuracy and identify gaps

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

Intelligent analysis router that transforms natural language into structured understanding approaches for code explanation, architecture visualization, and knowledge extraction.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Transformation Examples

<example>
<input>${arguments} = explain how authentication works</input>
<what>authentication system flow and components</what>
<how>step-by-step explanation with examples and flow diagrams</how>
<agents>context-analyzer → research-analyst → documentation-specialist</agents>
<output>comprehensive authentication flow documentation with visual diagrams</output>
</example>

<example>
<input>${arguments} = show me the architecture visually</input>
<what>system architecture and component relationships</what>
<how>generate diagrams and visual representations with mermaid/ASCII art</how>
<agents>context-analyzer → system-architect → documentation-specialist</agents>
<output>architectural diagrams showing system structure and interactions</output>
</example>

<example>
<input>${arguments} = analyze performance bottlenecks</input>
<what>system performance characteristics and potential issues</what>
<how>comprehensive analysis with metrics and optimization suggestions</how>
<agents>context-analyzer → research-analyst → debugging-specialist → documentation-specialist</agents>
<output>performance analysis report with identified bottlenecks and recommendations</output>
</example>

<example>
<input>${arguments} = what does this function do</input>
<what>single function purpose and behavior</what>
<how>direct code reading and explanation without agent overhead</how>
<agents>none - handled directly for efficiency</agents>
<output>concise explanation of function purpose, parameters, and return value</output>
</example>

---

**User Request**: ${arguments}
