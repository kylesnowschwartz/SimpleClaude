# SimpleClaude Command Architecture Analysis

## Current Command Structures and Overlaps

### 5 Current Commands Analysis

Based on my examination of the `.claude/commands/simpleclaude/` directory, the current commands are:

1. **sc-create**: Creates components to complete systems with intelligent routing
2. **sc-modify**: Intelligently modifies, improves, refactors, and optimizes code
3. **sc-fix**: Fixes bugs and issues with intelligent debugging
4. **sc-understand**: Understands codebases through intelligent analysis and documentation
5. **sc-review**: Comprehensive code review and quality analysis

### Identified Overlaps

The analysis reveals clear overlap issues:

- **sc-modify and sc-fix**: Both modify code - fix is essentially modification with debugging focus
- **sc-create and sc-modify**: Creating new features often requires modifying existing code
- **Intent confusion**: Commands are task-based rather than intent-based, leading to user uncertainty about which command to use

## Agent Architecture and Spawning Patterns

### Current 5 Specialized Agents

Located in `.claude/agents/`, each with specific capabilities:

1. **context-analyzer** (`/Users/kyle/Code/SimpleClaude/.claude/agents/context-analyzer.md`)
   - Maps project structure, technology stack, and patterns
   - Provides architectural context for development decisions
   - Uses Write, Bash, Read tools

2. **test-runner** (`/Users/kyle/Code/SimpleClaude/.claude/agents/test-runner.md`)
   - Executes specified tests and analyzes failures
   - Returns detailed failure analysis without making fixes
   - Uses Bash, Read, Grep, Glob tools

3. **web-search-researcher** (`/Users/kyle/Code/SimpleClaude/.claude/agents/web-search-researcher.md`)
   - Conducts thorough web research and fact-checking
   - Uses WebSearch, WebFetch, sequential thinking
   - Complex agent with comprehensive capabilities

4. **context7-documentation-specialist** (`/Users/kyle/Code/SimpleClaude/.claude/agents/context7-documentation-specialist.md`)
   - Retrieves current documentation through Context7 system
   - Fetches official documentation for libraries/frameworks
   - Uses Context7 MCP tools for documentation retrieval

5. **repo-documentation-finder** (`/Users/kyle/Code/SimpleClaude/.claude/agents/repo-documentation-finder.md`)
   - Finds documentation from official GitHub repositories
   - 5-phase workflow: LOCATE → ACQUIRE → SEARCH → ANALYZE → SYNTHESIZE
   - Uses Bash, GitHub CLI, repository management

### Agent Spawning Patterns

All commands follow consistent patterns:

- **Smart Selection Process**: 4-step decision tree to determine if agents are needed
- **Agent Orchestration Pipeline**: Request Analysis → Scope Identification → Approach Selection → Agent Spawning → Parallel Execution → Result Synthesis
- **Task() Calls**: Agents are spawned via `Task()` for token efficiency
- **Minimal Viable Agent Sets**: Deploy only agents needed for specific capabilities

## Template System

### TEMPLATE.md Structure (`/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/TEMPLATE.md`)

The template provides standardized structure:

1. **Command header**: Purpose statement
2. **Agent Orchestration Strategy**: Efficiency-first approach with 4 options for when to use agents
3. **Smart Selection Process**: 3-step assessment framework
4. **Available Specialized Agents**: List of 5 agents with descriptions
5. **Processing Pipeline**: 6-phase workflow
6. **Semantic Transformation**: Natural language to structured intent
7. **Transformation Examples**: Input/output patterns with agent routing

### Shared Patterns Across Commands

- **Efficiency First**: Handle directly when possible, use agents only when needed
- **4-Option Decision Tree**: Multi-step coordination, specialized expertise, parallel work, complex analysis
- **Consistent Agent Descriptions**: Same 5 agents referenced across all commands
- **Example Structure**: Input → What → How → Agents → Output format

## Installation and Deployment System

### Installation Architecture (`/Users/kyle/Code/SimpleClaude/install.sh`)

- **Backup System**: Creates timestamped backups before installation
- **Dry-run Default**: Safe preview before actual changes
- **Hash-based Change Detection**: Only updates files that have actually changed
- **Directory Structure**: 
  - `commands/simpleclaude/` - core commands
  - `agents/` - specialized agents
  - `commands/extras/` - optional experimental commands
- **Extras Support**: Optional installation of experimental commands via `--extras` flag

### Key Installation Features

- **Source Directory**: `.claude/` is the source for SimpleClaude
- **Target Directory**: `~/.claude/` by default, customizable
- **File Pattern**: `*.md` files for both commands and agents
- **Change Tracking**: Added, updated, unchanged counters
- **Rollback Support**: Backup directory with restoration instructions

## Specific Files for 4+1 Redesign

### Files Requiring Modification

#### Core Command Files (Replace existing 5 with new 4+1):
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-plan.md` (NEW)
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-work.md` (NEW) 
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-explore.md` (NEW)
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-review.md` (MODIFY existing)
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-workflow.md` (NEW)

#### Files to Remove:
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-create.md`
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-modify.md`
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-fix.md`
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/sc-understand.md`

#### Agent Files (Keep existing 5 agents):
- All 5 agents in `/Users/kyle/Code/SimpleClaude/.claude/agents/` remain unchanged
- Agent descriptions in new commands will reference same agents

#### Configuration Files:
- `/Users/kyle/Code/SimpleClaude/VERSION` - Update to 1.0.0 (breaking changes)
- `/Users/kyle/Code/SimpleClaude/README.md` - Update command examples and architecture description
- `/Users/kyle/Code/SimpleClaude/CLAUDE.md` - Update critical rules about 5 core commands
- `/Users/kyle/Code/SimpleClaude/.claude/commands/simpleclaude/TEMPLATE.md` - Update for new intent-based approach

#### Installation System:
- `/Users/kyle/Code/SimpleClaude/install.sh` - No changes needed (already supports dynamic file discovery)

## Key Architecture Considerations

### Token Efficiency Maintained
- Same lightweight agent architecture with isolated contexts
- `Task()` spawning pattern preserved
- Minimal viable agent sets remain the principle

### Intent-Based Command Philosophy
- Commands understand user intent rather than predetermined tasks
- Natural language processing to route to appropriate agents
- Smart detection of when direct handling vs. agent delegation is needed

### Backward Compatibility Strategy
- Installation system automatically handles file updates
- Backup system preserves existing commands for rollback
- Version bump to 1.0.0 signals breaking changes appropriately

The transformation represents a significant evolution from task-based to intent-based commands while maintaining the proven lightweight agent architecture and token-efficient execution model established in v0.5.0.

---

## Detailed Findings: SimpleClaude 2.0 Redesign Research

Based on my research of the conversation, existing patterns, and current project state, here are the comprehensive findings:

### 1. Exact Command Specifications for the New 4+1 Structure

#### The Simple Four (Ad-hoc, lightweight)

**1. `sc-plan`** - "I need to think through something"
- **Intent**: Analysis and roadmap creation
- **Functions**: 
  - Analyzes codebase/requirements
  - Creates actionable roadmaps
  - Manages todo lifecycle (ephemeral by default)
  - Auto-primes context for next steps
- **Agent spawning**: Uses `context-analyzer` and `web-search-researcher` for research

**2. `sc-work`** - "I need to build/fix/modify something"
- **Intent**: Universal implementation command
- **Functions**:
  - Takes plan or direct request
  - Spawns appropriate agents (create, modify, fix, test)
  - Manages implementation tracking
  - Auto-runs validation (lint, test, build)
- **Consolidates**: The current `sc-create`, `sc-modify`, and `sc-fix` commands

**3. `sc-explore`** - "I need to understand something"
- **Intent**: Research and analysis
- **Functions**:
  - Research and analysis
  - Domain understanding
  - Codebase navigation
  - Synthesizes findings
- **Replaces**: Current `sc-understand` functionality

**4. `sc-review`** - "I need to verify quality/security/performance"
- **Intent**: Quality assurance and assessment
- **Functions**:
  - Comprehensive analysis
  - Security scanning
  - Performance profiling
  - Architecture assessment
- **Similar to**: Current `sc-review` but expanded scope

#### The Structured One (Methodical, stateful)

**5. `sc-workflow`** - "I need structured, resumable task execution"
- **Intent**: Enterprise-grade structured development
- **Lifecycle**: INIT → SELECT → REFINE → IMPLEMENT → COMMIT
- **Features**:
  - Persistent artifacts: `todos/`, `work/`, `done/` directories
  - Resumable tasks with PID tracking
  - Maintains `project-description.md`
  - Structured checkpoints with user confirmation
  - Single-commit discipline for clean git history
- **Already exists**: As `sc-structured-workflow.md` in extras

### 2. Design Philosophy and User Experience Goals

#### Core Philosophy Shift
- **From**: Task-based commands (create, modify, fix, understand, review)
- **To**: Intent-based commands that understand user intent and orchestrate appropriate agents intelligently

#### Balance Strategy
- **Simple commands**: "Just do it" mentality for quick tasks
- **Workflow command**: "Do it right with tracking" for enterprise/complex work

#### Key Design Principles
1. **Simplicity Redefined**: Fewer commands to remember, leveraging LLM's ability to understand intent
2. **Agent Delegation**: Commands auto-detect when to use specialized agents
3. **Token Efficiency**: Isolated agent contexts for focused task delegation
4. **Context Flow**: Natural context flow between commands
5. **Artifact Management**: Session-scoped by default with option to persist

### 3. Existing Workflow Patterns to Build Upon

#### From `sc-structured-workflow.md`
- **5-phase workflow**: INIT → SELECT → REFINE → IMPLEMENT → COMMIT
- **State management**: Uses PID tracking for resumable tasks
- **File structure**: 
  - `todos/project-description.md` - Project context
  - `todos/todos.md` - Task list
  - `todos/work/[timestamp]-[slug]/` - Active tasks
  - `todos/done/` - Completed tasks
- **Validation integration**: Automatic lint/test/build validation
- **Git discipline**: Single commit per completed task

#### From Current Command Template
- **Agent Orchestration Strategy**: 4-option decision tree for agent deployment
- **Processing Pipeline**: Request Analysis → Scope Identification → Approach Selection → Agent Spawning → Parallel Execution → Result Synthesis
- **Smart Selection**: Handle directly when possible, use minimal viable agent set when needed

### 4. Specific Requirements for Each New Command

#### Command Structure Requirements
Each command must follow the established template pattern:
1. **Agent Orchestration and Deployment Strategy** section
2. **Semantic Transformation** section with examples
3. **4-option decision tree** for agent deployment
4. **Processing pipeline** definition
5. **Transformation examples** showing input/output patterns

#### Agent Integration Requirements
- Must use existing 5 agents: `context-analyzer`, `context7-documentation-specialist`, `repo-documentation-finder`, `test-runner`, `web-search-researcher`
- Agent spawning via `Task()` calls for token efficiency
- Isolated agent contexts to prevent token bloat
- Parallel execution capability for interdependent tasks

#### Technical Requirements
- **Backward Compatibility**: Consider migration path from current 5-command structure
- **Consistent Updates**: All command changes must be applied consistently across codebase
- **Token Efficiency**: Maintain lightweight agent architecture from v0.5.0
- **Validation Integration**: Auto-run lint/test/build where appropriate
- **Version Consideration**: This represents breaking changes, potentially warranting SimpleClaude 1.0.0

#### Implementation Priority Order (from todos.md)
1. Implement each of the 4+1 commands
2. Update agent architecture for parallel spawning
3. Create migration strategy
4. Update documentation 
5. Version release planning

The research shows that SimpleClaude 2.0 represents a significant philosophical evolution from task-based to intent-based commands while maintaining the core architectural principles of agent delegation, token efficiency, and user simplicity. The existing `sc-structured-workflow.md` already provides the foundation for the `sc-workflow` command, and the current template structure provides the pattern for implementing the other four commands.
