# SimpleClaude Phase 2.5 Refined Implementation Plan

## Overview

This refined plan incorporates patterns discovered in SuperClaude while
maintaining SimpleClaude's philosophy of practical minimalism.

## Key Discoveries from SuperClaude

### Reusable Patterns

1. **Flag Inheritance System** - Comprehensive flag definitions we can adapt to
   natural language
2. **Context Detection Patterns** - Existing keyword lists and indicators
3. **Planning Mode Templates** - Structured planning approach
4. **Complexity Triggers** - Auto-activation rules based on task complexity
5. **File-Based Activation** - Mode selection based on file types

### Content to Adapt

#### A. Mode Detection Framework (from execution-patterns.yml)

```yaml
Mode_Detection:
  # Adapt SuperClaude's Context_Detection_Patterns
  natural_language_patterns:
    planning:
      keywords: ["plan", "strategy", "approach", "design", "architect", "think through"]
      phrases:
        - "show me your plan"
        - "design first"
        - "what's your approach"
      complexity_indicators: ["architecture", "system", "complex", "multi-file"]

    interactive:
      keywords: ["step by step", "guide", "walk through", "help me", "teach"]
      phrases:
        - "walk me through this"
        - "guide me step by step"
        - "help me understand"
      education_indicators: ["explain", "understand", "learn", "show me how"]

    watch:
      keywords: ["monitor", "watch", "continuous", "real-time", "live", "auto"]
      phrases:
        - "keep monitoring"
        - "watch for changes"
        - "update as I save"
      file_indicators: ["save", "change", "modify", "update"]

  # Adapt SuperClaude's File_Based_Activation
  context_based_activation:
    test_files: ["*.test.*", "*.spec.*"] → suggest TDD mode
    ui_files: ["*.tsx", "*.jsx", "*.vue"] → suggest magic mode
    config_files: ["*.yml", "*.json", "*.env"] → suggest safe mode
```

#### B. Complexity Triggers (from task-management-patterns.yml)

```yaml
Auto_Mode_Selection:
  # Adapt SuperClaude's Complexity_Triggers
  operation_complexity:
    simple:
      indicators: ["single file", "quick fix", "small change"]
      mode: "immediate execution"

    moderate:
      indicators: ["multiple files", "refactor", "feature"]
      mode: "suggest planning"

    complex:
      indicators: ["architecture", "system-wide", "migration"]
      mode: "auto-activate planning"

  time_estimation:
    under_5_min: "direct execution"
    5_to_30_min: "optional planning"
    over_30_min: "required planning with TodoWrite"
```

#### C. Mode Behaviors (from planning-mode.yml & persona-patterns.yml)

```yaml
Mode_Behaviors:
  planning_mode:
    # From SuperClaude's Planning_Flags
    pre_execution: "Generate comprehensive plan"
    user_interaction: "Present via exit_plan_mode"
    approval_required: true
    auto_triggers:
      - "Complex operations (>30min)"
      - "Multi-file changes"
      - "Architecture decisions"

  interactive_mode:
    # Adapted from persona behaviors
    execution_style: "Step-by-step with checkpoints"
    explanations: "Before and after each action"
    confirmations: "At critical decision points"
    education_focus: true

  watch_mode:
    # From execution control flags
    file_monitoring: true
    re_execution: "On file save"
    incremental_updates: true
    status_reporting: "Regular progress updates"
```

## Implementation Tasks (Updated)

### Phase 2.5.1: Core YAML Updates

**Add to core-patterns.yml:**

```yaml
## Mode_Detection
mode_detection:
  # Natural language patterns (adapted from SuperClaude)
  patterns:
    planning:
      primary_keywords: ["plan", "planning", "design", "architect", "strategy"]
      secondary_keywords: ["approach", "think through", "outline", "proposal"]
      complexity_triggers: ["architecture", "system", "complex", "redesign"]
      phrases:
        [
          "show me your plan",
          "plan it out first",
          "design before building",
          "what's your strategy",
        ]

    interactive:
      primary_keywords: ["walk", "guide", "step", "help", "teach"]
      secondary_keywords: ["understand", "explain", "show", "learn"]
      phrases:
        [
          "walk me through",
          "guide me step by step",
          "help me understand",
          "teach me how",
        ]

    watch:
      primary_keywords: ["watch", "monitor", "continuous", "live"]
      secondary_keywords: ["auto", "refresh", "update", "reload"]
      phrases:
        [
          "keep monitoring",
          "watch for changes",
          "update as I work",
          "continuous feedback",
        ]

  # Context-based triggers (from SuperClaude)
  auto_activation:
    file_patterns:
      "*.test.*|*.spec.*": ["suggest: TDD mode"]
      "*.tsx|*.jsx|*.vue": ["suggest: magic mode for UI"]
      "*api*|*server*": ["suggest: comprehensive testing"]

    complexity_assessment:
      simple: "Single file, clear intent → immediate"
      moderate: "Multi-file, feature work → suggest planning"
      complex: "System changes, architecture → require planning"

  # Flag mapping (preserve SuperClaude compatibility)
  flag_to_natural:
    "--plan": ["plan", "planning", "design first"]
    "--interactive": ["walk me through", "guide me", "step by step"]
    "--watch": ["monitor", "keep watching", "continuous"]
    "--think": ["analyze deeply", "think through", "comprehensive"]
    "--magic": ["create UI", "beautiful interface", "modern design"]
    "--c7": ["look up docs", "best practices", "documentation"]
```

### Phase 2.5.2: Shared Detection Module

Create a detection utility that all commands can use:

```javascript
// Pseudo-code structure based on SuperClaude patterns
const detectModes = (arguments, context) => {
  // 1. Parse natural language
  const normalized = arguments.toLowerCase();

  // 2. Check against mode patterns (from YAML)
  const detectedModes = [];

  // 3. Apply complexity triggers
  if (context.fileCount > 5 || hasArchitectureKeywords(normalized)) {
    detectedModes.push({ mode: "planning", confidence: 0.8 });
  }

  // 4. Check file-based activation
  const fileTypes = getProjectFileTypes();
  const suggestedModes = getSuggestedModesForFiles(fileTypes);

  // 5. Blend and prioritize modes
  return prioritizeModes(detectedModes, suggestedModes);
};
```

### Phase 2.5.3: Command Updates

Update each command to:

1. Import mode detection patterns via @include
2. Parse $ARGUMENTS for natural language
3. Adapt workflow based on detected modes
4. Maintain semantic transformation (What/How/When)

### Phase 2.5.4: Sub-Agent Patterns

Adapt SuperClaude's persona delegation for modes:

```yaml
Mode_Delegation:
  planning_agent:
    trigger: "Complex planning detected"
    focus: "Architecture, design, comprehensive analysis"
    output: "Structured plan with TodoWrite integration"

  interactive_agent:
    trigger: "Educational mode requested"
    focus: "Step-by-step guidance, explanations"
    output: "Guided workflow with checkpoints"

  monitoring_agent:
    trigger: "Watch mode activated"
    focus: "File system observation, change detection"
    output: "Continuous updates and re-execution"
```

## Benefits of This Approach

1. **Leverages Proven Patterns**: Uses SuperClaude's battle-tested detection
   logic
2. **Maintains Simplicity**: Adapts complex patterns to SimpleClaude's
   minimalist philosophy
3. **Preserves Compatibility**: Can understand SuperClaude-style flags if needed
4. **Progressive Enhancement**: Basic usage stays simple, advanced features
   emerge naturally

## Next Steps

1. Implement Mode_Detection section in core-patterns.yml
2. Create shared detection module
3. Update sc-create as proof of concept
4. Test with real-world examples
5. Roll out to remaining commands

This refined plan combines the best of SuperClaude's comprehensive patterns with
SimpleClaude's elegant simplicity.
