**Purpose**: [Command purpose - single clear statement]

---

**CRITICAL DO NOT SKIP** Use the Read() tool to load content framework from:

<framework files>
$HOME/.claude/shared/simpleclaude/00_core_principles.md  
$HOME/.claude/shared/simpleclaude/01_orchestration.md  
$HOME/.claude/shared/simpleclaude/02_workflows_and_patterns.md  
$HOME/.claude/shared/simpleclaude/03_sub_agent_delegation.md
</framework files>

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

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

**[Workflow 1]:** Sub-agents → [Step 1] → [Step 2] → [Step 3] → Synthesis  
**[Workflow 2]:** Sub-agents → [Step 1] → [Step 2] → [Step 3] → Synthesis  
**[Workflow 3]:** Sub-agents → [Step 1] → [Step 2] → [Step 3] → Synthesis
