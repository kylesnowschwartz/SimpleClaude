# Context: Jira tickets

A ticket says what outcome the work must reach. The person who picks it up plans how. Write for a teammate who wasn't in the conversation that produced the ticket, not for an agent that will carry it out.

Use these sections, and leave out any that would be empty:

- **Why:** who is affected and what's missing today.
- **Outcome:** what is true when the work is done, in one or two sentences.
- **What we already know:** facts that change how the work is done, each with a link to its evidence. Leave out findings that don't change the work; link the full evidence instead.
- **Open questions:** what nobody knows yet, written as questions. Don't prescribe how to answer them.
- **Done when:** behaviour someone can observe, such as what a user sees or what arrives where. Don't list internal test names or file changes.
- **Depends on:** other tickets or decisions that change this one, and what each decides.
- **Links:** the repository, the PR, or the document. Link GitHub files on the default branch or link the PR itself, never a branch path that disappears after merge, and never a file on your own machine.

Don't include steps, task breakdowns, file-by-file changes, PR order, or test sizes. A ticket that plans the work for a senior engineer reads as distrust, and the plan is usually wrong once they look at the code.

Name every ticket by its title first and its ID second, inside the link text: `[Fix Duplicate Cards (PROJ-5412)](url)`.

Never change a ticket's scope while rewriting it. If the scope looks wrong, say so and ask before you change it.

Keep it to about 300 words. A ticket longer than that is usually carrying a plan or a findings report.
