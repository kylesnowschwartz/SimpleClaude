# sc-work: Universal Implementation Command

**Purpose**: I need to build/fix/modify something - handles all implementation tasks from creating new features to fixing bugs to refactoring code

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

This command interprets natural language requests that express the intent: "I need to build/fix/modify something" - implementation work including creating, modifying, fixing, refactoring, optimizing, or enhancing code.

**Command Execution:**

**If "${arguments}" is empty**: Display usage suggestions with example intent expressions and stop.  
**If "${arguments}" has content**: Analyze user intent, then route to appropriate implementation approach.

**Intent Analysis Process:**

1. **Parse Request**: Extract the implementation goal and context from natural language
2. **Assess Complexity**: Determine if direct implementation or research/analysis is needed first
3. **Route Execution**: Apply appropriate implementation strategy based on scope and requirements

Transforms: "${arguments}" into structured execution:

- Intent: [implementation-goal-and-scope]
- Approach: [direct-implementation OR research-then-implement]
- Agents: [context-analyzer, test-runner, documentation-specialists]

### Intent Recognition Examples

<example>
<input>${arguments} = "Add a dark mode toggle to the user settings page"</input>
<intent>Feature implementation - dark mode functionality</intent>
<approach>Direct implementation with context analysis for existing patterns</approach>
<agents>context-analyzer (current theming/settings patterns), test-runner (validation after implementation)</agents>
<output>Dark mode toggle component with state management, CSS updates, and integration into settings page</output>
</example>

<example>
<input>${arguments} = "Fix the memory leak in the data processing pipeline"</input>
<intent>Bug fixing - performance and memory optimization</intent>
<approach>Analysis-first approach to identify root cause, then targeted fixes</approach>
<agents>context-analyzer (pipeline architecture), web-search-researcher (memory leak debugging techniques), test-runner (validation of fixes)</agents>
<output>Root cause analysis, targeted code fixes, memory usage improvements, and validation tests</output>
</example>

<example>
<input>${arguments} = "Refactor the API client to use TypeScript generics"</input>
<intent>Code improvement - type safety enhancement</intent>
<approach>Documentation research + gradual refactoring with type safety validation</approach>
<agents>context7-documentation-specialist (TypeScript generics best practices), context-analyzer (current API client structure), test-runner (type checking and functionality validation)</agents>
<output>Refactored API client with proper generic types, improved type safety, and maintained backward compatibility</output>
</example>

---

**User Request**: ${arguments}
