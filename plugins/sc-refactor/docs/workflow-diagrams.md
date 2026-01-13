# SC-Refactor Workflow Diagrams

Sequence diagrams showing user flows through the sc-refactor plugin.

## Invocation Patterns

There are two ways to use this plugin:

1. **Automatic (Skill)**: User says "review my code" → skill triggers → Claude spawns appropriate agents
2. **Manual (Command)**: User types `/sc-refactor:sc-production-review` → command executes

## 1. Skill Router (Automatic Triggering)

When user requests match trigger phrases, the skill loads and guides Claude to spawn agents.

```
%% Flow: SC-Refactor Skill Router
%% Render: cat workflow-diagrams.md | grep -A20 "sequenceDiagram" | head -21 | mermaid-ascii -f -

sequenceDiagram
    participant U as User
    participant S as Skill
    participant R as Router

    U->>S: review request
    S->>S: (check context packet)
    S->>R: parse intent
    R-->>S: workflow type
    S-->>U: route to workflow
```

```
┌──────┐     ┌───────┐     ┌────────┐
│ User │     │ Skill │     │ Router │
└───┬──┘     └───┬───┘     └────┬───┘
    │            │              │
    │ review request            │
    ├───────────►│              │
    │            │              │
    │            │ (check context packet)
    │            ├──┐           │
    │            │  │           │
    │            │◄─┘           │
    │            │              │
    │            │ parse intent │
    │            ├─────────────►│
    │            │              │
    │            │ workflow type│
    │            │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │            │              │
    │ route to workflow         │
    │◄┈┈┈┈┈┈┈┈┈┈┈┤              │
```

## 2. Production Review Workflow

`/sc-refactor:sc-production-review` - Combines functional and structural review.

```
sequenceDiagram
    participant U as User
    participant C as Command
    participant CR as CodeReviewer
    participant SR as StructReviewer

    U->>C: sc-production-review
    C->>CR: review bugs/security
    C->>SR: review completeness
    CR-->>C: functional issues
    SR-->>C: structural issues
    C->>C: (synthesize report)
    C-->>U: unified verdict
```

```
┌──────┐     ┌─────────┐     ┌──────────────┐     ┌────────────────┐
│ User │     │ Command │     │ CodeReviewer │     │ StructReviewer │
└───┬──┘     └────┬────┘     └───────┬──────┘     └────────┬───────┘
    │             │                  │                     │
    │ sc-production-review           │                     │
    ├────────────►│                  │                     │
    │             │                  │                     │
    │             │ review bugs/security                   │
    │             ├─────────────────►│                     │
    │             │                  │                     │
    │             │ review completeness                    │
    │             ├───────────────────────────────────────►│
    │             │                  │                     │
    │             │ functional issues│                     │
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤                     │
    │             │                  │                     │
    │             │ structural issues│                     │
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │                  │                     │
    │             │ (synthesize report)                    │
    │             ├──┐               │                     │
    │             │◄─┘               │                     │
    │             │                  │                     │
    │ unified verdict                │                     │
    │◄┈┈┈┈┈┈┈┈┈┈┈┈┤                  │                     │
```

## 3. Codebase Health Workflow

`/sc-refactor:sc-codebase-health` - Spawns all 5 analysis agents in parallel.

```
sequenceDiagram
    participant U as User
    participant C as Command
    participant A as Agents

    U->>C: sc-codebase-health
    C->>C: (check context)
    C->>A: spawn 5 agents parallel
    A-->>C: duplication findings
    A-->>C: abstraction findings
    A-->>C: naming findings
    A-->>C: dead code findings
    A-->>C: test org findings
    C->>C: (synthesize report)
    C-->>U: health report + options
```

```
┌──────┐     ┌─────────┐     ┌────────┐
│ User │     │ Command │     │ Agents │
└───┬──┘     └────┬────┘     └────┬───┘
    │             │               │
    │ sc-codebase-health          │
    ├────────────►│               │
    │             │               │
    │             │ (check context)
    │             ├──┐            │
    │             │◄─┘            │
    │             │               │
    │             │ spawn 5 agents parallel
    │             ├──────────────►│
    │             │               │
    │             │ duplication findings
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │               │
    │             │ abstraction findings
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │               │
    │             │ naming findings
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │               │
    │             │ dead code findings
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │               │
    │             │ test org findings
    │             │◄┈┈┈┈┈┈┈┈┈┈┈┈┈┈┤
    │             │               │
    │             │ (synthesize report)
    │             ├──┐            │
    │             │◄─┘            │
    │             │               │
    │ health report + options     │
    │◄┈┈┈┈┈┈┈┈┈┈┈┈┤               │
```

## 4. Routing Decision Matrix

| User Request | Detected Intent | Workflow | Agents |
|--------------|-----------------|----------|--------|
| "review my code" | production | sc-production-review | sc-code-reviewer + sc-structural-reviewer |
| "check for bugs" | functional | direct to agent | sc-code-reviewer |
| "find dead code" | cleanup | direct to agent | sc-dead-code-detector |
| "simplify this" | refactor | agent pair | sc-abstraction-critic + sc-duplication-hunter |
| "naming issues" | consistency | direct to agent | sc-naming-auditor |
| "test structure" | organization | direct to agent | sc-test-organizer |
| "full health check" | comprehensive | sc-codebase-health | all 5 agents |

## 5. Context Packet Flow

When no context packet exists, the skill invokes context-wizard first:

```
User Request
     │
     ▼
┌─────────────┐
│ Check for   │
│ context.md  │
└──────┬──────┘
       │
       ├── Found ──► Parse Intent ──► Route to Workflow
       │
       └── Missing ──► Invoke context-wizard ──► Create packet ──► Parse Intent
```

## Implementation Notes

1. **Skill is the entry point** - Users interact with the skill, not commands directly
2. **Context packets focus reviews** - Without context, reviews are unfocused
3. **Parallel execution** - Multi-agent workflows spawn all agents simultaneously
4. **Confidence filtering** - All agents only report findings >= 80 confidence
5. **Unified output** - Commands synthesize agent results into single report
