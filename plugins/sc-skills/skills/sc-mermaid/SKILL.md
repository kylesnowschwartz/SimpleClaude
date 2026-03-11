---
name: sc-mermaid
description: Generate mermaid diagrams — flowcharts for architecture, sequence diagrams for interactions. This skill SHOULD be used when the user asks to "create a diagram", "draw an architecture diagram", "sequence diagram", "flowchart", "visualize the system", or "generate mermaid".
argument-hint: "[flowchart | sequence] <system or flow description>"
---

# sc-mermaid: Mermaid Diagram Generator

Generate mermaid diagrams for architecture visualization and interaction flows.

**Input**: $ARGUMENTS

## Mode Detection

Parse `$ARGUMENTS` to determine diagram type:

| Signal | Mode |
|--------|------|
| `flowchart`, `architecture`, `system`, component relationships | **Flowchart** |
| `sequence`, `flow`, `interaction`, request/response patterns | **Sequence** |
| Ambiguous | Ask the user or infer from context |

---

## Flowchart Mode

### Investigation

1. Scope identification: Determine which components, services, and relationships to include
2. Architecture analysis: Read relevant files and understand data/control flow
3. Validation: Cross-reference findings against codebase to ensure accuracy

### Diagram Requirements

- Use TB (top-bottom) or LR (left-right) direction based on flow complexity
- Apply the neutral theme for professional rendering
- Use semantic node shapes:
  - `[Rectangle]` — services, applications
  - `[(Database)]` — data stores (PostgreSQL, Redis, OpenSearch)
  - `((Circle))` — external services, APIs
  - `[[Subroutine]]` — modules, workers, background jobs
  - `{Rhombus}` — decision points, routing logic
  - `{{Hexagon}}` — gateways, proxies, middleware
- Style nodes and links using CSS classes for visual grouping
- Label every relationship with meaningful text
- Group related components with subgraphs (quote subgraph titles)

### Deliverables

1. Mermaid diagram file (`{descriptive-name}.mmd`)
2. Syntax validation: `mmdc -i <file>.mmd --parseOnly` (fix errors if any)
3. Bulleted architectural explanation
4. Validation report with file path references
5. Viewing instructions (optionally render: `mmdc -i <file>.mmd -o preview.png`)

---

## Sequence Mode

Generate diagrams compatible with `mermaid-ascii` for terminal rendering.

### Syntax Reference (mermaid-ascii parser)

**Works:**
```
sequenceDiagram           # REQUIRED first line
participant A as Alice    # aliases (optional)
"Quoted Name"             # spaces in names
A->>B: message            # solid arrow (colon REQUIRED)
A-->>B: message           # dotted arrow (colon REQUIRED)
A->>A: self               # self-message (use for notes)
%% comment                # ignored by parser
```

**Fails:**
```
A->B: msg     # wrong arrow (needs ->>)
A-->B: msg    # wrong arrow (needs -->>)
A->>B         # missing colon
Note over A   # not implemented
loop/alt/opt  # not implemented
activate A    # not implemented
```

### Design Rules

1. **Colon is mandatory**: `A->>B: text` works, `A->>B` fails
2. **Only ->> and -->>**: No other arrow types parse
3. **Self-messages for notes**: `A->>A: (thinking)` instead of `Note`
4. **Comments for structure**: `%% Phase 1:` or `%% alt: if X then Y`
5. **Short labels**: ASCII rendering is wide; keep messages brief
6. **Limit participants**: 4-6 max for terminal readability

### Workflow

1. Understand the flow from $ARGUMENTS or ask clarifying questions
2. Identify actors — use clear short names
3. Map interactions between them
4. Generate diagram following the template
5. Validate: `cat <file> | mermaid-ascii -f -`
6. Save file and show both source and ASCII render

### Template

```
%% Flow: [title]
%% Render: cat <file> | mermaid-ascii -f -

sequenceDiagram
    participant A as ActorOne
    participant B as ActorTwo

    %% Phase 1: [description]
    A->>B: request
    B-->>A: response
```

---

## Output

Write diagram to `{descriptive-name}.mmd` in the current directory (or ask user for location).

Include in the file:
- Diagram code
- Architectural explanation as markdown comments
- Validation notes with file path references

$ARGUMENTS
