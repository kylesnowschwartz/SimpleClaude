# Context: Slack

Deliver per the SKILL.md delivery order: a Slack draft tool when one is available (see the MCP-drafts rule below for its formatting workaround), otherwise the draft text only in the chat. In chat output, include fenced code blocks only when they are part of the message.

Keep Slack messages shorter than documentation. Link to the PR or document for details. Include the required details in the message when the information is time-sensitive or the reader may lack access.

Don't repeat the ticket in the message. Link it, say the one thing that can't wait, and ask what only the reader can answer - with sufficient detail that they don't need the background. The evidence and the other questions stay on the ticket, and anything we already know doesn't get asked.

For questions, answer only what was asked.
For updates, state what changed and any required action.

One-line and two-line messages may omit *I* and *we*: "Checked the logs, nothing unusual." Keep the subject in longer messages.

Use engineering shorthand where the audience expects it: fwiw, iirc, lgtm, afaik. Keep these terms lowercase. Do not spell them out solely to sound formal.

Lists can mix phrases, sentences, and sub-points. Keep acknowledgments brief: "Thanks! The login timeout fix is in [PR #432](url)." Skip *Great question*, *Absolutely*, and *Hope that helps*. Use no more than one exclamation point per message.

Use a list when separate items need to be scanned. Use prose for a single point. Do not add formatting for decoration.

The destination decides the markup form, and the two forms do not overlap for links. A draft the user will copy into the Slack composer uses `[text](url)` links and `*bold*` with single asterisks; the composer converts those on paste, and `<url|text>` shows up literally. A message an agent sends or drafts through the API (including MCP draft tools) uses Slack's own `<url|text>` links; `[text](url)` markdown is not reliably converted on that path. Standard-markdown `**bold**` fails in the composer. When it is unclear which path the draft will take, ask, or default to composer form since the user pastes far more often than an agent posts.

The drafts path (MCP draft tools) carries no formatting at all. Slack's hosted MCP server strips every marker it advertises, including `[text](url)`, `<url|text>`, `*bold*`, `**bold**`, headers, and code (open bug, slackapi/slack-mcp-plugin#121). For a draft with any formatting, wrap the whole body in a triple-backtick fence: the fence bypasses the broken converter, so composer-form markup (`[text](url)`, `*bold*`) arrives intact inside a code block. The user copies the text out of the block, pastes it into the composer (which converts the markup on paste), and deletes the fenced draft. This is the default for MCP drafts. Fall back to unfenced plain text with bare URLs only when the user will send the draft as-is without a paste step; there, do not end a line with a URL, because a related converter bug can garble the following line.

Pasted text never creates real @-mentions; names arrive as plain text. Write the plain name and tell the user once, outside the draft, to retype the `@` in the composer if they want the person notified.

In a channel with several readers, address a question to the person who owns that decision by name, never to an unaddressed "you". Route by role: implementation and review calls go to the lead developers, ownership and staffing calls go to the manager. Separate questions to separate owners as separate numbered items.

For a message that argues from evidence toward a decision: open by connecting to the recipient's own words and saying what the message changes, put each observation as one bullet stating the behavior and its consequence (mechanism and counts go in the thread if anyone asks), compress background such as which change fixes what into a single pointer line, name any assumption outright ("I assume you meant..."), and end on the sender's direct recommendation. Do not end with offers of demos, reproductions, or further work; the reader will ask.

End a question on the question. Do not add a closer that repeats it or says the sender will fill something in.
