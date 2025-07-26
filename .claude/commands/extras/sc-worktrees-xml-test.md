**Purpose**: Help users understand and implement git-worktrees for parallel Claude Code sessions with intelligent routing

---

## Agent Orchestration

Based on request complexity and intent, delegate to specialized agents using Task() calls:

**Streamlined Agent Set for Git-Worktrees**:

- `Task("context-analyzer", "analyze <repository_state>${REPOSITORY_STATE}</repository_state> and identify <worktree_strategy>${WORKTREE_STRATEGY}</worktree_strategy>")`
- `Task("implementation-specialist", "implement worktree solution using embedded Anthropic practices for <worktree_scope>${WORKTREE_SCOPE}</worktree_scope>")`

**Execution Strategy**: Sequential workflow - context analysis → implementation with built-in validation. No research needed - Anthropic documentation embedded below.

## Command Execution

**If "{{ARGUMENTS}}" is empty**: Display git-worktrees overview, current worktree status, and educational content.
**If "{{ARGUMENTS}}" has content**: Think step-by-step, then execute.

Transforms: "{{ARGUMENTS}}" into structured intent:

- What: [worktree-operation-and-education]
- How: [automated-setup-with-learning]
- Mode: [educational-implementation]
- Agents: [specialized Task() agents for analysis and setup]

**Auto-Spawning:** Spawns specialized agents via Task() calls for parallel worktree analysis and implementation.

### Semantic Transformations

Transforms natural language git-worktree requests into structured repository analysis and automated configuration:

```
"setup worktrees for parallel development" → What: [comprehensive-setup] | How: [multi-worktree-creation] | Mode: [educational-workflow]
"create worktree for <feature_name>${FEATURE_NAME}</feature_name>" → What: [single-worktree] | How: [branch-specific-setup] | Mode: [targeted-implementation]
"show me current worktrees for <project_path>${PROJECT_PATH}</project_path>" → What: [status-display] | How: [visualization-and-education] | Mode: [informational]
```

Examples:

- `/sc-worktrees` - Display overview and current worktree status with educational content
- `/sc-worktrees setup parallel development` - Create comprehensive worktree setup for parallel work
- `/sc-worktrees create feature-auth` - Create single worktree for feature-auth branch

**Context Detection:** Repository analysis → Worktree status → Branch analysis → Setup planning with <project_context>${PROJECT_CONTEXT}</project_context>

## Core Workflows

**Educational Mode:** Display concepts and current status with embedded Anthropic guidance
**Setup Mode:** Context analysis → Automated worktree creation → Configuration → Built-in validation
**Single Worktree:** Context analysis → Targeted worktree creation → Environment setup

## Embedded Anthropic Documentation (No Research Needed)

**Source**: https://docs.anthropic.com/en/docs/claude-code/common-workflows#run-parallel-claude-code-sessions-with-git-worktrees

<anthropic_guidance>

**Git-Worktrees Overview**:
- Allow checking out multiple branches from <repository_root>${REPOSITORY_ROOT}</repository_root> into separate directories
- Each worktree has isolated working directory while sharing Git history
- Enable parallel work on multiple tasks simultaneously for <development_context>${DEVELOPMENT_CONTEXT}</development_context>
- Provide complete code isolation between Claude Code instances
- Prevent interference between different development contexts

**Setup and Usage**:
```bash
# Create new worktree with new branch
git worktree add <worktree_path>${WORKTREE_PATH}</worktree_path> -b <branch_name>${BRANCH_NAME}</branch_name>

# Create worktree with existing branch
git worktree add <worktree_path>${WORKTREE_PATH}</worktree_path> <existing_branch>${EXISTING_BRANCH}</existing_branch>

# Navigate and start Claude Code
cd <worktree_path>${WORKTREE_PATH}</worktree_path>
claude
```

**Management Commands**:
```bash
# List all worktrees
git worktree list

# Remove completed worktree
git worktree remove <completed_worktree>${COMPLETED_WORKTREE}</completed_worktree>
```

**Best Practices**:
- Use descriptive directory names for <task_identification>${TASK_IDENTIFICATION}</task_identification>
- Initialize development environment in each <new_worktree>${NEW_WORKTREE}</new_worktree>
- Reinitialize project dependencies for <project_type>${PROJECT_TYPE}</project_type>
- Share Git history and remote connections across <all_worktrees>${ALL_WORKTREES}</all_worktrees>

</anthropic_guidance>

## Streamlined Implementation Protocol

**Context-Analyzer Tasks:**
1. Check repository status: `git status --porcelain`
2. List existing worktrees: `git worktree list`
3. Verify Claude Code available: `claude --version`

**Implementation-Specialist Tasks:**
1. Create worktree using Anthropic patterns with <creation_parameters>${CREATION_PARAMETERS}</creation_parameters>
2. Setup development environment for <environment_type>${ENVIRONMENT_TYPE}</environment_type>
3. Test Claude Code access in <new_worktree_path>${NEW_WORKTREE_PATH}</new_worktree_path>
4. Display success confirmation and next steps

## Common Worktree Patterns

**New Feature Development:**
```bash
git worktree add <feature_worktree>${FEATURE_WORKTREE}</feature_worktree> -b <feature_branch>${FEATURE_BRANCH}</feature_branch>
cd <feature_worktree>${FEATURE_WORKTREE}</feature_worktree>
<dependency_install>${DEPENDENCY_INSTALL}</dependency_install>  # npm install or equivalent for <project_type>${PROJECT_TYPE}</project_type>
claude
```

**Bug Fix While Continuing Work:**
```bash
git worktree add <hotfix_worktree>${HOTFIX_WORKTREE}</hotfix_worktree> -b <hotfix_branch>${HOTFIX_BRANCH}</hotfix_branch>
cd <hotfix_worktree>${HOTFIX_WORKTREE}</hotfix_worktree>
# Fix bug with Claude while main work continues in <main_worktree>${MAIN_WORKTREE}</main_worktree>
```

**Code Review:**
```bash
git worktree add <review_worktree>${REVIEW_WORKTREE}</review_worktree> -b <review_branch>${REVIEW_BRANCH}</review_branch>
cd <review_worktree>${REVIEW_WORKTREE}</review_worktree>
git pull origin pull/<pr_number>${PR_NUMBER}</pr_number>/head
claude  # Review with fresh context for <review_target>${REVIEW_TARGET}</review_target>
```

## Maintenance Commands

**List and Clean:**
```bash
git worktree list                              # Show all worktrees
git worktree remove <completed_worktree>${COMPLETED_WORKTREE}</completed_worktree>       # Remove when done
git worktree prune                            # Clean up stale references
```

## Success Criteria

**Required:**
- ✅ Worktree created successfully for <target_branch>${TARGET_BRANCH}</target_branch>
- ✅ Claude Code works in <new_worktree_environment>${NEW_WORKTREE_ENVIRONMENT}</new_worktree_environment>
- ✅ User understands parallel development benefit

**Optimal:**
- ✅ Multiple worktrees for different <development_streams>${DEVELOPMENT_STREAMS}</development_streams>
- ✅ Parallel Claude sessions working independently

## Quick Reference

**Essential Commands:**
- `git worktree add <path>${PATH}</path> -b <branch>${BRANCH}</branch>` - Create new worktree
- `git worktree list` - Show all worktrees
- `git worktree remove <path>${PATH}</path>` - Remove worktree
- `git worktree prune` - Clean up stale references

**Best Practices:**
- Use descriptive names: `<naming_example>${NAMING_EXAMPLE}</naming_example>`
- Run `<install_command>${INSTALL_COMMAND}</install_command>` in each new <worktree_type>${WORKTREE_TYPE}</worktree_type>
- Clean up completed <completed_worktrees>${COMPLETED_WORKTREES}</completed_worktrees> regularly

<additional_instructions>
${ADDITIONAL USER INPUT}
</additional_instructions>

---

**Generated Worktrees Location**: `<worktree_location>${WORKTREE_LOCATION}</worktree_location>`
**Maintenance Commands**: `git worktree list`, `git worktree prune`, `claude --version`
**Documentation**: Comprehensive learning resources and git-worktrees examples provided
