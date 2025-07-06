**Purpose**: [Command purpose - single clear statement]

---

@include shared/simpleclaude/context-detection.yml

@include shared/simpleclaude/core-patterns.yml

@include shared/simpleclaude/mode-detection.yml

@include shared/simpleclaude/modes.yml

@include shared/simpleclaude/sub-agents.yml

@include shared/simpleclaude/thinking-modes.yml

@include shared/simpleclaude/workflows.yml

## Command Execution

Executes immediately following thinking mode directive. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [auto-spawned sub-agents]

**Auto-Spawning:** Spawns specialized sub-agents for parallel task execution.

### Semantic Transformations

[Main command description - explains how natural language is transformed into structured actions]

```
"[natural language example]" → What: [target] | How: [approach] | Mode: [execution-mode]
"[another example]" → What: [target] | How: [approach] | Mode: [execution-mode]
```

Examples:

- `/[command] [natural language]` - [What it does]
- `/[command] [different natural language]` - [Different behavior]

**Context Detection:** Request analysis → Scope identification → Approach selection → Mode detection → Sub-agent spawning

## Core Workflows

**[Workflow 1]:** Sub-agents → [Step 1] → [Step 2] → [Step 3] → Synthesis **[Workflow 2]:** Sub-agents → [Step 1] → [Step 2] → [Step 3] → Synthesis
