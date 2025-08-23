# sc-workflow: Structured Development Workflow

**Purpose**: I need structured, resumable task execution - methodical enterprise-grade development with INIT → SELECT → REFINE → IMPLEMENT → COMMIT lifecycle and persistent artifacts

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

This command interprets natural language requests that express the intent: "I need structured, resumable task execution" - enterprise-grade methodical development with persistent state, tracking, and clean git discipline.

**Command Execution:**

**If "${arguments}" is empty**: Display workflow setup guidance and usage examples, then stop.  
**If "${arguments}" has content**: Initialize or resume structured workflow execution.

**Intent Analysis Process:**

1. **Parse Request**: Determine if this is workflow initialization, task continuation, or direct task execution
2. **Assess Setup**: Ensure todos/ structure exists or guide user through setup
3. **Route Execution**: Apply appropriate workflow phase based on current state

Transforms: "${arguments}" into structured execution:

- Intent: [workflow-goal-and-phase]
- Approach: [structured-5-phase-workflow]
- Agents: [context-analyzer, test-runner, documentation-specialists]

## Workflow Setup Requirements

**BEFORE FIRST USE**: This structured workflow requires a todos/ directory structure. If missing, the workflow will guide you through automatic setup.

**Required Structure:**
```
todos/
├── project-description.md    # Project context and commands
├── todos.md                  # Active task list
├── work/                     # Active tasks (auto-managed)
└── done/                     # Completed tasks (auto-managed)
```

**First-Time Setup Process:**
1. Run `sc-workflow` with any request
2. If todos/ structure missing, workflow will:
   - Analyze your codebase with context-analyzer agents
   - Generate project-description.md with detected structure
   - Create empty todos.md for your first tasks
   - Set up work/ and done/ directories
   - Guide you through confirmation and setup completion

**Adding Tasks**: Edit `todos/todos.md` manually to add tasks, then run `sc-workflow` to process them.

### Intent Recognition Examples

<example>
<input>${arguments} = "start working on authentication system"</input>
<intent>Structured workflow initialization - begin methodical development process</intent>
<approach>Full 5-phase workflow with setup verification and task creation</approach>
<agents>context-analyzer (project analysis if setup needed), specialized agents as required for implementation</agents>
<output>Structured task tracking with INIT → SELECT → REFINE → IMPLEMENT → COMMIT phases</output>
</example>

<example>
<input>${arguments} = "resume previous work"</input>
<intent>Workflow continuation - resume orphaned or interrupted tasks</intent>
<approach>Detect orphaned tasks and resume from appropriate workflow phase</approach>
<agents>context-analyzer (if codebase analysis needed for resumed task)</agents>
<output>Resumed task execution from previous checkpoint with state preservation</output>
</example>

<example>
<input>${arguments} = "setup structured workflow for this project"</input>
<intent>Workflow initialization - establish todos/ structure and project context</intent>
<approach>Complete project analysis and todos/ structure creation</approach>
<agents>context-analyzer (comprehensive project analysis for setup)</agents>
<output>Initialized todos/ structure with project-description.md and ready-to-use workflow</output>
</example>

## Structured Workflow Phases

**CRITICAL RULES:**
- MUST follow phases in order: **INIT → SELECT → REFINE → IMPLEMENT → COMMIT**
- MUST stop for user confirmation at each **STOP** point
- MUST iterate on refinement until user confirms
- MUST stage files added/deleted/modified in IMPLEMENT phase
- MUST create single commit including both code and task management changes

### Phase 1: INIT
1. **Setup Check**: Verify or create todos/ structure (project-description.md, todos.md, work/, done/)
2. **Orphaned Task Recovery**: Check for interrupted tasks and offer to resume
3. **Branch Management**: Ensure appropriate git branch for development work

### Phase 2: SELECT  
1. **Task Selection**: Present numbered list from todos.md for user selection
2. **Task Folder Creation**: Create timestamped work folder with proper structure
3. **Task Initialization**: Initialize task.md with template and remove from todos.md

### Phase 3: REFINE
1. **Research**: Deploy context-analyzer agents for codebase analysis
2. **Documentation**: Generate analysis.md with detailed findings
3. **Planning**: Create comprehensive implementation plan with user confirmation

### Phase 4: IMPLEMENT
1. **Execution**: Implement plan checkbox by checkbox with approval stops
2. **Validation**: Run project tests/lint/build with failure handling
3. **User Testing**: Verify functionality with user-defined acceptance criteria
4. **Documentation Updates**: Update project-description.md if needed

### Phase 5: COMMIT
1. **Summary**: Present completed work summary
2. **Task Completion**: Move task files to done/ directory
3. **Single Commit**: Create one commit with both code and task management changes
4. **Continuation**: Offer to continue with next todo

---

**User Request**: ${arguments}
