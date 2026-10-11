# Audience vocabulary

Step 6 uses this file to decide whether a cold reader's finding on an established name can be waived.

**The descriptions in a vocabulary file are for fixing documents, and nothing else.** An entry means
a reader knows the name when they see it. It does not mean a document can use the name without
explaining it; step 6's replacement test decides that for each occurrence.

## Where the vocabulary lives

This skill ships no organisation's vocabulary. Read the first of these files that exists, with the
Read tool:

1. A vocabulary file the project names, for example in its `CLAUDE.md` or `AGENTS.md`.
2. `~/.config/cold-reader/vocabulary.md`.

If neither exists, no name has an entry: waive a name finding only when the term is standard for
the document's stated audience, and record the reason.

## What a vocabulary file holds

Start the file with a `Vocabulary version: <n>` line, and raise the number whenever an entry is added,
removed, or reworded. The report records that version, so a waiver can be traced to the entries it
rested on.

Group the entries under headings, and give each group the audience that knows its names:

```markdown
Vocabulary version: 1

## Applications and services

Audience: org-wide.

| Name | What it is |
|---|---|
| Billing service | Holds invoices and payment state for every customer account |
| CRM | Holds contract terms and the account owner for each customer |
```

A waiver applies only when the entry's audience covers the document's stated readership. An entry
scoped to one engineering group does not cover a document written for the whole company.

## When a name earns an entry

A name earns an entry when people in the stated audience know **exactly which thing it names**
without team-private context, and its description comes from the owning team's own material: a
repository README, an architecture page, or the service's published documentation.

Heavy use does not earn an entry. A name that appears constantly in chat is well used, but a reader
outside the owning team may still have no idea what it is. A description written by guessing from
the name does not count either: a wrong description here is worse than none, because authors copy
these descriptions into documents.

Two kinds of name never earn an entry:

- **Bare ticket identifiers and their project prefixes:** `PROJ-5415`, and the prefix `PROJ` on its
  own. Knowing that `PROJ` is a ticket project does not tell a reader what `PROJ-5415` is. Taxonomy
  category 1 applies: plain name first, identifier second.
- **Names coined inside the document under review.** A vocabulary file records established names only.

Named third-party products (Stripe, Snowflake, Datadog, Cloudflare) need no entry: a reader can look
them up.
