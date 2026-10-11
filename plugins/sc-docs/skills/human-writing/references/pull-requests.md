# Context: Pull request bodies

Give the reviewer:

1. What the change does
2. Why it's needed
3. Trade-offs, follow-ups, or risks that are not clear from the diff

Keep subjects even in short sentences because the reviewer is scanning for actors.

Do not repeat a fact with a broader claim about its effect.

- Bad: "Adds a `.ruby-version` to solve this dependency issue. Solves this class of problems for next time."
- Good: "Adds a `.ruby-version` to pin the Ruby version for CI."

Other PR-body rules:

- Start with the change. Put the reason in a one-line "Why" section underneath.
- Bullet lists for multi-part changes. One bullet per change.
- Link issues and prior discussion. Do not restate the ticket.
- Name changes that may be easy to miss in the diff: config changes, data migrations, new dependencies, and feature flags.
- Carry one-off steps for the author's machine, or for a migration from an earlier setup, here; they stay out of READMEs and other persisted documents.
- Skip *This PR does X*. Just state X.
