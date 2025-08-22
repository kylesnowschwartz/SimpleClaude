# sc-modify: Intelligently Modify and Optimize Code

**Purpose**: Intelligently modify, improve, refactor, and optimize code with safety controls

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Complex refactoring affecting multiple system components
- Option 2: Performance optimization requiring deep analysis
- Option 3: Framework migrations with compatibility concerns
- Option 4: Modifications requiring rollback strategies

**Smart Selection Process:**

1. Assess: Can I apply this modification directly without agents?
2. If agents needed: Which specific modification capabilities does this require?
3. Deploy minimal viable agent set for the identified modification needs

**Available Specialized Agents**

- `context-analyzer` - analyze existing code structure and modification impact scope
- `context7-documentation-specialist` - update documentation to reflect modifications
- `repo-documentation-finder` - research migration paths from official repositories
- `test-runner` - verify modifications preserve existing behavior with tests
- `web-search-researcher` - research optimization strategies and best practices

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

Smart modification router that transforms natural language into structured improvement directives for performance optimization, refactoring, migration, and deployment tasks.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Transformation Examples

<example>
<input>${arguments} = improve performance</input>
<what>current codebase performance bottlenecks</what>
<how>profiling, optimization, caching, algorithm improvements</how>
<agents>context-analyzer → web-search-researcher → test-runner</agents>
<output>optimized code with performance metrics showing improvements</output>
</example>

<example>
<input>${arguments} = carefully refactor the payment module</input>
<what>payment module requiring safe refactoring</what>
<how>backup first, extract methods, preserve behavior, extensive testing</how>
<agents>context-analyzer → test-runner</agents>
<output>refactored payment module with improved structure and full test coverage</output>
</example>

<example>
<input>${arguments} = fix typo in README</input>
<what>simple text correction in documentation</what>
<how>direct edit without complex analysis</how>
<agents>none - handled directly for efficiency</agents>
<output>corrected README file</output>
</example>

<example>
<input>${arguments} = migrate to latest React with tests</input>
<what>React framework upgrade</what>
<how>staged migration, compatibility testing, validation</how>
<agents>repo-documentation-finder → test-runner</agents>
<output>upgraded React codebase with migration guide and passing tests</output>
</example>

---

**User Request**: ${arguments}
