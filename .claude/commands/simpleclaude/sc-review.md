# sc-review: Quality Verification and Assessment

**Purpose**: I need to verify quality/security/performance - comprehensive analysis covering code quality, security scanning, performance profiling, and architecture assessment

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

This command interprets natural language requests that express the intent: "I need to verify quality/security/performance" - comprehensive assessment including code quality review, security scanning, performance profiling, and architecture analysis.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate verification approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the verification goal and scope from natural language
2. **Assess Complexity**: Determine if direct review or comprehensive analysis is needed
3. **Route Execution**: Apply appropriate verification strategy based on domain and depth required

Transforms: "${arguments}" into structured execution:

- Intent: [verification-goal-and-scope]
- Approach: [direct-review OR comprehensive-analysis]
- Agents: [context-analyzer, test-runner, web-search-researcher]

### Intent Recognition Examples

<example>
<input>${arguments} = "Review this pull request for security vulnerabilities"</input>
<intent>Security verification - comprehensive security audit of PR changes</intent>
<approach>Multi-perspective analysis combining code review, security research, and vulnerability scanning</approach>
<agents>context-analyzer (code change analysis), web-search-researcher (security vulnerability research)</agents>
<output>Security audit report with vulnerability assessment, risk ratings, and remediation recommendations</output>
</example>

<example>
<input>${arguments} = "Check the performance of our data processing pipeline"</input>
<intent>Performance verification - bottleneck identification and optimization analysis</intent>
<approach>Performance profiling with testing and optimization research</approach>
<agents>context-analyzer (pipeline architecture), test-runner (performance testing), web-search-researcher (optimization techniques)</agents>
<output>Performance analysis with bottleneck identification, metrics, and optimization strategies</output>
</example>

<example>
<input>${arguments} = "Verify code quality standards across the authentication module"</input>
<intent>Quality verification - comprehensive code quality assessment</intent>
<approach>Direct code review with standards validation and best practices research</approach>
<agents>context-analyzer (authentication patterns), web-search-researcher (security best practices)</agents>
<output>Code quality report with standards compliance, security patterns assessment, and improvement recommendations</output>
</example>

---

**User Request**: ${arguments}
