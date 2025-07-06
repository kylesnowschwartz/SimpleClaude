# SimpleClaude Mode Detection & Enhanced Workflow Patterns PRD

## Executive Summary

SimpleClaude aims to eliminate explicit flags by intelligently detecting user
intent through natural language. This PRD outlines the patterns and
implementations needed to achieve truly intuitive command execution where users
simply describe what they want, and SimpleClaude automatically selects the
appropriate mode and workflow.

## Problem Statement

Current state:

- Template includes explicit flags (--watch, --interactive, --plan, etc.)
- Users must learn and remember flag syntax
- Goes against SimpleClaude's philosophy of simplification

Desired state:

- Natural language drives all behavior
- Smart detection eliminates need for flags
- Commands adapt automatically to user intent

## Solution Design

### 1. Mode Detection Patterns

#### Watch Mode Detection

**Triggers**: Keywords indicating continuous or real-time operation

```yaml
Watch_Detection:
  keywords:
    - "watch|watching|monitor|monitoring"
    - "when I save|on save|after changes"
    - "continuously|continuous|real-time|live"
    - "as I type|as I code|as I work"
    - "keep running|stay running|auto-refresh"

  behavior:
    - Monitor file system for changes
    - Re-execute command on modifications
    - Show incremental updates
    - Maintain session state
```

#### Interactive Mode Detection

**Triggers**: Keywords indicating guided or educational intent

```yaml
Interactive_Detection:
  keywords:
    - "walk me through|step by step|guide me"
    - "help me understand|explain as you go"
    - "teach me|show me how|tutorial"
    - "break it down|one step at a time"
    - "interactive|interactively"

  behavior:
    - Break tasks into clear steps
    - Explain each action before taking it
    - Ask for confirmation at key points
    - Provide learning context
```

#### Planning Mode Detection

**Triggers**: Keywords indicating need for upfront design

```yaml
Planning_Detection:
  keywords:
    - "plan|planning|design first|think through"
    - "show me what you'll do|preview|outline"
    - "before you start|don't execute yet"
    - "strategy|approach|how would you"
    - "proposal|suggest|recommend"

  behavior:
    - Generate comprehensive plan
    - Show task breakdown
    - Identify risks and dependencies
    - Wait for approval before executing
```

#### Test-Driven Mode Detection

**Triggers**: Keywords indicating TDD approach

```yaml
TDD_Detection:
  keywords:
    - "test first|tests first|TDD"
    - "test-driven|test driven"
    - "write tests then|start with tests"
    - "red-green-refactor"

  behavior:
    - Write tests before implementation
    - Show failing tests
    - Implement to make tests pass
    - Refactor with confidence
```

### 2. Natural Language Mapping

Replace explicit flags with natural phrases:

| Instead of      | Use Natural Language              |
| --------------- | --------------------------------- |
| `--watch`       | "keep monitoring for changes"     |
| `--interactive` | "walk me through this"            |
| `--plan`        | "show me your plan first"         |
| `--test`        | "include comprehensive tests"     |
| `--tdd`         | "use test-driven development"     |
| `--minimal`     | "keep it simple"                  |
| `--magic`       | "create the UI for me"            |
| `--c7`          | "look up the React documentation" |

### 3. Compound Intent Detection

Detect multiple modes from single request:

```yaml
Compound_Detection:
  example: "walk me through creating tests first while I make changes"
  detected_modes: [interactive, tdd, watch]

  example: "plan out a simple API that updates live"
  detected_modes: [planning, minimal, watch]
```

### 4. Context-Aware Adaptation

Modes should adapt based on:

- Project type (web app → likely needs watch mode)
- File types (test files → likely needs test mode)
- Error context (debugging → likely needs interactive)
- Task complexity (large refactor → likely needs planning)

### 5. Workflow Enhancement Patterns

#### Adaptive Workflow Selection

```yaml
Workflow_Adaptation:
  base_workflow: "standard_creation"

  adaptations:
    with_watch: "Add file monitoring step"
    with_interactive: "Insert explanation steps"
    with_planning: "Prepend planning phase"
    with_tdd: "Reorder to tests-first"
```

#### Dynamic Step Injection

```yaml
Dynamic_Steps:
  interactive_additions:
    before_each_step: "Explain what will happen"
    after_each_step: "Confirm success and understanding"
    on_error: "Explain error and options"

  watch_additions:
    setup: "Initialize file watchers"
    loop: "Wait for changes → Re-execute"
    cleanup: "Stop watchers on exit"
```

## Implementation Requirements

### 1. YAML File Updates

**core-patterns.yml additions**:

- Mode_Detection section with all patterns
- Natural_Language_Mapping section
- Compound_Detection rules
- Context_Adaptation patterns

**workflows.yml enhancements**:

- Adaptive workflow variants for each mode
- Dynamic step injection points
- Mode-specific behavior modifications

### 2. Command Implementation Updates

Each command needs:

- Natural language parser at the start
- Mode detection logic
- Workflow adaptation based on detected modes
- No explicit flag documentation

### 3. Template Revision

Remove:

- All flag documentation
- Flag examples
- Explicit mode switches

Add:

- Natural language examples
- Mode auto-detection explanation
- Compound intent examples

## Success Criteria

1. **Zero Flag Usage**: Users never need to use explicit flags
2. **Intuitive Interaction**: New users understand within minutes
3. **Smart Adaptation**: Commands behave appropriately without configuration
4. **Natural Expression**: Users describe intent naturally
5. **Preserved Power**: All SuperClaude capabilities remain accessible

## Examples of Natural Language in Action

### Creating with Various Modes

```bash
# Basic creation
/sc-create user authentication API

# With watch mode (auto-detected)
/sc-create user authentication API and update it as I make changes

# With interactive mode (auto-detected)
/sc-create walk me through building a user authentication API

# With planning (auto-detected)
/sc-create plan out a complete user authentication API before building

# Compound modes (auto-detected)
/sc-create guide me through planning a user API that updates live
→ Detects: interactive + planning + watch
```

### Modifying with Intelligence

```bash
# Basic modification
/sc-modify improve performance

# With continuous mode
/sc-modify keep improving performance as I test

# With explanation
/sc-modify explain how you're improving performance
```

## Migration Strategy

1. **Phase 1**: Add detection patterns to YAML files
2. **Phase 2**: Update template to show natural language
3. **Phase 3**: Implement detection in commands
4. **Phase 4**: Test with real-world examples
5. **Phase 5**: Remove all flag references

## Risks and Mitigations

**Risk**: Ambiguous natural language **Mitigation**: Smart defaults + clarifying
questions when uncertain

**Risk**: Users wanting explicit control **Mitigation**: Allow natural language
overrides ("don't watch files")

**Risk**: Complex compound intents **Mitigation**: Prioritize primary intent,
make others optional

## Conclusion

By implementing comprehensive mode detection and enhanced workflow patterns,
SimpleClaude will achieve its vision of being a truly intuitive AI assistant
that understands what users want without requiring them to learn complex command
syntax. Natural language becomes the interface, and intelligent detection
becomes the engine that powers appropriate behavior.
