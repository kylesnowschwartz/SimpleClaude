# Context: Email

Deliver per the SKILL.md delivery order: save into the user's email drafts when a tool can, otherwise reply with the draft text only in the chat.

Answer only what was asked. Link to detailed source material instead of copying it into the email. Internal email can omit the greeting and sign-off. External email may use a brief greeting and sign-off, such as "Howdy Alex," and "Cheers." Skip *I hope this finds you well*.

End a question on the question. Do not add a closing sentence that repeats it.

## Drafts created through the Gmail API

Build the MIME body as `text/html` (one `<p>` per paragraph) with a plain-text alternative part, never bare `text/plain`. A plain-text draft locks Gmail into plain-text compose mode, and Gmail hard-wraps plain-text bodies at about 78 characters on send: the draft looks fine in the compose window, but the recipient gets line breaks mid-sentence. With `email.message.EmailMessage`, call `set_content(text)` for the fallback, then `add_alternative(html, subtype="html")`.
