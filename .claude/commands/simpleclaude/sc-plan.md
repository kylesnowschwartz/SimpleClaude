# sc-plan: Strategic Planning and Analysis

**Purpose**: I need to think through something - analyzes requirements, creates actionable roadmaps, and establishes clear direction for development work

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

This command interprets natural language requests that express the intent: "I need to think through something" - planning, analysis, strategy, roadmap creation, or architectural decision-making.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate solution approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the core planning need and context from natural language
2. **Assess Complexity**: Determine if direct analysis or agent research is needed
3. **Route Execution**: Apply appropriate planning approach based on scope and requirements

Transforms: "${arguments}" into structured execution:

- Intent: [planning-objective-and-scope]
- Approach: [direct-analysis OR research-then-plan]
- Agents: [context-analyzer, web-search-researcher, documentation-specialists]

### Intent Recognition Examples

<example>
<input>${arguments} = "How should I approach adding real-time notifications to this app?"</input>
<intent>Architecture planning for real-time notifications feature</intent>
<approach>Direct analysis of current architecture + web research for best practices</approach>
<agents>context-analyzer (current architecture), web-search-researcher (real-time solutions)</agents>
<output>Structured plan with technology recommendations, implementation phases, and integration approach</output>
</example>

<example>
<input>${arguments} = "I need to plan the migration from React 16 to React 18"</input>
<intent>Technology migration strategy and roadmap</intent>
<approach>Documentation research + current codebase analysis + migration planning</approach>
<agents>context-analyzer (current React usage), context7-documentation-specialist (React 18 migration guide), web-search-researcher (migration best practices)</agents>
<output>Phased migration plan with breaking changes, testing strategy, and timeline</output>
</example>

---

**User Request**: ${arguments}
