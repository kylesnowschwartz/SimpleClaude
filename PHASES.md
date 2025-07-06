# SimpleClaude Development Phases

## Current Phase: 2 (Pending)

**Status**: Ready to begin Phase 2

---

## Phase 1: Setup Simple-Claude Structure ✅

**Status**: COMPLETED

### Objectives:

- Create directory structure
- Consolidate SuperClaude YAML templates
- Create SIMPLE.md configuration
- Establish foundation patterns

### Deliverables:

- SimpleClaude directory structure
- 4 consolidated YAML files (from 24+ SuperClaude files)
- SIMPLE.md configuration file
- Foundation documentation

---

## Phase 2: Consolidate Commands 🔄

**Status**: PENDING

### Objectives:

- Create 5 consolidated commands from 20 SuperClaude commands
- Implement thin routing layers (under 100 lines each)
- Simple keyword detection, not complex NLP
- Direct pass-through to SuperClaude commands

### Implementation Approach:

- **SimpleClaude commands are routers, not reimplementations**
- Each command should be mostly @include and routing logic
- Use exact $ARGUMENTS pattern from SuperClaude
- Let SuperClaude handle all complexity
- Preserve SuperClaude's structure and patterns

### Command Mapping:

1. **`/sc-create`** - Routes to: spawn, task, build, design, document, dev-setup
2. **`/sc-modify`** - Routes to: improve, migrate, cleanup, deploy, refactor
3. **`/sc-understand`** - Routes to: load, analyze, explain, estimate, index
4. **`/sc-fix`** - Routes to: troubleshoot, git fixes, error resolution
5. **`/sc-review`** - Routes to: review, scan, test

---

## Phase 3: Simplify Personas ⏳

**Status**: PENDING (Partially complete - modes.yml created)

### Objectives:

- Implement mode selection logic
- Create mode switching mechanism
- Add auto-mode detection based on context
- Test mode transitions

### Modes:

- **Planner**: Research-focused, asks questions, thorough
- **Implementer**: Action-oriented, quick decisions
- **Tester**: Quality-focused, security-aware

---

## Phase 4: Create Natural Language Interface ⏳

**Status**: PENDING

### Objectives:

- Replace complex flags with simple keyword detection
- Pass natural language directly to SuperClaude
- Create suggestion system for unclear requests
- Use $ARGUMENTS pattern for pass-through

### Implementation Approach:

- **No complex parsing needed** - SuperClaude already handles NLP
- Simple keyword matching to choose route
- Pass full user input as $ARGUMENTS
- Let SuperClaude's sophisticated parsing handle intent

### Examples:

- `/sc-create "secure REST API with tests"` → Routes to spawn/build with full
  text
- `/sc-modify "improve performance"` → Routes to improve with full text
- `/sc-understand "how does auth work"` → Routes to explain with full text

---

## Phase 5: Implement Context Detection ⏳

**Status**: PENDING

### Objectives:

- Auto-detect project type (React, Python, etc.)
- Identify testing frameworks
- Detect code style from existing files
- Implement smart defaults based on context

### Detection Areas:

- Framework detection (package.json, requirements.txt)
- Build tool identification
- Git workflow analysis
- Code convention learning

---

## Phase 6: Create SIMPLE.md Configuration ✅

**Status**: PARTIALLY COMPLETE (Basic version created)

### Remaining:

- Add auto-generation of project.yml
- Implement preference learning
- Create configuration wizard
- Add migration tool from SuperClaude

---

## Phase 7: Testing & Documentation ⏳

**Status**: PENDING

### Objectives:

- Comprehensive testing of all commands
- Create user guide with examples
- Build interactive tutorials
- Implement feedback collection
- Performance benchmarking vs SuperClaude

### Deliverables:

- Test suite
- User documentation
- Migration guide
- Performance report
- Example projects

---

## Implementation Strategy:

1. **Thin Routing Layer**: SimpleClaude is a router, not a rewrite
2. **Preserve SuperClaude**: All complexity stays in SuperClaude
3. **Simple Keyword Detection**: Basic pattern matching, not complex NLP
4. **Direct Pass-Through**: Use $ARGUMENTS pattern exactly
5. **Under 100 Lines**: Each command should be minimal
6. **Progressive Enhancement**: Start simple, stay simple

## Success Metrics:

- [ ] 80% reduction in command learning curve
- [ ] 90% of SuperClaude functionality preserved
- [ ] 50% reduction in average command length
- [ ] Zero configuration required for basic usage
- [ ] Natural language commands understood 95% of time
