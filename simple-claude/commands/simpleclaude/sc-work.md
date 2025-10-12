# sc-work: Universal Implementation Command

**Purpose**: I need to build/fix/modify something - handles all implementation tasks from creating new features to fixing bugs to refactoring code

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
- **Deep codebase analysis** → Use `code-explorer`
- **Architecture design** → Use `code-architect`
- **Code quality review** → Use `code-reviewer`

**Available Agents:**

- `code-explorer` - Deeply analyzes existing codebase features by tracing execution paths and mapping architecture
- `code-architect` - Designs feature architectures by analyzing existing patterns and providing implementation blueprints
- `code-reviewer` - Reviews code for bugs, security vulnerabilities, and adherence to project conventions
- `repository-documentation-expert` - Finds documentation from Context7, local repos, and GitHub repositories
- `test-runner` - Executes tests and analyzes failures
- `web-search-researcher` - Searches web for current information

**Context Preservation:**

- **Keep only**: user request, actionable recommendations, code changes, summary, next steps
- **Discard**: intermediate outputs, full docs, verbose logs, exploratory reads

**Processing Pipeline**: Parse → Classify → Validate → Route → Execute → Synthesize

## Intent Recognition and Semantic Transformation

This command interprets natural language requests that express the intent: "I need to build/fix/modify something" - implementation work including creating, modifying, fixing, refactoring, optimizing, or enhancing code.

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

- Intent: [implementation-goal-and-scope]
- Approach: [direct-implementation OR research-then-implement]
- Agents: [none OR minimal-viable-set]

### Intent Recognition Examples

<example>
<input>${arguments} = "Add a dark mode toggle to the user settings page"</input>
<intent>Feature implementation - dark mode functionality</intent>
<approach>Direct implementation with context analysis for existing patterns</approach>
<agents>code-explorer (current theming/settings patterns), test-runner (validation after implementation)</agents>
<output>Dark mode toggle component with state management, CSS updates, and integration into settings page</output>
</example>

<example>
<input>${arguments} = "Fix the memory leak in the data processing pipeline"</input>
<intent>Bug fixing - performance and memory optimization</intent>
<approach>Analysis-first approach to identify root cause, then targeted fixes</approach>
<agents>code-explorer (pipeline architecture), web-search-researcher (memory leak debugging techniques), test-runner (validation of fixes)</agents>
<output>Root cause analysis, targeted code fixes, memory usage improvements, and validation tests</output>
</example>

<example>
<input>${arguments} = "Refactor the API client to use TypeScript generics"</input>
<intent>Code improvement - type safety enhancement</intent>
<approach>Documentation research + gradual refactoring with type safety validation</approach>
<agents>repository-documentation-expert (TypeScript generics best practices), code-explorer (current API client structure), test-runner (type checking and functionality validation)</agents>
<output>Refactored API client with proper generic types, improved type safety, and maintained backward compatibility</output>
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
