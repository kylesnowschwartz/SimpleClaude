# Defect taxonomy

There are seven categories that must be triaged for cold-reader, 1-5 are blocking. Each defect you triage is scored, and the score determines how blocking that defect is. A category 6-7 finding that breaks understanding of a section the reader needs blocks, and a category 1-5 finding in a footnote can be waived with a stated reason.

The cold reader is the primary detector for the categories that need judgment: 1-4, plus agentless claims (6) and generic container words (7). Category 5, change and evidence narration, follows fixed phrase patterns mostly caught by the linter. The linter also carries light backstops for a few finite forms: category 1 bare identifiers, high-confidence agentless decisions such as "it was decided" (category 6), and unattributed-source claims such as "studies show". Do not rely on the cold reader alone to catch category 5.

## Why these defects matter

A project document exists so a reader can understand the work and act on it. The test is simple: can someone new read it and know what is being built, decided, or asked for with little other context. The seven categories are common ways writing fails that test, each with a before/after and why it matters.

Each category names a defect and its repair, several of those repairs remove words rather than adding them: renaming a coined term, deleting a methodology table, replacing a generic container with a specific noun. Explaining the unresolvable thing is the last of four options.

Clear writing uses simple, plain English and fewer words. Bigger words rarely make a point clearer. Analogy is harder to understand than just naming the thing as it is. When the plain version is missing, the reader cannot tell what the author means, and often the author has not decided yet. Naming things plainly is how a document shows the thinking is finished.

## 1. Bare identifier used as vocabulary

A ticket number, requirement ID, codename, or test ID doing the job of a noun.

**Why it matters:** The reader does not have your ticket system open, so a bare code means nothing to them. The same short code often names two different things in one document (C1-C6 as ticket codenames and as scoring criteria on the same page), so a reader who guesses is guessing wrong.

- Before: "C3 distributes what C1 compiles and activates the C2 exec-class switch."
- After: "The settings compiler (this ticket, PROJ-5415) distributes what the catalog (PROJ-5411) compiles, and turns on the pre-action check's blocking switch (PROJ-5412)."

Rule: plain name first, identifier second, unless the plain name is already on the page. Platform forms like "Fixes #123" are exempt.

## 2. Coined term not guessable cold

A term the author or the model invented, used as if established. Test: would a newcomer guess roughly the right meaning from the words alone? "Freshness bound" fails because a newcomer cannot guess it means the maximum cache age.

**Why it matters:** An invented name tells the reader nothing, and it can sound official while the author has not settled what the thing is. A plain name shows the idea is real and decided.

- Before: "the freshness bound", "the trust anchor", "the enrichment fabric"
- After: "the maximum cache age", "the signing key", "the address-lookup service"

Rename the thing to what it is; defining the bad name keeps the bad name. Keep a coined term only when it is defined at first use and used often enough to be worth learning.

## 3. Producer-side name

A field, key, or heading named for how its value was produced instead of what it tells the reader. Frequent in LLM-drafted schemas and specs.

**Why it matters:** The reader has to learn the production process before they can read the data. A name that says what the value means reads straight away.

- Before: `intake_outcome`, `model_output`, `scrape_result`
- After: `review_verdict`, `product_description`, `store_address`

Test: cover the value and ask what the name alone tells a reader. The correct name often hides in an adjacent comment or sentence. Frozen upstream schemas cannot be renamed; describe the field in one clause at first mention.

## 4. Methodology apparatus

Content about the framework that produced the document rather than the subject: analysis-framework tables, single-sentence "root definitions", weighted pseudo-scores ("round(0.525 x 9 + 1) = 6/10"), depth or template labels.

**Why it matters:** The reader needs the actual work, and a scoring worksheet describes the process instead. A self-score like "6/10" looks precise but rests on made-up weights, so the reader cannot check it or act on it.

- Before: a six-criteria weighted table computing "complexity 6/10"
- After: "This is a medium-sized change: one delivery pipeline with four components, and one required spike."

State the conclusion the apparatus was supposed to justify and delete the apparatus. If the conclusion cannot be stated without it, there is no conclusion yet.

## 5. Change or evidence narration

The file narrating its own history or its own verification: "updated after review", "previously", "no longer", "verified on a live install 2026-07-17", "confirmed during the spike". A file states what is; history and provenance live in commits, PRs, and/or a build log.

**Why it matters:** A document tells the reader what is true now. How it got here and how it was tested belong in commits, pull requests, and the build log. Mixed in, they make the reader sort current fact from past state.

- Before: "Pinning (remote endpoints) — renamed after review; verified on a live install 2026-07-17."
- After: "The broker allowlist names only the payments broker."

One exception: where the history or the testing IS the subject (a migration guide, a discovery document reporting its own survey), the document is stating current fact, and the finding is waived with that reason.

Prefer the shorter repair: a flat statement of what is true removes words, a qualification about when the evidence was gathered adds them.

## 6. Agentless claim

A sentence where nobody does the action.
BAD: configuration that waits, a decision that emerges, data that speaks.
GOOD: A person, team, or named system does the thing, and the sentence has to say which.

**Why it matters:** The reader cannot tell who is responsible or who to ask. A decision that "emerged" has no owner to question.

- Before: "Enforcement waits for spike-01."
- After: "The platform team turns enforcement on after the spike-01 tests pass."

Name the actor.

## 7. Generic container word

A generic noun (`envelope`, `payload`, `value`, `data`, `info`) where a specific noun exists.

**Why it matters:** A generic word makes the reader supply the specific meaning, and different readers supply different ones. Naming the content removes the guess.

- Before: "the event payload's `value`"
- After: "the event's `order_id`"

Name the content. When the container word is also a field name, this overlaps category 3; classify by the fix: rename the field (category 3) or reword the prose (category 7).
