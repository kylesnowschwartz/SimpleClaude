# sc-create: Create Anything from Components to Complete Systems

**Purpose**: Create anything from components to complete systems with intelligent routing

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Multi-component systems requiring coordinated architecture
- Option 2: Complex implementations beyond single-file scope
- Option 3: Parallel creation of interdependent components
- Option 4: Design-first approaches requiring careful planning

**Smart Selection Process:**

1. Assess: Can I create this component directly without agents?
2. If agents needed: Which specific creation capabilities does this require?
3. Deploy minimal viable agent set for the identified creation needs

**Available Specialized Agents**

- `context-analyzer` - analyze project structure and identify integration points
- `context7-documentation-specialist` - create comprehensive documentation for new components
- `repo-documentation-finder` - research best practices from official repositories
- `test-runner` - run tests and validate implementation correctness
- `web-search-researcher` - research current best practices and patterns

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

Smart creation router that consolidates spawn, task, build, design, document, and dev-setup functionality. Transforms natural language into structured creation directives. Build exactly to user specifications without refactoring or unasked for enhancements.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Transformation Examples

<example>
<input>${arguments} = user auth API</input>
<what>REST API with authentication endpoints</what>
<how>implement JWT tokens, validation middleware, tests, and documentation</how>
<agents>context-analyzer → test-runner</agents>
<output>complete authentication API with login/register endpoints, JWT handling, and tests</output>
</example>

<example>
<input>${arguments} = carefully plan a payment system</input>
<what>payment processing system architecture</what>
<how>meticulous design-first approach with comprehensive planning and risk analysis</how>
<agents>web-search-researcher → context7-documentation-specialist</agents>
<output>detailed architecture document with payment flow diagrams and implementation plan</output>
</example>

<example>
<input>${arguments} = react button component</input>
<what>simple React button component</what>
<how>create component following existing patterns without overhead</how>
<agents>none - handled directly for efficiency</agents>
<output>functional React button component with props and basic styling</output>
</example>

<example>
<input>${arguments} = magic dashboard UI with animations</input>
<what>interactive dashboard interface with animated elements</what>
<how>modern UI patterns, responsive design, smooth CSS/JS animations</how>
<agents>context-analyzer → test-runner</agents>
<output>complete dashboard UI with charts, widgets, and smooth animations</output>
</example>

---

**User Request**: ${arguments}
