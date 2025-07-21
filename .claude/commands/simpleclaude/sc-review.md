**Purpose**: Comprehensive code review and quality analysis with intelligent feedback, including GitHub PR review automation

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

Comprehensive review router that transforms natural language into structured expert analysis for security, performance, architecture, and code quality assessment. Includes GitHub Pull Request integration for automated PR reviews.

### Intelligent Review Detection

**Auto-detects review type from arguments:**

- **PR detected** (e.g., "PR 123", "#456"): Use GitHub CLI workflow
- **General review** (e.g., "auth module", "performance"): Use semantic transformation

**PR Review Process (when PR detected):**

1. use `gh pr list` if PR # is not provided
2. Use `gh pr view <number>` for PR details
3. Use `gh pr diff <number>` for code changes
4. Analyze changes for code quality, style, and potential issues
5. Provide structured review with improvement suggestions
6. Focus on correctness, conventions, performance, testing, and security

### Semantic Transformations

```
"review PR 123" →
  What: GitHub Pull Request #123 analysis
  How: git CLI diff analysis and structured feedback
  Mode: implementer

"strictly review the authentication module" →
  What: authentication module security and quality
  How: zero-tolerance comprehensive analysis
  Mode: planner

"check security vulnerabilities in payment" →
  What: payment system security weaknesses
  How: OWASP top 10 vulnerability scan
  Mode: implementer

"review performance bottlenecks" →
  What: system performance analysis
  How: profiling and optimization recommendations
  Mode: implementer

"test coverage analysis for API" →
  What: API test suite completeness
  How: coverage gaps and test scenario validation
  Mode: tester
```

Examples:

- `/sc-review PR 123` - Review specific GitHub Pull Request
- `/sc-review #456` - Review GitHub Pull Request #456
- `/sc-review https://github.com/<org>/<project/pull/456` - Review GitHub Pull Request #456
- `/sc-review authentication module` - Comprehensive security and quality review
- `/sc-review performance bottlenecks` - Performance analysis with optimization
- `/sc-review test coverage gaps` - Test suite analysis and improvements
- `/sc-review architecture patterns` - Design pattern and structure evaluation

**Context Detection:** Review request analysis → PR/code target identification → Focus areas identification → Review approach → Multiple concerns detection → Sub-agent spawning

## Core Workflows

**Planner:** Sub-agents → Define review scope → Identify risk areas → Create review strategy → Generate checklists  
**Implementer:** Sub-agents → Execute review → Analyze code quality → Generate feedback → Provide recommendations  
**Tester:** Sub-agents → Validate functionality → Check test coverage → Identify edge cases → Verify compliance  
**PR Reviewer:** Sub-agents → Fetch PR data → Analyze diff → Generate structured review → Provide actionable feedback
