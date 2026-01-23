---
name: sc-mermaid-sequence
description: Generate mermaid-ascii compliant sequence diagrams
argument-hint: "[flow description]"
allowed-tools: Read, Write, Bash(cat:*), Bash(mermaid-ascii:*), Bash(mkdir:*)
---

# Mermaid-ASCII Sequence Diagram Generator

Generate a sequence diagram that renders correctly with `mermaid-ascii`.

**Input**: $ARGUMENTS

## Syntax Reference (mermaid-ascii parser)

### WORKS ✓
```
sequenceDiagram           # REQUIRED first line
participant A as Alice    # aliases (optional)
"Quoted Name"             # spaces in names
A->>B: message            # solid arrow (colon REQUIRED)
A-->>B: message           # dotted arrow (colon REQUIRED)
A->>A: self               # self-message (use for notes)
%% comment                # ignored by parser
```

### FAILS ✗
```
A->B: msg     # wrong arrow (needs ->>)
A-->B: msg    # wrong arrow (needs -->>)
A->>B         # missing colon
Note over A   # not implemented
loop/alt/opt  # not implemented
activate A    # not implemented
rect rgb()    # not implemented
```

## Design Rules

1. **Colon is mandatory**: `A->>B: text` works, `A->>B` fails
2. **Only ->> and -->>**: No other arrow types parse
3. **Self-messages for notes**: `A->>A: (thinking)` instead of `Note`
4. **Comments for structure**: `%% Phase 1:` or `%% alt: if X then Y`
5. **Short labels**: ASCII rendering is wide; keep messages brief
6. **Limit participants**: 4-6 max for terminal readability

## Workflow

1. **Understand the flow**: Parse $ARGUMENTS or ask clarifying questions
2. **Identify actors**: Who/what participates? Use clear short names
3. **Map interactions**: What messages flow between them?
4. **Generate diagram**: Follow the template below
5. **Validate syntax**: Pipe through `mermaid-ascii -f -` to catch errors
6. **Save file**: Write to appropriate location (ask user if unclear)
7. **Show result**: Display both source and ASCII render

## Template

```
%% Flow: [title]
%% Render: cat <file> | mermaid-ascii -f -
%% Source: [file references if applicable]

sequenceDiagram
    participant A as ActorOne
    participant B as ActorTwo

    %% Phase 1: [description]
    A->>B: request
    B-->>A: response

    %% alt: [condition] -> [outcome]
```

## Example: API Request Flow

```
%% Flow: API authentication
%% Render: cat api-auth.mmd | mermaid-ascii -f -

sequenceDiagram
    participant C as Client
    participant G as Gateway
    participant A as Auth
    participant S as Service

    C->>G: POST /api/data
    G->>A: validate token
    A-->>G: valid
    G->>S: forward request
    S-->>G: response
    G-->>C: 200 OK

    %% alt: invalid token
    %% A-->>G: 401
    %% G-->>C: 401 Unauthorized
```

Renders as:
```
┌────────┐  ┌─────────┐  ┌──────┐  ┌─────────┐
│ Client │  │ Gateway │  │ Auth │  │ Service │
└───┬────┘  └────┬────┘  └──┬───┘  └────┬────┘
    │            │          │           │
    │ POST /api/data        │           │
    ├───────────►│          │           │
    │            │ validate token       │
    │            ├─────────►│           │
    │            │ valid    │           │
    │            │◄┈┈┈┈┈┈┈┈┈┤           │
    │            │ forward request      │
    │            ├─────────────────────►│
    │            │ response │           │
    │            │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │ 200 OK     │          │           │
    │◄┈┈┈┈┈┈┈┈┈┈┈┤          │           │
```

## Validation

Before saving, ALWAYS test with:
```bash
cat <<'EOF' | mermaid-ascii -f -
[your diagram here]
EOF
```

If it errors, fix the syntax. Common fixes:
- Add missing colon after target: `A->>B` → `A->>B:`
- Fix arrow type: `A->B:` → `A->>B:`
- Remove unsupported syntax (Notes, loops, etc.)
