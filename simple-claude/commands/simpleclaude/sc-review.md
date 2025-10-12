# sc-review: Quality Verification and Assessment

**Purpose**: I need to verify quality/security/performance - comprehensive analysis covering code quality, security scanning, performance profiling, and architecture assessment

## Agent Orchestration and Deployment Strategy

**Efficiency First:** Handle tasks directly when possible. Use agents only when genuinely needed for:

- Multi-step coordination requiring handoffs
- Specialized domain expertise beyond general capability
- Parallel work streams with interdependencies
- Complex analysis requiring multiple perspectives
- Operations that produce verbose intermediate output

**Direct Agent Rules (ALWAYS delegate these):**

- **Documentation lookups** → Use `repository-documentation-expert`
- **Test execution** → Use `test-runner`
- **Web searches** → Use `web-search-researcher`
- **Multi-file analysis (10+ files)** → Use `context-analyzer`

**Available Agents:**

- `context-analyzer` - Maps project structure, patterns, and architecture
- `repository-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `test-runner` - Executes tests and analyzes failures
- `web-search-researcher` - Searches web for current information

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Classify → Validate → Route → Execute → Synthesize

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: "I need to verify quality/security/performance" - comprehensive assessment including code quality review, security scanning, performance profiling, and architecture analysis.

**Command Execution:**

**Empty "${arguments}"**: Display usage suggestions → stop
**Has content**: Parse intent → apply strategy → route execution

**Intent Processing:** Extract intent → Apply strategy matrix → Validate → Execute

**Strategy Matrix:**

| Condition | Direct Handling     | Agent Required                 |
| --------- | ------------------- | ------------------------------ |
| Task Type | Simple, single-step | See "Direct Agent Rules" above |
| Domain    | Single, familiar    | Multi-tech, unknown            |
| Context   | Available locally   | External research needed       |
| Output    | Concise, focused    | Verbose, needs filtering       |

Transforms: "${arguments}" into structured execution:

- Intent: [verification-goal-and-scope]
- Approach: [direct-review OR comprehensive-analysis]
- Agents: [none OR minimal-viable-set]

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

### Output Template

```
## Response

[Direct answer or action taken - 1-3 sentences addressing the core request]

## Details

[Main content based on command type:
- Plan: Strategy breakdown with phases
- Work: Code changes and implementation steps
- Explore: Research findings and analysis
- Review: Issues found and quality assessment]

## Next Actions

[What to do next:
- Plan: Implementation steps to begin
- Work: Testing and validation needed
- Explore: Areas for deeper investigation
- Review: Fixes and improvements to make]

## Notes

[Optional - context, warnings, alternatives, or additional considerations]
```

---

**User Request**: ${arguments}
