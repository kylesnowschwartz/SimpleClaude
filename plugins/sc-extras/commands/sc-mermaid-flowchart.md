---
argument-hint: [ System, scope, and purpose ]
description: Create a useful mermaid diagram for the requested system
---

Create a mermaid diagram for the files or system described in $ARGUMENTS

## Investigation & Planning

1. Scope identification: Determine which components, services, and relationships to include
2. Architecture analysis: Read relevant files and understand data/control flow
3. Validation: Cross-reference findings against codebase to ensure accuracy

## Diagram Requirements

### Visual Design

- Use the TB (top-bottom) or LR (left-right) direction based on flow complexity
- Apply the neutral theme for professional rendering
- Use semantic node shapes:
  - [Rectangle] - services, applications
  - [(Database)] - data stores (PostgreSQL, Redis, OpenSearch)
  - ((Circle)) - external services, APIs
  - [[Subroutine]] - modules, workers, background jobs
  - {Rhombus} - decision points, routing logic
  - {{Hexagon}} - gateways, proxies, middleware
- Add descriptive emoji to each node (one per node, semantically appropriate)
- Style nodes and links using CSS classes for visual grouping

### Content Standards

- Semantic naming: Use clear, domain-specific labels (avoid generic terms)
- Quote subgraph labels: Always use quotes for subgraph titles
- Avoid parentheses: Use descriptive text without technical noise
- Label relationships: Every arrow should have meaningful text explaining the interaction
- Group related components: Use subgraphs for logical boundaries (services, infrastructure layers, domains)

### Styling Classes

Define and apply CSS classes for:
- Component types (web, api, worker, database, cache)
- Criticality levels (core, supporting, optional)
- Data flow types (sync, async, event-driven)

## Deliverables

1. Mermaid diagram file ({descriptive-name}.mmd)
2. Syntax Validation:
  a. Validate syntax using `mmdc -i <file>.mmd --parseOnly`
  b. If validation fails, fix syntax errors and re-validate
3. Bulleted architectural explanation suitable for slides:
4. Validation report: Step-by-step verification against codebase with file references
5. Viewing instructions: How to render locally or in browser. Optionally render preview: `mmdc -i <file>.mmd -o preview.png`

## Output Format

Write diagram to: {descriptive-name}.mmd

Include in the file:
- Diagram code
- Architectural explanation as markdown comments
- Validation notes with file path references

$ARGUMENTS
