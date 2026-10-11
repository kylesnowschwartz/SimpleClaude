# Context: Pull request bodies

Give the reviewer:

1. What the change does
2. Why it's needed
3. Trade-offs, follow-ups, or risks that are not clear from the diff

Keep subjects even in short sentences because the reviewer is scanning for actors.

Do not repeat a fact with a broader claim about its effect.

- Bad: "Adds a `.ruby-version` to solve this dependency issue. Solves this class of problems for next time."
- Good: "Adds a `.ruby-version` to pin the Ruby version for CI."

Write for a reviewer who reads the body in two minutes. Investigation detail, test transcripts, and tool versions slow that reader down; offer them in a comment or link to them instead.

Other PR-body rules:

- Open with what changed and why it matters, in one or two sentences.
- Bullet lists for multi-part changes. Give a change its own bullet when the reviewer must judge it; merge small mechanical changes into one bullet.
- Report testing as outcomes, three to five bullets. No tables or exact commands unless one is the point of the PR.
- After each round of edits, reread the whole body and cut what the reviewer no longer needs, because each round tends to add facts without removing any.
- Link issues and prior discussion. Do not restate the ticket.
- Name changes that may be easy to miss in the diff: config changes, data migrations, new dependencies, and feature flags.
- Carry one-off steps for the author's machine, or for a migration from an earlier setup, here; they stay out of READMEs and other persisted documents.
- Skip *This PR does X*. Just state X.
