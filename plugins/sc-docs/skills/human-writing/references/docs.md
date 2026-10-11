# Context: Documentation

Before drafting, send the user your best guess at four lines, filled in from the conversation, and wait for corrections:

```text
Reader:       who reads it, and how much time they have
Voice:        first person as the user, or neutral
Out of scope: what the document leaves out
Published:    where it will live, which decides whether a link works for the reader
```

A wrong reader, voice, or scope found after drafting means rewriting the whole document; correcting a line takes the user seconds.

A document published anywhere but the author's disk (Google Docs, Confluence, a wiki, a pull request) links only to hosted resources: public URLs, shared documents, or files published with it. It never links a local path, a file in an ignored directory such as `.agent-history/`, or a file on an unpushed branch, because no reader can open it, the author included. Before publishing, check every link and file reference in the document, and replace each local one with a hosted link or with one sentence saying what the evidence was.

After the draft is written and the HumanWriting lint is clean, invoke the cold-reader skill (`sc-docs:cold-reader`) on the same draft file before telling the user the document is done. Run one cold-reader pass, apply its repair order to the blocking defects, and re-run this skill's lint over the rewritten sentences; ask the user before further reviewer passes. Cold-reader owns comprehension; this file owns prose style. Deliver cold-reader's report and scorecard as normal conversation output; the draft-only delivery rule applies to the document itself. Only persisted project documents take this step; messages, emails, and other conversational formats are finished when this skill's lint is clean.

Open each section with the term a reader will search for, such as a function name, config key, or failure mode. State its behavior immediately. Skip introductions about the document or the reader.

Keep explicit subjects in short sentences so readers can identify each actor.

In a brief or proposal, keep a number only when removing it would change the argument. A live count from ongoing work ("8 laptops report today") is stale by the next reading and carries no weight the fact itself ("the pilot reports which add-ons run") does not.

State safety warnings directly. Write "This endpoint deletes without confirmation." Skip comments such as *a nice feature*, *requires care*, and *no urgency*.

Do not describe information that a table or code block already shows. Add prose only when the reader needs a precondition, behavior, failure mode, or brief orientation. Skip *this is a critical step*, *as you can see*, and *it's worth noting that*.

Keep examples runnable and minimal. Remove imports and setup code the example does not need. When two pages cover the same topic, link between them instead of maintaining duplicate instructions.

Steps that apply to one person's machine, or to a migration from an older arrangement, go in the pull request description or in chat and stay out of the persisted document.

## READMEs

Write a README for someone installing the project cold. Cover what the project is, how to install it, and its prerequisites. Add authentication or token setup, permissions, what ships (files, commands, skills), and cost or limits when the project has them. Before adding a section, ask whether a new team member installing this fresh would need it. If not, leave it out.

Write a README for fast skimmers. Put the table a reader looks for first, directly under its heading, with row and column labels that explain themselves. Put the explanation and assumptions under the table as short bullets. Prefer a table to a list for a set of rules. Keep sentences short.
