# sc-fix: Fix Bugs and Issues with Intelligent Debugging

**Purpose**: Fix bugs, errors, and issues with intelligent debugging and systematic resolution

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Complex bugs requiring systematic root cause analysis
- Option 2: Performance issues needing profiling and investigation
- Option 3: Security vulnerabilities requiring careful patching
- Option 4: Regression issues affecting multiple components

**Smart Selection Process:**

1. Assess: Can I fix this issue directly without agents?
2. If agents needed: Which specific debugging capabilities does this require?
3. Deploy minimal viable agent set for the identified fix needs

**Available Specialized Agents**

- `context-analyzer` - analyze error context, stack traces, and affected code paths
- `debugging-specialist` - systematic root cause analysis and issue reproduction
- `documentation-specialist` - document fix and create prevention guidelines
- `implementation-specialist` - implement targeted fix following debugging findings
- `research-analyst` - investigate error patterns and debugging best practices
- `system-architect` - design comprehensive fix strategy for systemic issues
- `validation-review-specialist` - verify fix resolves issue and prevents regression

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

Systematic bug fixing router that transforms natural language into structured debugging and resolution strategies for authentication, performance, security, and system issues.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Transformation Examples

<example>
<input>${arguments} = fix the login bug</input>
<what>authentication flow error</what>
<how>identify login failure point and apply targeted fix</how>
<agents>context-analyzer → debugging-specialist → implementation-specialist → validation-review-specialist</agents>
<output>fixed authentication with tests confirming login works correctly</output>
</example>

<example>
<input>${arguments} = carefully debug the memory leak</input>
<what>memory management issue</what>
<how>systematic investigation with profiling and root cause analysis</how>
<agents>debugging-specialist → research-analyst → implementation-specialist → validation-review-specialist</agents>
<output>identified leak source, implemented fix, and verified memory usage is stable</output>
</example>

<example>
<input>${arguments} = fix syntax error in config file</input>
<what>simple configuration syntax issue</what>
<how>direct correction of malformed syntax</how>
<agents>none - handled directly for efficiency</agents>
<output>corrected config file with valid syntax</output>
</example>

<example>
<input>${arguments} = patch SQL injection vulnerability</input>
<what>security vulnerability in database queries</what>
<how>implement input validation and parameterized queries</how>
<agents>context-analyzer → implementation-specialist → validation-review-specialist</agents>
<output>secured database queries with proper parameterization and validation</output>
</example>

---

**User Request**: ${arguments}
