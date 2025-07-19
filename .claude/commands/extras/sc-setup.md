**Purpose**: Intelligent development environment setup with pre-commit hooks, linting, and formatting

---

@.claude/shared/simpleclaude/includes.md

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- Mode: [execution-mode]

Smart development environment router that transforms natural language into structured setup directives for Git hooks, linting systems, formatting tools, and development workflow automation.

### Semantic Transformations

```
"setup pre-commit hooks" →
  What: Git pre-commit hook with comprehensive linting and formatting
  How: Repository analysis, tool detection, POSIX script generation
  Mode: implementer

"analyze project for linting setup" →
  What: Repository tool analysis and development environment assessment
  How: Language detection, LSP integration check, tool recommendations
  Mode: planner

"quick markdown formatting hook" →
  What: Markdown-focused pre-commit hook with auto-formatting
  How: Prettier + markdownlint integration, streamlined setup
  Mode: implementer

"comprehensive development environment" →
  What: Full dev environment with hooks, linting, formatting, CI integration
  How: Multi-language support, tool installation, workflow optimization
  Mode: planner

"test my pre-commit setup" →
  What: Validate existing pre-commit hook configuration
  How: Hook execution testing, tool validation, edge case verification
  Mode: tester
```

Examples:

- `/sc-setup pre-commit hooks` - Full repository analysis and hook generation
- `/sc-setup quick markdown linting` - Streamlined markdown-focused setup
- `/sc-setup analyze development tools` - Comprehensive tool assessment and recommendations
- `/sc-setup test existing hooks` - Validate and improve current pre-commit setup

**Intelligent Context Detection:** Analyzes setup request | Identifies project languages and tools automatically | Chooses optimal tool combinations | Evidence-based configurations | Detects LSP overlap to avoid redundancy

## Core Workflows

**Planner:** Repository analysis → Tool detection → LSP integration check → Setup strategy → Installation roadmap  
**Implementer:** Generate POSIX script → Configure tool chains → Install missing dependencies → Test hook execution → Validate workflow  
**Tester:** Hook execution testing → Tool validation → Edge case verification → Performance assessment → Integration testing
