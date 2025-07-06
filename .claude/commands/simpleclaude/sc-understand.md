# /sc-understand Command

Unified codebase understanding and analysis command that intelligently adapts to
your needs.

## Purpose

Consolidates SuperClaude's analysis commands (load, analyze, explain, estimate,
index) into one intuitive interface that:

- Auto-detects the appropriate analysis depth
- Loads minimal context using @include directives
- Supports educational explanations
- Provides visual outputs when beneficial
- Uses parallel sub-agents for large codebases

## Usage

```
/sc-understand [query]
```

## Natural Language Examples

### Architecture & Design

- "how does the authentication work?"
- "explain the architecture to a new developer"
- "what's the overall system design?"
- "how do the components interact?"

### Code Analysis

- "what does this module do?"
- "analyze the payment processing flow"
- "how is data validated?"
- "trace the user registration process"

### Performance & Security

- "find performance bottlenecks"
- "analyze database query efficiency"
- "find security vulnerabilities"
- "check for memory leaks"

### Estimation & Planning

- "estimate effort for payment integration"
- "how complex is adding OAuth?"
- "what's needed for mobile support?"
- "assess refactoring difficulty"

### Learning & Onboarding

- "explain this like I'm new to React"
- "tutorial on the API structure"
- "walkthrough of the build process"
- "guide me through the testing setup"

## Analysis Depths

The command auto-detects appropriate depth based on your query:

### Quick Overview (1-2 min)

- High-level structure
- Key components
- Main functionality
- Basic dependencies

### Standard Analysis (5-10 min)

- Component relationships
- Data flow
- Key algorithms
- Integration points

### Deep Dive (15-30 min)

- Full architecture review
- Performance analysis
- Security assessment
- Code quality metrics

### Comprehensive Study (30+ min)

- Complete codebase analysis
- Parallel sub-agent deployment
- Cross-cutting concerns
- Future recommendations

## Smart Context Loading

Uses @include directives to load only what's needed:

```yaml
# For architecture queries
@include .claude/prompts/analyze/architecture.md

# For performance analysis
@include .claude/prompts/analyze/performance.md

# For security reviews
@include .claude/prompts/analyze/security.md

# For estimation tasks
@include .claude/prompts/project/estimation.md
```

## Features

### 🧠 Intelligent Analysis

- Query interpretation
- Depth auto-adjustment
- Context awareness
- Progressive exploration

### 📚 Educational Mode

- Adapts to expertise level
- Provides examples
- Includes visualizations
- Offers learning paths

### ⚡ Performance Optimization

- Smart caching
- Parallel processing
- Incremental analysis
- Minimal file loading

### 🎯 Focused Results

- Relevant insights only
- Actionable findings
- Clear explanations
- Next step suggestions

## Implementation Strategy

1. **Query Analysis**

   - Parse natural language
   - Detect intent and scope
   - Determine expertise level
   - Select analysis type

2. **Context Loading**

   - Use minimal @includes
   - Load progressive context
   - Cache repeated queries
   - Optimize file access

3. **Analysis Execution**

   - Deploy appropriate tools
   - Use parallel agents if needed
   - Generate visualizations
   - Compile findings

4. **Result Presentation**
   - Match user's expertise
   - Provide clear structure
   - Include examples
   - Suggest next steps

## Advanced Patterns

### Comparative Analysis

```
/sc-understand "compare authentication methods"
/sc-understand "React vs Vue patterns in this codebase"
```

### Historical Analysis

```
/sc-understand "how has the API evolved?"
/sc-understand "what changed in the last refactor?"
```

### Impact Analysis

```
/sc-understand "impact of removing this module"
/sc-understand "dependencies on the user service"
```

### Learning Paths

```
/sc-understand "guide me through the codebase"
/sc-understand "onboarding path for new developers"
```

## Integration Points

### With Other Commands

- `/sc-task`: After understanding, create tasks
- `/sc-improve`: Based on analysis findings
- `/sc-test`: Target areas needing tests
- `/sc-docs`: Document discoveries

### With Development Workflow

- Pre-implementation analysis
- Code review assistance
- Debugging support
- Refactoring planning

## Prompt Structure

```markdown
@include .claude/prompts/base/minimal-context.md @include
.claude/prompts/analyze/query-interpreter.md

Based on the query: "[user query]"

1. Determine analysis type and depth
2. Load only necessary context
3. Execute focused analysis
4. Present findings appropriately

@if architecture @include .claude/prompts/analyze/architecture.md @endif

@if performance @include .claude/prompts/analyze/performance.md @endif

@if security @include .claude/prompts/analyze/security.md @endif

@if educational @include .claude/prompts/explain/educational-mode.md @endif
```

## Caching Strategy

- Cache common queries
- Store analysis results
- Reuse component maps
- Update incrementally

## Examples

### Quick Architecture Overview

```
User: /sc-understand "how does this work?"
Assistant: *Provides high-level system overview with main components*
```

### Deep Security Analysis

```
User: /sc-understand "find security vulnerabilities"
Assistant: *Performs comprehensive security audit with specific findings*
```

### Educational Explanation

```
User: /sc-understand "explain the database layer to a junior dev"
Assistant: *Provides detailed, educational walkthrough with examples*
```

### Effort Estimation

```
User: /sc-understand "estimate adding multi-tenancy"
Assistant: *Analyzes impact, complexity, and provides time estimates*
```

## Success Metrics

- Minimal context loading
- Accurate depth detection
- Clear, useful insights
- Fast response times
- High user satisfaction

## Notes

- Adapts to user expertise automatically
- Learns from previous queries
- Suggests related analyses
- Provides actionable next steps
- Integrates with existing workflow
