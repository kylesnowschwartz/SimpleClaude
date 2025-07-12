# SimpleClaude Slash Command Creation Guide

## Effective Creation Strategies

### 1. Pattern Recognition Through Examples

**Strategy**: Examine existing commands before creating new ones

- Read `TEMPLATE.md` first - it's the canonical structure
- Study a similar command (e.g., `sc-understand` for analysis-type commands)
- Pattern matching is more reliable than trying to understand the entire system

**Key insight**: The template provides the skeleton; existing commands show implementation patterns.

### 2. File System Exploration

**Effective approaches**:

```bash
# Start broad, then narrow
ls .claude/commands/simpleclaude/
find .claude -name "*.yml" -type f
grep -E "pattern" existing_commands.md
```

**What works**: Using multiple search strategies when initial paths fail (e.g., when `includes.md` isn't where expected).

### 3. Structure First, Content Second

**Recommended process**:

1. Copy the template structure exactly
2. Fill in the **Purpose** with a single clear statement
3. Map the natural language transformations to the domain
4. Create examples that demonstrate the command's flexibility
5. Define workflows that match the three-mode system

### 4. Semantic Transformation Mapping

**Successful pattern**:

```
"[user's natural language]" →
  What: [specific target/goal]
  How: [approach/method]
  Mode: [planner|implementer|tester]
```

This format makes it easy to understand how the command interprets various inputs.

### 5. Systematic Development Approach

**Why this works**:

- Clear task breakdown prevents missing steps
- Status tracking ensures systematic progress
- Natural checkpoints for validation

## Command Creation Patterns

### Quick Command Creation Checklist

1. **Read TEMPLATE.md** - Don't skip this
2. **Find a similar command** - Use it as a reference
3. **Define the purpose** - One sentence, clear and specific
4. **Map 3-4 semantic transformations** - Show input variety
5. **Create 4 examples** - Cover different use cases
6. **Define workflows** - One for each mode (Planner/Implementer/Tester)

### Essential SimpleClaude Patterns

- **Always include**: `@include shared/simpleclaude/includes.md`
- **Always check**: "If $ARGUMENTS is empty" logic
- **Always transform**: Natural language → structured intent
- **Always mention**: Auto-spawning sub-agents
- **Always end with**: Core Workflows section

### Common Pitfalls to Avoid

1. **Don't assume file locations** - Always verify with `ls` or `find`
2. **Don't modify core patterns** - Follow TEMPLATE.md exactly
3. **Don't skip the Context Detection line** - It's part of the pattern
4. **Don't forget the three-mode system** - Every command uses Planner/Implementer/Tester

### Validation Steps

```bash
# Quick validation
grep -E "^##|^###|Examples:|Core Workflows" new_command.md

# Check structure matches template
diff -u TEMPLATE.md new_command.md | grep "^[+-]" | head -20
```

## Command Purpose Formulas

### Analysis Commands (like eastereggs)

**Purpose**: [Discover/Analyze/Understand] [target] through [method]

### Creation Commands (like sc-create)

**Purpose**: Create [what] with [key characteristic]

### Modification Commands (like sc-modify)

**Purpose**: [Transform/Update/Refactor] [target] using [approach]

### Fix Commands (like sc-fix)

**Purpose**: [Resolve/Debug/Repair] [issues] through [method]

## Best Practices

1. **Plan systematically** - Break down creation into clear steps
2. **Read files in order**: TEMPLATE → similar command → create new
3. **Test section presence** with grep before assuming completion
4. **Keep the language natural** in semantic transformations
5. **Make examples diverse** - show the command's flexibility

## Example Creation Flow

```
1. Plan: Break down the command creation task
2. Read: TEMPLATE.md
3. Read: similar_command.md
4. Write: new_command.md (following template)
5. Validate: Check all sections exist
6. Test: Verify file appears in directory listing
```

This systematic approach ensures consistent, well-structured slash commands that follow SimpleClaude patterns.
