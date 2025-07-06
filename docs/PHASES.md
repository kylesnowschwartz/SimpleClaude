# SimpleClaude Development Phases

## Current Phase: 2 (Pending)

**Status**: Ready to begin Phase 2

---

## Phase 1: Setup Simple-Claude Structure ✅

**Status**: COMPLETED

### Objectives

- Create directory structure
- Consolidate SuperClaude YAML templates
- Create SIMPLE.md configuration
- Establish foundation patterns

### Deliverables

- SimpleClaude directory structure
- 4 consolidated YAML files (from 24+ SuperClaude files)
- SIMPLE.md configuration file
- Foundation documentation

---

## Phase 2: Consolidate Commands 🔄

**Status**: PENDING

### Objectives

- Create 5 consolidated commands that implement functionality from 20
  SuperClaude concepts
- Keep commands concise (under 100 lines each)
- Simple keyword detection to determine which internal workflow to execute
- Implement consolidated logic inspired by SuperClaude patterns

### Implementation Approach

- **SimpleClaude is STANDALONE** - implements its own consolidated functionality
- Each command uses @include for SimpleClaude's own patterns
- Use $ARGUMENTS pattern inspired by SuperClaude
- Consolidate complexity from multiple concepts into single commands
- Reference SuperClaude's structure for inspiration only

### Command Consolidation

1. **`/sc-create`** - Consolidates concepts from: spawn, task, build, design,
   document, dev-setup
2. **`/sc-modify`** - Consolidates concepts from: improve, migrate, cleanup,
   deploy, refactor
3. **`/sc-understand`** - Consolidates concepts from: load, analyze, explain,
   estimate, index
4. **`/sc-fix`** - Consolidates concepts from: troubleshoot, git fixes, error
   resolution
5. **`/sc-review`** - Consolidates concepts from: review, scan, test

---

## Phase 3: Simplify Personas ⏳

**Status**: PENDING (Partially complete - modes.yml created)

### Objectives

- Implement mode selection logic
- Create mode switching mechanism
- Add auto-mode detection based on context
- Test mode transitions

### Modes

- **Planner**: Research-focused, asks questions, thorough
- **Implementer**: Action-oriented, quick decisions
- **Tester**: Quality-focused, security-aware

---

## Phase 4: Create Natural Language Interface ⏳

**Status**: PENDING

### Objectives

- Replace complex flags with simple keyword detection
- Pass natural language directly to SuperClaude
- Create suggestion system for unclear requests
- Use $ARGUMENTS pattern for pass-through

### Implementation Approach

- **No complex parsing needed** - SuperClaude already handles NLP
- Simple keyword matching to choose route
- Pass full user input as $ARGUMENTS
- Let SuperClaude's sophisticated parsing handle intent

### Examples

- `/sc-create "secure REST API with tests"` → Routes to spawn/build with full
  text
- `/sc-modify "improve performance"` → Routes to improve with full text
- `/sc-understand "how does auth work"` → Routes to explain with full text

---

## Phase 5: Implement Context Detection ⏳

**Status**: PENDING

### Objectives

- Auto-detect project type (React, Python, etc.)
- Identify testing frameworks
- Detect code style from existing files
- Implement smart defaults based on context

### Detection Areas

- Framework detection (package.json, requirements.txt)
- Build tool identification
- Git workflow analysis
- Code convention learning

---

## Phase 6: Create SIMPLE.md Configuration ✅

**Status**: PARTIALLY COMPLETE (Basic version created)

### Remaining

- Add auto-generation of project.yml
- Implement preference learning
- Create configuration wizard
- Add migration tool from SuperClaude

---

## Phase 7: Testing & Documentation ⏳

**Status**: PENDING

### Objectives

- Comprehensive testing of all commands
- Create user guide with examples
- Build interactive tutorials
- Implement feedback collection
- Performance benchmarking vs SuperClaude

### Deliverables

- Test suite
- User documentation
- Migration guide
- Performance report
- Example projects

---

## Implementation Strategy

1. **Standalone Implementation**: SimpleClaude implements its own consolidated
   logic
2. **Reference SuperClaude**: Use as inspiration for patterns and best practices
   only
3. **Simple Keyword Detection**: Basic pattern matching to choose internal
   workflow
4. **$ARGUMENTS Pattern**: Inspired by SuperClaude but used internally
5. **Under 100 Lines**: Each command should be concise and focused
6. **Consolidation Focus**: Combine related concepts into unified commands

**REMEMBER**: SimpleClaude is completely standalone - it does NOT call or depend
on SuperClaude

## Success Metrics

- [ ] 80% reduction in command learning curve
- [ ] 90% of SuperClaude functionality preserved
- [ ] 50% reduction in average command length
- [ ] Zero configuration required for basic usage
- [ ] Natural language commands understood 95% of time
