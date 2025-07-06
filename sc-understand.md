# sc-understand - Comprehensive Analysis & Learning

> Understand codebases, explain concepts, and explore systems with AI assistance

Version: 0.3.0

@include ./mode-detection.yml

---

## Purpose

`sc-understand` provides intelligent code analysis, explanation, and exploration
capabilities. It adapts its approach based on natural language to deliver
educational content, visual representations, deep analysis, interactive
exploration, or documentation lookup.

## Usage

```bash
sc understand [options] <analysis-request>
```

### Examples

```bash
# Educational mode - detailed explanations
sc understand "explain how authentication works in detail"

# Visual mode - architecture diagrams
sc understand "show me the architecture visually"

# Deep mode - comprehensive analysis
sc understand "deep dive into the caching strategy"

# Interactive mode - guided exploration
sc understand "walk me through the API structure"

# C7 mode - documentation lookup
sc understand "look up React hooks documentation"

# Analysis mode - codebase insights
sc understand "analyze the database schema and relationships"
```

## Mode Detection & Adaptation

The command automatically detects the appropriate analysis mode based on your
natural language:

- **Educational mode**: Triggered by "explain", "teach me", "in detail", "how
  does"
- **Visual mode**: Triggered by "show", "visualize", "diagram", "visually"
- **Deep mode**: Triggered by "deep dive", "comprehensive", "thoroughly analyze"
- **Interactive mode**: Triggered by "walk me through", "guide me", "explore
  together"
- **C7 mode**: Triggered by "look up", "documentation for", "reference"
- **Analysis mode**: Triggered by "analyze", "assess", "evaluate", "understand"

## Core Capabilities

- **Code Explanation**: Break down complex code into understandable parts
- **Architecture Visualization**: Generate diagrams and visual representations
- **System Analysis**: Comprehensive evaluation of design patterns and structure
- **Interactive Learning**: Q&A style exploration of codebases
- **Documentation Lookup**: Quick access to library and framework docs
- **Performance Analysis**: Understand bottlenecks and optimization
  opportunities

## Semantic Transformations

| User Says                            | Inferred Task                       | Mode        |
| ------------------------------------ | ----------------------------------- | ----------- |
| "explain the auth flow"              | Detailed authentication explanation | Educational |
| "show me how components connect"     | Architecture diagram generation     | Visual      |
| "deep analysis of the data pipeline" | Comprehensive pipeline evaluation   | Deep        |
| "help me understand the API"         | Interactive API exploration         | Interactive |
| "React useState documentation"       | Hook documentation lookup           | C7          |
| "analyze code complexity"            | Codebase metrics and insights       | Analysis    |

## Options

- `--output`: Specify output format (markdown, diagram, json)
- `--focus`: Narrow analysis to specific area
- `--depth`: Control analysis depth (quick, standard, deep)
- `--export`: Save analysis results to file

## Mode Behaviors

### Educational Mode

- Step-by-step explanations with examples
- Analogies and real-world comparisons
- Code snippets with detailed comments
- Best practices and common pitfalls
- Learning resources and references

### Visual Mode

- Architecture diagrams and flowcharts
- Component relationship visualizations
- Data flow representations
- Sequence diagrams for processes
- Interactive graph outputs when possible

### Deep Mode

- Comprehensive codebase analysis
- Design pattern identification
- Performance characteristics
- Security implications
- Technical debt assessment
- Refactoring opportunities

### Interactive Mode

- Guided Q&A exploration
- Progressive disclosure of information
- Clarifying questions for focus
- Interactive code walkthroughs
- Hands-on learning approach

### C7 Mode

- Quick documentation retrieval
- API reference lookup
- Framework-specific guidance
- Code examples from docs
- Version-specific information

### Analysis Mode

- Codebase metrics and statistics
- Complexity analysis
- Dependency mapping
- Test coverage insights
- Quality assessments

## Best Practices

1. **Be Specific**: The more specific your request, the better the analysis
2. **Use Natural Language**: Let your words guide the mode selection
3. **Iterate**: Start broad, then narrow focus based on initial results
4. **Combine Modes**: Mix visual and educational for best understanding
5. **Export Important Findings**: Save analysis for future reference

## Integration

Works seamlessly with other sc commands:

- Use before `sc modify` to understand current implementation
- Combine with `sc create` for informed development
- Follow with `sc review` to validate understanding
- Use `sc fix` after identifying issues

## Examples by Category

### Architecture Understanding

```bash
sc understand "show me the microservices architecture visually"
sc understand "explain how services communicate with each other"
```

### Code Comprehension

```bash
sc understand "walk me through the payment processing logic"
sc understand "deep dive into the authentication middleware"
```

### Performance Analysis

```bash
sc understand "analyze database query performance"
sc understand "explain the caching strategy in detail"
```

### API Exploration

```bash
sc understand "help me understand the REST API endpoints"
sc understand "show GraphQL schema relationships visually"
```

### Documentation Lookup

```bash
sc understand "look up Next.js routing documentation"
sc understand "find React Query usage examples"
```

### System Analysis

```bash
sc understand "comprehensive analysis of the deployment pipeline"
sc understand "evaluate the testing strategy"
```

## Output

The command provides:

- Clear explanations tailored to your needs
- Visual diagrams when requested
- Code examples with annotations
- Performance insights and metrics
- Actionable recommendations
- Documentation references
- Interactive exploration results

## Advanced Usage

### Combining Analysis Types

```bash
sc understand "explain the auth system visually with performance insights"
```

### Focused Deep Dives

```bash
sc understand "deep analysis of user service focusing on scalability"
```

### Learning Paths

```bash
sc understand "teach me the codebase starting from the API layer"
```

### Documentation Integration

```bash
sc understand "explain this code with React 18 documentation references"
```
