# YAML to Markdown Migration Guidelines

## Migration Results Summary

**Token Efficiency Achieved:**

- **YAML version:** 1,863 tokens (7,547 characters)
- **Markdown version:** ~1,200 tokens (6,665 characters)
- **Improvement:** ~35% token reduction + 12% character reduction

## Migration Principles

### 1. Semantic Structure Over Syntax

Replace YAML's hierarchical syntax with semantic markdown headers and formatting:

```yaml
# YAML (verbose)
core_philosophy:
  approach: "Simple > complex"
  principles:
    - "Read and understand context"
```

```markdown
# Markdown (efficient)

## Core Philosophy

**Approach:** Simple > complex

### Principles

- Read and understand context
```

### 2. Inline Lists for Simple Data

Convert YAML arrays to inline lists when appropriate:

```yaml
# YAML
prohibited: ["best", "optimal", "faster", "secure", "better"]
```

```markdown
# Markdown

**Prohibited:** "best", "optimal", "faster", "secure", "better"
```

### 3. Pipe Separators for Related Items

Use markdown formatting with pipe separators for compact representation:

```yaml
# YAML
workflow_steps:
  - step: "Understand"
    actions: ["Analyze project", "Identify dependencies", "Determine approach"]
```

```markdown
# Markdown

1. **Understand** → Analyze project structure | Identify dependencies | Determine approach
```

### 4. Bold Keywords for Scanability

Make key terms bold for better AI parsing and human readability:

```markdown
**Context7:** Library documentation lookup | Working with external libraries | Required for library work
```

## File Structure Guidelines

### Header Hierarchy

- `#` Main title
- `##` Major sections
- `###` Subsections
- `####` Details (avoid if possible)

### Content Organization

1. **Overview/Description** - Italicized subtitle
2. **Key concepts** - Bold inline definitions
3. **Lists** - Bulleted for items, numbered for sequences
4. **Code/Commands** - Backticks for inline, code blocks for multi-line

## Token Optimization Strategies

### 1. Eliminate Redundant Structure

- Remove unnecessary nesting levels
- Combine related concepts into single lines
- Use symbols (→, |, &) instead of words

### 2. Compact Related Information

- Group similar items with pipe separators
- Use inline definitions instead of separate sections
- Combine description + example in single line

### 3. Strategic Formatting

- Use **bold** for key terms (better than headers for simple items)
- Use `code` formatting for commands/flags
- Use → arrows to show relationships/flow

## Migration Checklist

### Pre-Migration

- [ ] Run token count baseline: `sh scripts/token-limit-verbose.sh`
- [ ] Identify file dependencies and cross-references
- [ ] Create feature branch

### During Migration

- [ ] Maintain semantic meaning while reducing syntax
- [ ] Test readability with target AI model
- [ ] Preserve all essential information
- [ ] Use consistent formatting patterns

### Post-Migration

- [ ] Verify token reduction: target 30-40% improvement
- [ ] Update any file references in includes
- [ ] Test with actual AI prompt inclusion
- [ ] Update documentation

## Files to Migrate (Priority Order)

1. **High Impact:** `core-patterns.yml` ✅ (35% reduction achieved)
2. **Medium Impact:** `workflows.yml` (2,183 tokens - largest file)
3. **Medium Impact:** `context-detection.yml` (1,310 tokens)
4. **Lower Impact:** `modes.yml` (917 tokens)
5. **Lower Impact:** `sub-agents.yml` (606 tokens)
6. **Lower Impact:** `mode-detection.yml` (573 tokens)

## Quality Standards

### Maintain Completeness

- All original information must be preserved
- No loss of semantic meaning
- Cross-references must remain functional

### Improve Readability

- Human-readable structure
- Logical information flow
- Consistent formatting patterns

### Optimize for AI Consumption

- Clear semantic structure
- Reduced token overhead
- Fast parsing characteristics

## Testing Strategy

1. **Token measurement** before/after each file
2. **AI comprehension test** - include in actual prompts
3. **Human readability review** - maintainable documentation
4. **Cross-reference validation** - no broken dependencies

## Success Metrics

- **Target:** 30-40% token reduction per file
- **Maintain:** 100% information preservation
- **Achieve:** Improved human readability
- **Ensure:** Faster AI parsing performance
