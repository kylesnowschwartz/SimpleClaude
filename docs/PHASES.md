# SimpleClaude Development Phases

## Current Phase: 2.6 (Next Steps)

**Status**: Phase 2.5 Natural Language Intelligence COMPLETED

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

## Phase 2: Consolidate Commands ✅

**Status**: COMPLETED (including Phase 2.5 Natural Language Intelligence)

### Objectives Achieved

- ✅ Created 5 consolidated commands (under 70 lines each!)
- ✅ Implemented natural language detection via 3-mode system
- ✅ Simplified YAML files by ~75% overall
- ✅ Created standardized template structure
- ✅ Removed complex flag systems
- ✅ Commands are truly standalone with shared pattern files

### Key Achievements

#### Phase 2.1-2.4: Command Creation

- Created all 5 SimpleClaude commands
- Established natural language parsing
- Implemented sub-agent delegation patterns
- Refined architecture understanding

#### Phase 2.5: Natural Language Intelligence (Major Milestone)

- **3-Mode System**: Planner, Implementer, Tester
- **Workflow Modifiers**: watch, interactive, tdd
- **Massive Simplification**:
  - mode-detection.yml: 465→126 lines (73% reduction)
  - core-patterns.yml: 989→214 lines (78% reduction)
  - workflows.yml: 392→319 lines (19% reduction)
  - All commands: ~60-70 lines each (from 150-200+)
- **Template Standardization**: All commands follow exact same structure

### Command Status

1. **`/sc-create`** ✅ - 66 lines, gold standard
2. **`/sc-modify`** ✅ - 60 lines, aligned with template
3. **`/sc-understand`** ✅ - 60 lines, aligned with template
4. **`/sc-fix`** ✅ - 60 lines, aligned with template
5. **`/sc-review`** ✅ - 60 lines, aligned with template

---

## Phase 2.6: Missing Shared Files 🔄

**Status**: IN PROGRESS

### Objectives

- Create missing shared YAML files referenced in SIMPLE.md
- Ensure all @include references resolve correctly
- Complete the shared pattern library

### Files to Create

1. **`git-patterns.yml`** - Git workflow detection and conventions
2. **`security-rules.yml`** - Security best practices and validation
3. **`mcp-integration.yml`** - MCP server patterns and usage

### Implementation Approach

- Keep files minimal and practical
- Focus on detection patterns, not prescriptive rules
- Align with SimpleClaude's adapt-don't-prescribe philosophy

---

## Phase 2.7: Testing & Refinement 🔄

**Status**: PENDING

### Objectives

- Test all 5 commands with real-world examples
- Verify natural language detection accuracy
- Ensure mode detection works correctly
- Validate @include references resolve
- Performance testing vs direct commands

### Test Scenarios

1. **Basic Usage**: Simple natural language requests
2. **Mode Detection**: Verify correct mode selection
3. **Modifier Application**: Test watch, interactive, tdd
4. **Complex Requests**: Multi-mode scenarios
5. **Edge Cases**: Ambiguous or unclear requests

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

- `/sc-create "secure REST API with tests"` → Routes to spawn/build with full text
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

1. **Standalone Implementation**: SimpleClaude implements its own consolidated logic
2. **Reference SuperClaude**: Use as inspiration for patterns and best practices only
3. **Simple Keyword Detection**: Basic pattern matching to choose internal workflow
4. **$ARGUMENTS Pattern**: Inspired by SuperClaude but used internally
5. **Under 100 Lines**: Each command should be concise and focused
6. **Consolidation Focus**: Combine related concepts into unified commands

**REMEMBER**: SimpleClaude is completely standalone - it does NOT call or depend on SuperClaude

## Success Metrics

- [ ] 80% reduction in command learning curve
- [ ] 90% of SuperClaude functionality preserved
- [ ] 50% reduction in average command length
- [ ] Zero configuration required for basic usage
- [ ] Natural language commands understood 95% of time
