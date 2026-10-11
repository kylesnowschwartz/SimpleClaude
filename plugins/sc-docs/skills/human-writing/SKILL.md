---
name: human-writing
description: Use when writing or editing a Slack message, email, pull request body, GitHub issue, Reddit post, agenda, or doc. Enforces a direct, warm, unfilled tone and removes AI tells. Always scores the final draft and runs a self-audit pass before delivery.
---

# Human Writing

Write like a person who respects the reader's time, which means being direct and warm without padding or chill. When rules conflict, pick whatever's clearer for the reader.

---

## Sound like a person

Mix contractions and full forms. *It's* and *it is*, *don't* and *do not*, in the same message. Uniformly contracted reads casual-AI; uniformly formal reads terms-of-service. Humans shift register mid-thought. Lean contracted for asides and conversational beats, and lean formal for the load-bearing claim or when precision matters.

Mix fragments and full sentences. "Works fine." and "The retry loop held up under the replay." in the same message. Pure fragments read performatively terse (the Hemingway-LARP tell) while pure full sentences read like a report, so humans drift between them.

Drop the subject in short messages. One-liners and two-line replies shed *I* and *we* naturally. "Checked the logs, nothing unusual" reads fine. Longer messages keep the subject. Systematically clipping subjects across a five-paragraph incident writeup reads as affected. In PR bodies and docs, keep subjects even for short sentences, because the reader is scanning for actors.

Start sentences with *And*, *But*, *So*. Vary their length. Short after long reads as human. AI writes uniform mid-length sentences and that's the tell.

Use shorthand where the audience expects it. FWIW, IIRC, LGTM, AFAIK. Spelling these out in engineering Slack is over-formal.

Let lists be messy. Some items are phrases, some are sentences, some have sub-points. Fine.

Keep acknowledgments brief. "Thanks! Fix is in PR #432." Skip *Great question*, *Absolutely*, *Hope that helps*.

## Casual register

Tendencies that fit Slack, DMs, and casual chat. Drop them for PR bodies, docs, and external email, which want cleaner register.

**Comma splices are fine.** Joining two independent clauses with just a comma is a spoken-register marker. "I checked the logs, nothing looked unusual, probably a flake." reads like a person. Use sparingly. One every few sentences is fine; one every sentence becomes its own tell.

**Let clauses run on when the thought is still building.** A period signals "new point", a comma signals "same point, still going". When a thought is genuinely unfinished, the comma is more honest than the period.

**Hedge as understatement, not evasion.** *Probably fine* is often stronger than *fine*. It signals "I've looked, I have a view, I'm not going to oversell it". *Not bad* is often high praise. *Might be a flake* often means "I think it's a flake". The work here is dry understatement carrying voice. Keep these.

The opposite pattern is weasel hedging: *could potentially possibly*, *it may be argued that*, *while specific details are limited*. Those are AI hedging and stay cut.

**First person is welcome.** Use *I* freely. Do not strip *I* for impersonality, do not rewrite "I think" into "it appears", do not prefer passive voice just to avoid the subject. When the writer is the actor, say so.

## State what exists

Describe behavior and dependencies. Let the reader judge importance.

- Bad: "FormRouter is the load-bearing component in a fault-tolerant pipeline."
- Good: "FormRouter sends form submissions to Identity. If it's down, submissions queue in S3 and retry hourly."

Drop filler qualifiers: *actually, obviously, essentially, simply*.

Hedge either for real uncertainty or as understatement, both are legitimate. *Probably*, *appears to*, *might*, *not bad* all earn their place. Cut the weasel hedges: *could potentially possibly*, *it may be argued that*, *while specific details are limited*. **One weasel per claim is already too many.** Understatement hedging has no cap, it's voice.

Let the reader count. Skip *For completeness*, *Here's why*, *The key thing is*, *Two things are happening*.

## Include what the reader needs

If leaving something out gives them the wrong picture, include it. Otherwise leave it out.

Someone asks "how do forms get to Identity" - they need the path and transport. Save the error handling strategy for when they ask about reliability.

If the question's ambiguous, ask.

## Name things concretely

Use specific names. *Source of truth* and *multi-team multi-quarter effort* are vague abstractions standing in for specifics.

Domain terms like *idempotent* or *eventual consistency* are fine when the audience knows them. Introduce system names with what they do on first mention.

- Bad: "Kronos is the source of truth."
- Good: "Kronos (the scheduling database) stores the canonical shift assignments."

Pick one name per thing. Stick with it.

## Say it once

State a point, reference it later. Rephrasing the same idea across paragraphs adds words without adding clarity. TL;DR sections are an exception. They exist so readers can skip the body.

## Keep docs factual

State safety warnings plainly. Skip color commentary like *a nice feature*, *requires care*, *no urgency*.

- Bad: "This endpoint requires care - it deletes without confirmation."
- Good: "This endpoint deletes without confirmation."

Tables and code speak for themselves. Add a one-line summary only when the reader needs orientation.

---

## Context: Slack

Tighter than docs. Link to the PR or doc for detail unless it's time-sensitive or the reader might lack access, then inline it.

For questions: scope the answer to what was asked.
For updates: what changed and who needs to act.

Use formatting for structure: parallel items, contrasts. Write prose when there's nothing to contrast and skip decoration that adds nothing.

When the User asks for a Slack message, output the raw message for copy/paste. Skip markdown formatting and commentary.

## Context: Email

Apply Slack tightness. Internal email: no courtesy padding. External email: minimal top-and-tail (e.g. "Hi Alex," / "Cheers,") and nothing more. No *I hope this finds you well*.

## Context: Pull request bodies

Write for the reviewer. Future-you will read the diff. The reviewer wants three things:

1. What the change does
2. Why it's needed
3. Anything non-obvious they should look at (trade-offs, follow-ups, risks)

**Do not editorialize after stating a fact.** If the first sentence says what the change does, the second sentence must not repeat that fact in grander terms.

- Bad: "Adds a `.ruby-version` to solve this dependency issue. Solves this class of problems for next time."
- Good: "Adds a `.ruby-version` to pin the Ruby version for CI."

Rule: if the next sentence is a meta-claim about what the previous sentence *means*, *accomplishes going forward*, or *represents*, cut it.

Other PR-body rules:

- Lead with the change. Motivation goes in a one-line "Why" underneath.
- Bullet lists for multi-part changes. One bullet per change.
- Link issues and prior discussion. No restating the ticket.
- Call out anything the reviewer would miss on a diff read: config changes, data migrations, new dependencies, feature flags.
- Skip *This PR does X*. Just state X.

## Context: GitHub issues

Reproduction-first. The maintainer reading this needs to reproduce the bug or understand the feature request before they can act, so lead with the facts that let them do that.

For bug reports, open with what happened, what you expected, and what you got. Include the version, the OS or runtime, a link to the commit or release, and the smallest sequence of steps that triggers it. Stack traces, error messages, and commands go in fenced code blocks so they stay copy-pasteable. Skip "Hi team" and skip the narrative wind-up about how you came across the bug.

For feature requests, describe the concrete scenario you hit before proposing the API or the fix. The proposal lands harder when the maintainer can already see the problem.

The title is a short imperative or a symptom statement: *Crash on empty config*, *Add `--dry-run` to `deploy`*. Not *Issue with deploy command (please help)*.

## Context: Reddit posts

Match the subreddit. Read a few top threads first and copy the register the regulars use, since the same content lands differently in r/programming, r/golang, and r/sysadmin.

Skip the broadcast openers. *Hey everyone!*, *Hope this is the right sub*, and *Long-time lurker, first-time poster* all read as marketing voice. Open with the question or the finding and put context in the body. Heavy formatting (bold every other line, three header levels in a 200-word post) reads the same way, so use plain paragraphs unless the structure earns the markup.

Quote-replies carry disagreement. Pull the line you're responding to into a `>` block and answer underneath. Do not editorialize after the quote with *This is exactly the kind of thinking that...*. The contrast does the work.

Sign-offs are bare or absent. Skip *Thanks in advance*, *Any help appreciated*, and the username flourish.

## Context: Meeting agendas

Keep them bare-bones, with no prose intros, no *Welcome!*, and no purpose statement unless someone asked for one.

Shape:

```
Heading - 5m
Heading2 - 10m
- sub point
- sub point
- sub point
```

Rules:

- Each top-level heading gets a duration.
- Sub-points are optional. Use them when the heading alone isn't enough for attendees to prep.
- No bold, no emojis, no section numbering.
- Total time at the bottom is fine if the meeting has a hard stop.

## Context: Docs

Reader-first reference. Each section opens with the claim a reader could ctrl-F for: the function name, the config key, the failure mode. Readers scan; they do not read straight through. Narrative wind-up belongs in a blog post.

Tables and code carry the load. Prose is the connective tissue between them. A paragraph that only describes what the next code block already shows is cuttable. State preconditions, behaviors, and failure modes plainly. Skip *this is a critical step*, *as you can see*, and *it's worth noting that*. The reader sees the step, the example, and the note without being told to.

Examples stay runnable and minimal. Strip imports and setup that aren't load-bearing for the point. When two pages cover overlapping ground, cross-link instead of restating, because two copies of the same paragraph drift out of sync.

---

## Em dashes

Default to a comma or period instead of an em-dash. The em-dash earns its place only in tight appositives and short inline definitions where parentheses would feel heavier.

When reaching for an em-dash, try a comma or period first. If the meaning holds, the em-dash was decoration.

## Write like a human

AI text has a recognizable accent. Avoid it.

Replace or cut:

| AI word                      | Instead                      |
| ---                          | ---                          |
| delve into                   | look at, examine             |
| navigate (metaphorical)      | handle, deal with            |
| leverage                     | use                          |
| landscape                    | (name the thing)             |
| robust                       | (say what makes it reliable) |
| pivotal, crucial, vital      | important, or cut            |
| foster, cultivate            | build, support               |
| multifaceted, nuanced        | (describe the actual facets) |
| harness, unleash, empower    | use, enable                  |
| tapestry, journey, embark    | (cut)                        |
| serves as, stands as         | is                           |
| underscores, highlights      | shows                        |
| a testament to               | shows, proves                |
| at its core                  | (start with the claim)       |
| it's important to note that  | (cut)                        |
| in today's [adjective] world | (cut)                        |

Let facts carry significance. *Pivotal role*, *reflects broader trends*, *marking a shift*. If it matters, the evidence shows it.

Replace adjective chains with specifics. *Fast, reliable, and scalable* is AI cadence.

- Bad: "The new pipeline is fast, reliable, and scalable."
- Good: "The new pipeline handles 10k events/sec and retries on failure."

Say what it is directly. *Not just X, but Y* adds emphasis without content.

- Bad: "This isn't just a refactor - it's a fundamental rethinking of how we handle state."
- Good: "This refactor moves state ownership from a global store to individual components."

## Structural patterns to avoid

**False agency.** Inanimate things don't perform human verbs. Name the actor.

| Bad | Fix |
|---|---|
| The complaint becomes a fix | The team fixed it that week |
| The decision emerges | The lead decided |
| The data tells us | The 2024 survey showed |
| The market rewards | Buyers pay for |
| The culture shifts | People changed how they review PRs |

If no specific person fits, use *you* and put the reader in the seat.

**Negative parallelism.** *Not X, but Y* / *It's not just X, it's Y* telegraphs a reveal the reader doesn't need. State Y. The comma-spliced version *X, not Y* is the same move with different punctuation; State Y still applies. The period-spliced version *I didn't do X. I did Y.* is the same move spread across two sentences; State Y still applies. Rare contrastive uses (e.g., short corrections like "go left, not right" in instructions) are fine.

- Bad: "I didn't change the methodology. I changed the runtime contract the stages run on."
- Good: "I changed the runtime contract the stages run on."

**Negative listing.** *Not X. Not Y. It's Z.* is the same problem in list form. State Z.

**Rhetorical Wh-openers in declarative sentences are banned.** *What, When, Where, Which, Who, Why, How* at the start of a *declarative* sentence is a crutch, a pseudo-question that delivers an ordinary point with extra ceremony. Restructure.

- Bad: "What makes this hard is the retry loop."
- Good: "The retry loop is the hard part."
- Bad: "What we're really doing here is migrating state ownership."
- Good: "This migrates state ownership."

Genuine questions starting with Wh- are fine. "What are the 11 steps?", "Why did the build fail?", "How does the retry loop work?" are normal English and stay.

**Rhetorical setups.** *What if...? Here's what I mean: Think about it:* announce insight instead of delivering it. Make the point.

**Narrator-from-a-distance.** *Nobody designed this. People tend to. This happens because.* Such statements float above the scene instead of landing in it. Put the reader in it or name the actor.

**Dramatic fragmentation.** *Noun. That's it. That's the thing.* Single-word fragments perform terseness instead of earning it. Use complete sentences and trust the content.

**Lazy extremes.** *Every, always, never, everyone, nobody.* Such absolutes claim a false authority the evidence does not support. Use specifics.

---

## Before delivery: score the draft

Rate 1–10 on each:

| Dimension      | Question                                      |
| ---            | ---                                           |
| Directness     | Statement or announcement?                    |
| Specificity    | Names and numbers, or vague claims?           |
| Rhythm         | Varied sentence length, or metronomic?        |
| Trust          | Respects the reader's intelligence?           |
| Density        | Anything cuttable?                            |

**Below 35/50: revise before delivering.** Do not include the score in the output.

## Self-audit pass

After the draft scores 35+ and before delivery, run a silent self-audit:

1. Ask: *What in this still sounds obviously AI-generated?*
2. Answer in 2–5 bullets (e.g. "paragraph 2 has a three-beat rhythm", "the closer editorializes", "*landscape* crept back in").
3. Revise against those bullets.
4. **Do not include the audit in the final output.** Deliver only the revised draft.

If the user explicitly asks to *see* the audit or the scoring, include them. Otherwise keep them internal.
