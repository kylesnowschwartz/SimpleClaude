**Purpose**: [Command purpose - single clear statement]

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

@include shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

[Main command description - explains how natural language is transformed into structured actions]

### Semantic Transformations

```
"[natural language example]" →
  What: [specific target extracted]
  How: [approach/method detected]
  When: [timing/mode determined]
  Mode: [detected modes]

"[another example]" →
  What: [different target]
  How: [different approach]
  When: [different timing]
  Mode: [different modes]
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**[Mode Name]** ([trigger words])

- [Behavior description]
- [Key feature 1]
- [Key feature 2]
- [Expected outcome]

**[Mode Name]** ([trigger words])

- [Behavior description]
- [Key feature 1]
- [Key feature 2]
- [Expected outcome]

**Mode Blending**

```
"[compound example]" →
  Modes: [mode1, mode2]
  Result: [Combined behavior]
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/[command] [natural language]` - [What it does]
- `/[command] [different natural language]` - [Different behavior]
- `/[command] [compound natural language]` - [Blended modes]

## Smart Detection & Routing

```yaml
[Category]: [keywords list]
  → [What happens with these keywords]

[Category]: [keywords list]
  → [What happens with these keywords]
```

**Intelligent Context Detection:** Analyzes request intent | Identifies scope automatically | Chooses optimal approach | Evidence-based modifications | Detects modes from natural language patterns

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#[Specific_Workflow]

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**[Workflow 1]:** [Step 1] → [Step 2] → [Step 3] → [Result]

**[Workflow 2]:** [Step 1] → [Step 2] → [Step 3] → [Result]

## Sub-Agent Delegation

```yaml
When: [Conditions for sub-agent use]
How: [Delegation pattern]
Examples:
  - [Specific example 1]
  - [Specific example 2]
```

## Best Practices

- [Practice 1]
- [Practice 2]
- [Practice 3]
- [Practice 4]
- [Practice 5]
