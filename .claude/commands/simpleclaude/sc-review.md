# sc-review: Comprehensive Code Review and Quality Analysis

**Purpose**: Comprehensive code review and quality analysis with intelligent feedback, including GitHub PR review automation

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Option 1: Multi-faceted code review requiring specialized analysis
- Option 2: Security audits needing vulnerability assessment
- Option 3: Architecture reviews requiring system-wide perspective
- Option 4: Performance reviews needing profiling and optimization

**Smart Selection Process:**

1. Assess: Can I review this code directly without agents?
2. If agents needed: Which specific review capabilities does this require?
3. Deploy minimal viable agent set for the identified review needs

**Available Specialized Agents**

- `context-analyzer` - analyze codebase structure and review scope requirements
- `debugging-specialist` - identify potential bugs and edge cases in code
- `documentation-specialist` - assess documentation quality and completeness
- `implementation-specialist` - evaluate implementation patterns and practices
- `research-analyst` - investigate security vulnerabilities and best practices
- `system-architect` - assess architectural decisions and design patterns
- `validation-review-specialist` - conduct thorough code quality assessment

**Processing Pipeline**: **Request Analysis** → **Scope Identification** → **Approach Selection** → **Agent Spawning** → **Parallel Execution** → **Result Synthesis**

## Semantic Transformation into Structured Intent

Comprehensive review router that transforms natural language into structured expert analysis for security, performance, architecture, and code quality assessment. Includes GitHub Pull Request integration for automated PR reviews.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions and stop.  
**If "${arguments}" has content**: Think step-by-step, then execute.

Transforms: "${arguments}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Agents: [specialized Task() agents]

### Intelligent Review Detection

**Auto-detects review type from arguments:**

- **PR detected** (e.g., "PR 123", "#456"): Use GitHub CLI workflow
- **General review** (e.g., "auth module", "performance"): Use semantic transformation

**PR Review Process (when PR detected):**

1. Use `gh pr list` if PR # is not provided
2. Use `gh pr view <number>` for PR details
3. Use `gh pr diff <number>` for code changes
4. Analyze changes for code quality, style, and potential issues
5. Provide structured review with improvement suggestions
6. Focus on correctness, conventions, performance, testing, and security

### Transformation Examples

<example>
<input>${arguments} = review PR 123</input>
<what>GitHub Pull Request #123 analysis</what>
<how>git CLI diff analysis with structured feedback on changes</how>
<agents>none - handled directly using gh CLI for efficiency</agents>
<output>comprehensive PR review with inline comments and suggestions</output>
</example>

<example>
<input>${arguments} = strictly review the authentication module</input>
<what>authentication module security and quality audit</what>
<how>zero-tolerance comprehensive analysis with security focus</how>
<agents>context-analyzer → research-analyst → validation-review-specialist → system-architect</agents>
<output>detailed security audit report with vulnerabilities and recommendations</output>
</example>

<example>
<input>${arguments} = check code style consistency</input>
<what>basic code formatting and style violations</what>
<how>direct style guide compliance check</how>
<agents>none - handled directly for efficiency</agents>
<output>style violations report with specific line references</output>
</example>

<example>
<input>${arguments} = review performance bottlenecks</input>
<what>system performance analysis and optimization opportunities</what>
<how>profiling, complexity analysis, and optimization recommendations</how>
<agents>context-analyzer → debugging-specialist → validation-review-specialist</agents>
<output>performance analysis report with bottlenecks and optimization strategies</output>
</example>

---

**User Request**: ${arguments}
