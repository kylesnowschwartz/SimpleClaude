---
name: human-writing
description: "MUST be used for any request to draft, write, compose, or reword text another person will read, including 'draft a message', 'draft a reply', 'draft a Slack message', 'write an email', 'draft a PR description', 'write a GitHub issue', 'write a Jira ticket', 'draft a card', 'draft an announcement', 'write release notes', 'draft an RFC', 'write a README'. Covers Slack, email, PR bodies, GitHub issues, Jira tickets, code review comments, bug reports, agendas, Reddit posts, and persisted project documents (READMEs, specs, RFCs, ADRs, design and planning docs, runbooks); for documents, use this skill for the drafting even when a documentation-writing skill also applies. Applies plain, literal writing with per-format conventions, then routes persisted project documents to the cold-reader review. Not for review-only requests on an existing document; use cold-reader alone for those."
---

# Human Writing

Write in plain high-school English. State the point directly.

---

## Start here: read the format reference

Before writing any draft, read the reference for its format with the Read tool. Do this for every new draft, including when this skill is already loaded from an earlier draft in the conversation: the sections below are shared across formats, and the reference holds the rules for this one.

You MUST read the whole reference file with the Read tool. You MUST NOT read it with `cat`, `grep`, `head`, `sed`, or any other shell command, or bundle it into a shell call with other commands. Each reference is under 40 lines, so the full file fits in context, and a filtered or combined shell read drops rules the draft needs.

| If the user asked for | Read |
|---|---|
| A Slack message | [`references/slack.md`](references/slack.md) |
| An email (internal or external) | [`references/email.md`](references/email.md) |
| A pull request body / description | [`references/pull-requests.md`](references/pull-requests.md) |
| A GitHub issue (bug report or feature request) | [`references/github-issues.md`](references/github-issues.md) |
| A Jira ticket (creating, rewriting, or rescoping one) | [`references/jira-tickets.md`](references/jira-tickets.md) |
| A Reddit post or reply | [`references/reddit.md`](references/reddit.md) |
| A meeting agenda | [`references/meeting-agendas.md`](references/meeting-agendas.md) |
| A persisted project document: docs, README, spec, RFC, ADR, design or discovery doc, planning doc, proposal, runbook, or reference material | [`references/docs.md`](references/docs.md) |

If no row matches, apply the rules in this file. Where a reference and the voice file disagree, follow the voice file.

---

## Natural phrasing

Use contractions, fragments, conjunction openers, and varied sentence lengths only when they fit the supplied text and the requested tone. Do not force variation to make the draft seem human.

## Core voice

- Use plain high-school English. Prefer common words.
- Join related facts into one sentence with connecting words (*before*, *because*, *which*, *so that*, *after*). Split into separate sentences only when the ideas are independent.
- Use literal language. State the mechanism or behavior without metaphor, idiom, analogy, or wordplay. Standard technical terms are fine.
- Use concrete names, verbs, and numbers. Introduce an unfamiliar system by saying what it does.
- Link every ticket key, pull request, issue, or dashboard page to its URL. A bare ID or "the PR" with no link is unfinished.
- State facts and dependencies without telling the reader how important they are.
- Include what the reader needs for an accurate picture. Leave out unrelated detail.
- Hedge only when the evidence is incomplete.
- Remove filler qualifiers such as *actually*, *obviously*, *essentially*, and *simply*.
- State each point once; do not restate it more grandly as a conclusion.
- Use *I* when the user is the actor. Do not invent stylistic quirks on the user's behalf.

## Content fidelity

For text written on the user's behalf, match their tone and phrasing without adding content. The user must have supplied or approved every claim, commitment, and opinion. If a required fact is missing, ask before drafting. If the user requests a best-effort draft, omit the missing fact. Never invent content or add editorial opinion.

Do not add:

- Commitments ("I'll add a note to CLAUDE.md", "I'll follow up next week")
- Apologies or fault-taking ("that one's on me")
- Opinions or editorial beyond the points discussed and agreed to by the user
- Promises of future work, even ones recommended earlier in the conversation.

## Personal voice (optional)

The user's voice file, loaded when this skill loads. Empty output means no voice file exists; skip this section.

!`cat ~/.config/human-writing/personal-voice.md 2>/dev/null`

Apply the voice file to every draft. Where it and a format reference disagree, follow the voice file. If the line above shows an unexecuted command instead of file contents, shell execution is disabled for skills; read `~/.config/human-writing/personal-voice.md` with the Read tool before drafting, and skip this section if the file does not exist.

To set up a voice file, copy [`templates/personal-voice.md`](templates/personal-voice.md) to that path and fill it in.

## Lint the draft

A Vale configuration ships with this skill and matches the fixed-phrase subset of Banned forms. Before delivering any draft, write it to a temporary Markdown file, then run:

```
vale --config="${CLAUDE_PLUGIN_ROOT}/skills/human-writing/assets/.vale.ini" --output=JSON "<draft.md>"
```

If `${CLAUDE_PLUGIN_ROOT}` is unset, resolve `assets/.vale.ini` relative to this SKILL.md's directory.

Triage the alerts by severity:

- **error:** the phrase is banned outright. Fix every one.
- **warning:** banned in a specific position (a message opener, a message closer) or relaxable by the personal voice file. Fix it unless the exemption applies.
- **suggestion:** banned only in its metaphorical or workplace sense. Keep matches with a literal or standard technical sense (an upstream branch, a coverage gap); fix the rest.

Alerts inside verbatim quotations or text the user asked to preserve exactly are exempt. Re-run after fixing until no unexempt alert remains, then deliver. The lint sees only fixed phrasings; the full Banned forms section still applies to everything it cannot match.

If the `vale` binary is missing, tell the user once to install it with `brew install vale` (<https://vale.sh/docs/install>), then check Banned forms by rereading the draft instead.

## Delivering the draft

Pick the destination in this order:

1. If the personal voice file names a delivery destination, use it.
2. If an available tool can save the text as a draft inside the destination medium (an email drafts folder, a Slack draft), save it there. Reply with one line saying where the draft is; do not repeat the draft text in the reply.
3. Otherwise, reply with the draft text only, so the user can copy and paste it: no delimiters, labels, intro, commentary, or questions before or after, and no output-style formatting such as a verdict line or closing offer. This overrides your output style. The reply begins with the draft's first word and ends with the last.

In every case the draft stays unsent and unpublished; sending requires an explicit instruction from the user.

If the user asks to see or adjust the draft in the conversation, output the draft text in the chat even when a destination tool exists.

When a format reference requires telling the user something the draft must not contain (for example, retyping an @-mention), put that note on one line after the draft, separated by a blank line, and add nothing else.

---

## Banned forms

`MUST` and `MUST NOT` are requirements. Ignore them only when the user explicitly asks. A ban may also be relaxed when the personal voice file names it in a *Rules to relax* section. These bans apply only to generated prose. Verbatim quotations, code, commands, error output, URLs, and text the user asks to preserve exactly are outside their scope. Literal technical senses are exempt: *upstream branch*, *coverage gap*, *robust to malformed input*.

- **Typographic dashes:** You MUST NOT use `—` or `–`. Use a comma, period, parentheses, colon, or rewrite the sentence. ASCII hyphens are fine.
- **Subculture and corporate markers:** You MUST NOT use metaphorical *load-bearing*, *lever*, *sits on*, *sits on top of*, *rests on*, *upstream*, or *downstream*. You MUST NOT use *crux*, *cruxy*, *update on X* when it means changing a view, loose *prior*, *evidence base*, *X is doing the work*, *the actual question is*, workplace *alignment*, workplace *bandwidth*, *circle back*, *close the loop*, *stakeholder*, *deliver value*, or *value-add*. You MUST NOT use game framing such as *side quest*. State the literal relationship or name the people involved.
- **Stock AI language:** You MUST NOT use *delve into*, metaphorical *navigate*, *leverage*, *landscape*, *gap*, *robust*, *pivotal*, *crucial*, *vital*, *foster*, *cultivate*, *multifaceted*, *nuanced*, *harness*, *unleash*, *empower*, *tapestry*, *journey*, *embark*, *serves as*, *stands as*, *underscores*, *highlights*, *a testament to*, *at its core*, *it's important to note that*, *context-aware*, *discover* when it means *find*, or *in today's [adjective] world*. Use a common word or state the specific fact.
- **Inflated significance:** You MUST delete inflated adjective chains or replace them with specific facts the user supplied. You MUST NOT follow a factual statement with a claim about what it represents or accomplishes.
- **False agency:** You MUST name the actor. Write what a person, team, survey, or buyer did instead of saying a complaint became a fix, a decision emerged, data spoke, the market rewarded, or culture shifted.
- **Negative parallelism:** You MUST NOT use *not X, but Y*, *X, not Y*, *I didn't do X. I did Y.*, or *Not X. Not Y. It's Z.* State Y directly. Short corrective instructions such as *go left, not right* are fine.
- **Rhetorical Wh-openers:** You MUST NOT use a *What*, *When*, *Where*, *Which*, *Who*, *Why*, or *How* opener as a rhetorical setup. Openers that state a time or a condition (*When the build finishes...*, *If the test fails...*) are fine, and so are genuine questions.
- **Rhetorical setups:** You MUST remove *What if...?*, *Here's what I mean:*, and *Think about it:* when they only announce the next point.
- **Distant narration:** You MUST name the actor instead of using claims such as *Nobody designed this*, *People tend to*, or *This happens because*.
- **Staccato declaratives:** You MUST NOT split one thought across a run of short same-shape sentences: *Four decisions shape what gets built. Each heading names who decides. The final section lists my defaults.* Join the facts into one sentence: *Four decisions need input from their owners before the design document is final.* Two consecutive short sentences are fine when each carries its own point.
- **Repeated "So" openers:** You MUST NOT open more than one sentence in a document with *So* as the conclusion connector: *So each set is a copy. So nothing compounds. So Security cannot trace it.* Vary the connector (*therefore* mid-sentence, *consequently*, *as a result*, *which means*) or restructure so the consequence follows without one.
- **Dramatic fragments:** You MUST NOT use sequences such as *Noun. That's it. That's the thing.* Use a complete sentence.
- **Subject-elided fragments:** You MUST NOT drop an opening *It's*, *This is*, *There's*, or *It* to sound punchy: *Worth calling out.*, *Not ideal.*, *A subtle bug.* Write the full sentence with its subject.
- **Verbless noun-phrase sentences:** You MUST NOT punctuate a bare noun phrase as a sentence, either as a standalone label (*Constraint as opportunity.*, *The button as a promise.*) or as an opening line posing as a sentence (*A small tool with a big job.*). Give it a verb. Headings, list labels, and captions are exempt.
- **Unsupported absolutes:** You MUST NOT use *every*, *always*, *never*, *everyone*, or *nobody* unless the evidence supports the claim.
- **Self-labeled tone:** You MUST NOT describe your own message's tone or motive: *no agenda*, *just curious*, *honest question*, *to be honest*, *genuinely*. Saying it signals the opposite.
- **Closing offers:** You MUST NOT end a draft with an offer or well-wish: *Happy to help*, *Let me know if you have questions*, *Hope that helps*. End when the content ends.
- **Validation openers:** You MUST NOT open with *You're right*, *You're absolutely right*, *Fair point*, *Good call*, or *Great question*. Respond to the point itself.
- **Document self-narration:** You MUST NOT describe the document to the reader, either as an opener (*This document covers...*) or mid-document as navigation (*Each heading below names...*, *The final section lists...*). State the point itself; headings do the navigating.
- **Triad summaries:** You MUST NOT use slogan-like or padded triads. Keep factual sets of three and phrase each item plainly.
- **Bare internal identifiers:** You MUST NOT use a ticket number, requirement or decision ID, codename, or API name as if it explains itself. Name the thing in plain language first, identifier second: *the catalog (PROJ-5411)*, never a bare *C1*, *D-05*, or *ListRules*. Platform forms that need the bare identifier, such as *Fixes #123* in a PR body, are exempt.
- **Process counts:** You MUST NOT report verification bookkeeping in reader-facing text: *proven twice*, review-round tallies, agent counts. State the claim once. Keep counts that are themselves the fact, such as *7 repos* or *zero alerts*.
- **Counted lead-ins:** You MUST NOT introduce a list by counting it or by saying how many of its items matter: *I hit seven problems, and five of them will show up on ordinary READMEs*, *Three changes:*. Let the list carry its own length, and refer to an item by what it is, never by its position (*the first and third*). Keep counts that are themselves the fact, such as *51 tests pass*.
- **Change narration:** You MUST NOT narrate a file's history inside the file: *updated after review*, *previously*, *no longer*, *as discussed*. State only what currently is. History belongs in commit messages and PR bodies.
