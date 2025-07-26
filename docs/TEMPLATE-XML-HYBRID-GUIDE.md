# XML-Hybrid Template Guide

## Research-Based Best Practices

This template structure is based on Anthropic's official prompt engineering documentation and research findings:

### Key Principles Applied

1. **Structured Arguments with XML Tags**: Place structured, named arguments contextually within instructions using XML tags
2. **Free-Form Input at End**: Place unstructured user input at the end to leverage recency bias
3. **Embedded Documentation**: Include authoritative documentation directly to eliminate research overhead
4. **Clear Instruction Hierarchy**: Follow Anthropic's documented preference for clear, explicit instructions

### Template Structure

```markdown
**Purpose**: [Clear statement]

## Agent Orchestration
[Streamlined agents with contextual XML arguments]

## Command Execution  
[Semantic transformations with structured arguments]

## Embedded [Authority] Documentation
[Pre-embedded authoritative content]

## Implementation Protocol
[Step-by-step with XML contexts]

## Common Patterns
[Examples with contextual XML variables]

<additional_instructions>
${ADDITIONAL USER INPUT}
</additional_instructions>
```

## Syntax Standards

### Variable Syntax Convention (Research-Based Best Practice)
- **Structured Arguments**: `${VARIABLE_NAME}` - contextually integrated using XML tags
- **Free-form User Input**: `${ADDITIONAL_USER_INPUT}` - placed at end for recency bias
- **Eliminates**: `{{ARGUMENTS}}` pattern in favor of contextual XML integration

### XML Variable Patterns

### Contextual Integration
```markdown
# GOOD: Contextual placement
analyze <target_context>${TARGET_CONTEXT}</target_context> and identify <analysis_focus>${ANALYSIS_FOCUS}</analysis_focus>

# LESS OPTIMAL: End-placed reference
analyze the context and focus
Target Context: ${TARGET_CONTEXT}
Analysis Focus: ${ANALYSIS_FOCUS}
```

### Structured Commands
```markdown
# GOOD: Clear structure with context
git worktree add <worktree_path>${WORKTREE_PATH}</worktree_path> -b <branch_name>${BRANCH_NAME}</branch_name>

# LESS OPTIMAL: Generic placeholders
git worktree add ${PATH} -b ${BRANCH}
```

## Benefits of This Research-Based Approach

1. **Reduced Cognitive Load**: Arguments appear where they're used (contextual integration)
2. **Improved Clarity**: XML tags make variable purpose explicit
3. **Better Performance**: Follows Anthropic's documented best practices exactly
4. **Maintainable**: Clear separation between structure and content
5. **Faster Execution**: Embedded documentation eliminates research delays
6. **Eliminates {{ARGUMENTS}} Pattern**: Replaces generic argument handling with contextual XML integration
7. **Leverages Recency Bias**: Free-form input at end gets proper attention weighting

## Migration Guidelines

### From Current Template
1. Identify structured arguments that can be contextually placed
2. Wrap them in descriptive XML tags
3. Move authoritative documentation into embedded sections
4. Reserve `${ADDITIONAL USER INPUT}` for truly free-form content
5. Use streamlined agent orchestration (2 agents max for most commands)

### Testing Approach
1. Create XML version alongside existing command
2. Compare execution speed and output quality
3. Validate that all functionality is preserved
4. Measure token efficiency improvements

## Implementation Status

**Files Created**:
- `TEMPLATE-XML-HYBRID.md` - New template structure
- `sc-worktrees-xml-test.md` - Test implementation
- This guide document

**Next Steps**:
1. Test the XML hybrid approach with real scenarios
2. Compare performance against current template
3. Refine based on testing results
4. Plan migration strategy for existing commands

## Research Sources

- Anthropic Claude 3 Prompt Engineering Best Practices
- Official documentation on input placement
- Community findings on XML structure usage
- Performance testing of contextual vs end-placed arguments
