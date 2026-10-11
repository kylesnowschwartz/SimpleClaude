---
name: sc-mermaid
description: >
  Choose the right kind of diagram for what the user is describing, then write and validate
  it in mermaid. This skill SHOULD be used when the user asks to "create a diagram", "draw an
  architecture diagram", "sequence diagram", "flowchart", "state diagram", "ER diagram",
  "visualise the system", "map the services", "diagram this", or "generate mermaid".
argument-hint: "<system, flow, or data to draw>"
---

# Mermaid diagrams

Mermaid can draw twelve kinds of diagram. The default pull is toward `flowchart` for
everything, and most requests that arrive as "diagram this" are better served by something
else. Pick the type first.

## 1. Pick the type

| What the user has | Draw |
|---|---|
| Services, components, and how they connect | `flowchart` |
| Who calls whom, in order, over time | `sequenceDiagram` |
| One thing moving between statuses | `stateDiagram-v2` |
| Tables and their relationships | `erDiagram` |
| Types, fields, and inheritance | `classDiagram` |
| Steps a person goes through, with how each one feels | `journey` |
| Events on a calendar | `timeline` |
| Options scored on two axes | `quadrantChart` |
| Branches and merges | `gitGraph` |
| Amounts splitting and flowing between stages | `sankey-beta` |
| Loose ideas hanging off one topic | `mindmap` |
| System context for a non-technical reader | `C4Context` |

State the type you chose and the reason, in one line, before drawing. When two types fit,
name both and say why you picked one. When the request is too vague to choose, ask rather
than defaulting to `flowchart`.

Signals worth acting on: the words "status", "state", or "lifecycle" point at
`stateDiagram-v2` rather than a flowchart with status boxes. A schema question points at
`erDiagram`. "What happens when a user does X" points at `sequenceDiagram`. A comparison
of options points at `quadrantChart`.

## 2. Ground it in the code

Read the relevant files before drawing anything. A diagram that does not match the codebase
is worse than no diagram, because it carries authority it has not earned.

1. **Scope** the diagram: decide what the reader needs and leave the rest out.
2. **Read** the files and follow the actual data and control flow.
3. **Check** each node and each arrow against the code, and note which file confirms it.

Name things in domain terms. "Payment reconciliation worker" tells the reader more than
"Service B". Label every arrow with what crosses it.

## 3. Validate and save

Write the diagram to `{descriptive-name}.mmd` in the current directory, or ask where it
should go, then validate it:

```bash
mmdc -i <file>.mmd -o <file>.svg -q
```

It prints nothing and exits 0 on success. On invalid syntax it exits 1 and prints a
`Parse error` with a line number, so check the exit code: a nonzero exit or a `Parse error`
on stderr means the diagram is invalid. Fix the error and re-run. Never hand over a diagram
that has not passed this check.

`mmdc` needs a real output path ending in `.svg`, `.png`, `.pdf`, or `.md`, so `/dev/null`
does not work. The `.svg` it writes is the preview; mention it, and delete it if the user
wanted only the source. To validate without leaving a preview, render to a temporary SVG
instead (`-o "$(mktemp -d)/check.svg"`); the exit code means the same thing.

If `mmdc` is missing, tell the user to run `npm install -g @mermaid-js/mermaid-cli` and
stop. Do not skip validation.

## 4. Report

Give the user four things:

1. The diagram source.
2. The path it was written to.
3. A short explanation of what it shows, brief enough to put on a slide.
4. The file that confirms each component, so anyone can check the diagram against the code.
