---
description: "Discover undocumented features and hidden implementations"
argument-hint: "[search-query] - optional topic or pattern to search for"
---

# sc-eastereggs: Discover undocumented features, hidden flags, and clever implementations throughout the codebase

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Execution Strategy**: For complex discovery tasks, spawn agents simultaneously for parallel investigation streams focusing on discovery, investigation, and documentation rather than implementation.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display usage suggestions and stop.  
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]
- Agents: [specialized Task() agents]

**Auto-Spawning:** Spawns 2-3 code-expert agents via in parallel execution.

Intelligent discovery router that transforms natural language queries into systematic searches for hidden features, undocumented capabilities, and clever implementations that aren't explicitly documented.

**Context Detection:** Documentation scan → Code analysis → Pattern recognition → Feature extraction → Category organization

## Core Workflows

**Planner:** Agents → Ingest README/docs → Map documented features → Identify search patterns → Plan discovery strategy  
**Implementer:** Agents → Search codebase → Extract hidden features → Analyze implementations → Categorize findings  
**Tester:** Agents → Validate discoveries → Test feature combinations → Document edge cases → Verify functionality
