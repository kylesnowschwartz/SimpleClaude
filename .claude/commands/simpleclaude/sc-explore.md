# sc-explore: Research and Understanding Command

**Purpose**: I need to understand something - conducts research, analysis, codebase exploration, and knowledge synthesis to build understanding

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

This command interprets natural language requests that express the intent: "I need to understand something" - research, analysis, exploration, learning, or investigation of codebases, technologies, concepts, or domain knowledge.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate exploration approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the understanding goal and scope from natural language
2. **Assess Complexity**: Determine if direct analysis or comprehensive research is needed
3. **Route Execution**: Apply appropriate exploration strategy based on domain and depth required

Transforms: "${arguments}" into structured execution:

- Intent: [understanding-goal-and-scope]
- Approach: [direct-exploration OR multi-source-research]
- Agents: [context-analyzer, documentation-specialists, web-search-researcher]

### Intent Recognition Examples

<example>
<input>${arguments} = "How does the authentication flow work in this application?"</input>
<intent>Codebase exploration - understanding authentication architecture</intent>
<approach>Direct codebase analysis to map authentication flow and patterns</approach>
<agents>context-analyzer (authentication components and flow mapping)</agents>
<output>Detailed authentication flow documentation with code references, security patterns, and integration points</output>
</example>

<example>
<input>${arguments} = "What are the best practices for implementing microservices with Docker?"</input>
<intent>Technology research - microservices and containerization knowledge</intent>
<approach>Comprehensive research combining documentation and current best practices</approach>
<agents>context7-documentation-specialist (Docker official docs), web-search-researcher (microservices best practices), repo-documentation-finder (example implementations)</agents>
<output>Comprehensive guide covering microservices patterns, Docker optimization, orchestration, monitoring, and real-world examples</output>
</example>

<example>
<input>${arguments} = "Analyze the performance bottlenecks in our data processing pipeline"</input>
<intent>System analysis - performance investigation and bottleneck identification</intent>
<approach>Multi-perspective analysis combining codebase review, testing, and research</approach>
<agents>context-analyzer (pipeline architecture analysis), test-runner (performance testing), web-search-researcher (optimization techniques)</agents>
<output>Performance analysis report with bottleneck identification, metrics, optimization recommendations, and implementation strategies</output>
</example>

---

**User Request**: ${arguments}
