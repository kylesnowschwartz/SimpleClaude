**Purpose**: [Command purpose - single clear statement]

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

[Main command description using semantic transformation of natural language
input]

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/[command]` - [Example usage]
- `/[command] --magic` - [Example with UI generation]
- `/[command] --c7` - [Example with documentation lookup]

[Command-specific modes/features organized with **bold headers:**]

**Mode 1:** Description | Key features | Expected outcomes **Mode 2:**
Description | Key features | Expected outcomes

**Intelligent Detection:** Automatically identifies context from $ARGUMENTS |
Adapts approach based on request | Evidence-based decisions

**--watch:** Continuous monitoring | Real-time feedback | Auto re-execution
**--interactive:** Step-by-step guidance | User confirmation | Progressive
refinement

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Command_Specific_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization
