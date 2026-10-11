---
name: cold-reader
description: "A document is done when a reader with no project context can understand it; this skill runs that check as a Vale lint plus a context-free reviewer pass and a scorecard. This skill SHOULD be used when reviewing, finalizing, or being asked to critique a persisted project document: a spec, blueprint, RFC, ADR, design or discovery document, research or solution document, proposal, planning doc, runbook, README, or Jira ticket. It SHOULD also be used when the user asks whether a document makes sense to someone new, or asks for a jargon or clarity check. Do NOT invoke while a draft is still being written; the human-writing skill invokes this skill once a persisted project document draft is complete. Do NOT use on Slack messages, emails, code review comments, commit messages, pull request descriptions, or any text that is not a persisted document."
---

# Cold Reader

A document is done when a reader with no project context can understand it. This skill checks that in two stages. A Vale lint catches the defect families a fresh reader resolves without friction and therefore never reports as confusing: change narration, evidence narration, and unattributed-source claims, plus light checks for bare ticket codes and agentless decisions ("it was decided"). A cold-reader review then catches the defects that need judgment: coined terms, producer-side names, methodology worksheets, identifiers standing in for vocabulary, claims with no actor, and generic or placeholder nouns used where a specific name exists. The lint runs first because it is cheap and deterministic, and it targets exactly the families the cold reader is known to miss. The two stages overlap on purpose at the edges: the cold reader is also asked for change and evidence narration and for claims with no actor, which the lint matches too, because the lint only hits fixed phrasings and a semantic variant slips past it. Deduplicate when you combine the outputs, keeping the lint's location and the reader's reasoning.

This is a comprehension gate and nothing else. It does not judge tone, vocabulary, or house style, and it can pass a document that the writing standard would fail: every repair that resolves a defect by explaining it makes the document longer, and running this skill to a clean result on its own tends to inflate a document. Pair it with the prose-style guidance in the human-writing skill, which pushes the other way, and read step 7's repair order as the place the two meet.

The skill takes no audience argument. Stage 2 sends the reviewer the brief and the document and nothing else, so an audience supplied at invocation has nowhere to go, and reader knowledge injected into stage 2 would stop it being a cold read. An audience matters at triage in step 6, where a term standard for the document's stated readership can be discarded, and it can inform a second opinion after the cold read finishes. It never reaches the reviewer.

Use it on project documentation: specs, RFCs, ADRs, design docs, discovery and solution documents, proposals, and READMEs for new tools. Do not use it on chat messages or emails or ephemeral documents that won't be persisted.

## Stage 1: lint

1. **Run the lint.** The config ships with this skill. Run:

   ```bash
   vale --config="${CLAUDE_SKILL_DIR}/assets/.vale.ini" --output=JSON "<document.md>"
   ```

   The config lints `.md`, `.markdown`, and `.txt` files. Vale skips any other extension and reports `{}`, which looks like a clean pass, so copy a document in another format (a `.rst` or `.adoc` file, a ticket body pasted into the conversation) to a temporary `.md` file and lint the copy. If `${CLAUDE_SKILL_DIR}` is unset, resolve `assets/.vale.ini` relative to this SKILL.md's directory.

   If the `vale` binary is missing, stop and tell the user to install it with `brew install vale` (or see <https://vale.sh/docs/install>). Do not substitute a hand-rolled grep pass; the rule set only runs under Vale. JSON output maps each file to a list of alerts with `Check` (rule name), `Line`, `Span`, `Match`, `Message`, and `Severity`.

2. **Triage every alert.** The rules are precise but not perfect. Waive an alert when:
   - the match is a literal technical sense (an HTTP request payload, a physical envelope, "the appropriate values" where the values are named on the spot);
   - the match sits inside a verbatim quotation, code block content Vale missed, or text the document must preserve exactly;
   - the match is a platform-required form ("Fixes #123" in a PR body);
   - the history or evidence IS the document's subject (a migration guide saying "clients previously authenticated with API keys", a discovery document reporting what its own testing found);
   - an identifier-shaped term is real vocabulary (a product code like ABC-123); add it to the rule's `exceptions` list so the waiver persists.

   Severity sets the default: warnings expect this judgment call, suggestions are pointers. Every waiver needs a stated reason. Do not waive an alert only because the phrasing sounds fine to you; each rule marks a defect family the cold reader cannot catch, so an unwaived match is the only signal you get for it.

3. **Fix, then re-run.** For a document you are writing: fix every standing alert and re-run until Vale reports none, then move to stage 2. For someone else's document: keep the standing alerts for the combined report and move to stage 2.

## Stage 2: cold read and report

4. **Send the document to a cold reviewer.** Spawn one fresh subagent (for Claude Code, the Task/Agent tool with a general-purpose agent). Its prompt is [`references/reviewer-brief.md`](references/reviewer-brief.md) from the horizontal rule down, verbatim, then a separator line, then the complete document text. The lines above that rule are notes to you, including the brief's version number, and they do not go to the reviewer. Nothing else: no file paths, no project summary, no explanation of what the document is about. Any extra context breaks the test.

5. **Collect the two outputs and count them.** The reviewer returns a plain-language restatement of each section (with any guesses marked "assuming: ...") and a defect table (exact quote, location, why it is unresolvable, suggested fix). A section the reviewer could not restate is itself a defect, and so is a restatement that rests on assumptions the document never states.

   Take the section total from the reviewed document's own headings rather than from the reviewer's entries, because reviewers chunk a document differently from one another and a denominator that moves between passes cannot be compared across them. Count only the headings a reader sees: a search for lines starting with `#` also matches shell comments and example headings inside fenced code blocks, which inflates the denominator and makes every restatement line look worse than it is. Read the fences and subtract them, or count the rendered headings.

   Those headings are the slots, and every one of them gets exactly one outcome: restated cleanly, restated with assumptions, or unrestatable. Give each heading its outcome by reading which of the reviewer's entries covers it. One entry spanning several headings gives its outcome to each of them. Several entries landing on one heading give it the worst of them, where unrestatable beats carrying an "assuming: ..." and that beats clean. Count a partial marker ("UNRESTATABLE in part") as unrestatable.

   The three outcome counts then add up to the section total, and a line like "10 of 19 restated cleanly" is a claim a reader can check. Without the mapping the three counts come from the reviewer's chunks while the total comes from the document, so they do not add up and the scorecard only looks like it accounts for every section. Reviewers merge and split freely: one merged four numbered recipes into a single entry and split another section in two on the same document.

   Tally the defect table separately by counting its rows. Do not ask the reviewer for any of these numbers; count them yourself. The brief carries a version, and any change to its wording bumps that version, because a reviewer given different instructions detects different things. Hold one brief version for the whole of a single document's repair loop and record it in the report, so a scorecard is always compared against another built with the same instrument.

   The reviewer marks each defect row "blocked my restatement: yes/no". That is the one severity signal it can give without being taught the taxonomy, since it wrote the restatements and knows which findings stopped it. Treat it as evidence of reader impact rather than as a category: the taxonomy call in step 6 is yours, and a row marked no can still be a blocking defect.

6. **Triage with the taxonomy.** Classify each defect using [`references/defect-taxonomy.md`](references/defect-taxonomy.md). Discard a finding only when the document really does define the term before first use, or the term is standard for the document's stated audience. Do not discard a finding because *you* know what the term means; you have context the reader does not.

   The audience half of that rule is narrower than it looks, and applying it broadly is what keeps a document failing. It covers a name the reader only has to **accept**. It does not cover a name the reader has to **reason with**, and there the reviewer's objection survives however well known the name is. Test every finding on a name by replacing the proper noun with "the named system":

   > Can the stated audience still evaluate the claim, decision, comparison, or requested action?

   - **Yes: the name is a label.** Discard the finding if the name has an entry in the audience vocabulary ([`references/audience-vocabulary.md`](references/audience-vocabulary.md) says where it lives) at a scope covering this document's audience. Record it as a waiver under step 8 rather than discarding it silently.
   - **No: the name carries an inferential step.** The audience waiver does not apply. The document must state what kind of fact the system holds, or what it is responsible for, at or before the claim. A one-clause description is usually the whole repair.

   Run the test per occurrence, not per term. The same system is a harmless label in one paragraph and carries the argument in the next, so no term earns a standing pass. "The billing service for invoice state, the CRM for contract terms" offered as proof that a single source of truth is wrong fails the test: a reader who recognises both names still cannot tell whether an invoice state and a contract term are the same kind of thing, so the comparison is uncheckable.

   The vocabulary file records what a name is; it never licenses leaving it out. Do not send it to the reviewer: audience knowledge in stage 2 hides the evidence this test needs.

   Triage supplies the last number: the reviewer has no taxonomy, so nothing before this step can say which defects block. Split your surviving defects into blocking (categories 1-5) and non-blocking (6-7), and pair those counts with the four you tallied in step 5 as the run's scorecard:

   ```text
   Sections: 12 (headings in the document)
   Restated cleanly: 7
   Restated with assumptions: 4
   Unrestatable: 1
   Words: 3,140 (3,090 at the previous pass)
   Defects: 35 surviving triage - 28 blocking, 7 non-blocking
     new this pass: 6 - 2 blocking
     fixed since the previous pass: 9
     newly waived with a reason: 3
     repeated rows mapped to a standing waiver: 7
     waivers refused as inferential dependencies: 2
   Open blocking defects after disposition: 18
   ```

   Every line is a number a reader can check by counting rows. Do not weight the lines, average them, or reduce them to a single rating: a score built from invented weights is itself a category 4 defect.

   The last line is the one step 7 ends on, and it is the only line that has to reach a value. It is the blocking count minus the two waiver lines (28 less 3 newly waived and 7 mapped to a standing waiver leaves 18), and the refused waivers are among those 18, because a refused waiver leaves its defect open. Keep the arithmetic visible: a scorecard whose lines do not reconcile is a set of invented numbers, which is the category 4 defect this skill exists to catch.

   The two waiver lines are what keep the open count honest. A recurring finding (a name the audience knows, a table the house template demands) gets one waiver with a reason, and every later phrasing of it maps to that waiver instead of being argued again. Without the mapped-rows line, re-arguing the same cluster every pass looks identical to a document that will not improve: the blocking total sits flat, and nothing on the page says why. With it, the standing waivers are visible and the open count falls.

   The word count is there because the repair step can only be judged against it. Every explanation added to resolve a defect makes the document longer, and the restatement test rewards that, so a document can climb toward a clean scorecard and away from being read. Watch the line move; do not aim at it. Cutting words is not the goal and a document that needs a definition should get one.

   The sub-counts under the defect line separate a pass that fixed things from a pass that moved them. A fix pass introduces its own defects: a rewrite that resolves a coined term while planting an unsupported claim is a net loss, and only the new-this-pass count shows it. You have both passes' tables in front of you, so mark each row rather than comparing totals.

   Read the scorecard coarsely. Two cold readers given the same document agree closely on which serious defects are there and disagree on the count: they split the document into different numbers of sections and draw the line on minor defects differently. The findings are the signal and the totals are the rough gauge, so only large movements between passes mean anything. The blocking count going from twenty to three is a result; twenty to seventeen is not.

   Expect the defect total to stay roughly flat across passes even when the document is improving, because resolving a coarse defect exposes finer ones underneath it. The restatement lines are the ones that move: unrestatable falling to zero is the result, and a total drifting from thirty-seven to thirty-two on its own says nothing.

7. **Fix or report.**

   Pick the repair before writing it. For each defect, take the first of these four that still leaves the reader what they need: delete the material, fold it into something the document already says, reword it plainly, or explain it. Explanation is the last option rather than the default. Roughly a third of the terms a reviewer cannot resolve sit in sentences that did not need to mention them, and there the repair is to cut the clause rather than define the term inside it. Explanation is right when the reader genuinely needs the fact: a document's central subject earns its definition.

   The restatement test cannot see this on its own, because adding explanation always makes a section easier to restate. A document can reach a clean scorecard and still be too long for anyone to finish, so the choice of repair is yours to make and not something the reviewer will flag.

   A deletion faces the same gate as every other repair. The next cold reader still has to restate the section, so material the reader still needed comes back as a defect rather than passing quietly.

   - For a document you are writing: fix every defect, then re-run the stage-1 lint. A rewrite introduces defects of its own, so the lint runs again over the sentences you just changed, and it is a gate rather than a note: while it reports standing alerts, fix those and re-run it before spending a reviewer. Only then re-run the cold read with a new fresh reviewer.

     Close every blocking defect the pass raises (taxonomy categories 1-5 by default; the taxonomy explains when reader impact overrides the default) one of two ways: fix it, or waive it with a stated reason. A waiver holds for the rest of the document's repair loop and a later reviewer does not reopen it, which is what makes the loop end. Each pass gives every blocker one of those two dispositions, so the set of open blockers only shrinks.

     Done when a pass raises no blocking defect that is still open. "Open" means raised and neither fixed nor waived, whether the reviewer found it this pass or an earlier one repeated it. A defect that persists across passes is never a *new* one, so a loop that waits for no new blocking defects can call a document done with a known blocker in it; a loop that instead waits for a fresh reviewer to stop raising anything at all may never finish, because each reviewer draws the line on basic vocabulary in a different place. Waive that kind of finding once, with the reason, and move on to step 8's waiver table, where the next pass can map to it. Re-deciding a recurring finding every pass is the common way this loop fails to end: the disposition is never recorded, so the blocking total never falls and the document looks stuck while it is actually improving. The disposition of the blockers decides when the document is done.
   - For someone else's document: report the triaged defect list with suggested fixes, with the standing lint alerts from stage 1 grouped by severity alongside. Do not silently rewrite their document.

8. **Write the report to a file.** The defect table is the fix list, and it is worth more than one conversation. Write it under the root of the project holding the reviewed document rather than the directory you happen to be working in. The safe default is `mkdir -p .agent-history/` and a file named `<YYYY-MM-DD>-cold-read-<document-slug>.md`. If the project or the user names a different home for agent-generated notes, use that instead. Wherever it lands, the report belongs outside version control: check that the project ignores the location, and tell the user to add it to their ignore rules if it does not.

   The file holds the whole run: the reviewed document's path, the scorecard from step 6, the stage-1 Vale alerts with the triage decision and reason for each, and the stage-2 restatement and triaged defect table. Write it for both kinds of run. When you made several passes, record the final one and the scorecard from each pass, so the trend is on the page.

   Open it with the run's provenance, because a scorecard means nothing without the instrument that produced it:

   ```text
   Document: path/to/reviewed-document.md
   Brief version: 2
   Vocabulary version: 1
   ```

   A waiver carries forward, and the report is where it lives. When you waive a finding with a stated reason and a later pass raises it again, record the waiver once and point subsequent passes at it rather than re-arguing it. Documents written to a house template tend to produce the same methodology-apparatus findings on every pass, and a waiver that stays on the page keeps the cost of the template visible without forcing a fresh decision each time.

   Give each waiver a short stable identifier and keep them in one table, so a later pass can map a finding to a decision instead of making it again:

   ```text
   ID  class                  scope        vocab  first raised
   W1  audience vocabulary    org-wide     v1     pass 1
       "Billing service", "CRM" as bare names in the inventory section.
       Listed vocabulary for this document's audience, used as labels only.
   W2  methodology apparatus  -            -      pass 1
       The complexity-scoring table the house discovery template requires.
   ```

   A waiver needs the class, the audience scope and vocabulary version where it rests on vocabulary, the pass that first raised it, the quoted material, and the reason. Reviewers rephrase the same objection freely: "ten system names carry the argument undescribed" and "eight-plus system names carry load with no explanation" are one finding. Map on the substance of the objection rather than its wording. Two findings that look alike but rest on different sentences are two findings; splitting them is the error the mapping has to avoid, and quoting the material in the waiver is what makes the split checkable.

   A waiver that step 6's replacement test refuses is not a waiver. If a later pass shows the name carrying an inferential step somewhere the earlier pass did not cover, that occurrence is an open blocking defect and the standing waiver does not reach it.

## How detection works

Three checks run across the two stages. The Vale rules match the defect families that follow fixed phrase patterns and that a fresh reader resolves without noticing. The restatement is the structural test: a reader without context cannot resolve a bare ticket code, a coined term defined nowhere, or a table that scores the document's own methodology, so these surface however they are phrased and without any banned-word list. The reviewer brief also lists the common failure classes, so the reviewer checks for those directly instead of relying on the restatement alone. The taxonomy exists for triage and fixes.

## Extending the rules

The bundled rules live in `assets/styles/ColdRead/`, one file per defect family. Team-specific identifier vocabulary belongs in `BareTicketId.yml`'s `exceptions` list; a new phrase family goes in its own rule file. Keep the set small and precise: a rule earns its place only when it catches a defect family the cold reader misses and follows a fixed phrase pattern a regex hits at high precision. Prose-style and AI-vocabulary concerns (tone, buzzwords, typography) belong in the human-writing skill rather than in this comprehension gate.

Organisational vocabulary is not a lint concern and does not belong here. The cold reader detects an unexplained internal name reliably, on every pass, so a rule for it fails the test above; and whether the name needs explaining depends on the claim around it, which a regex cannot read. The audience vocabulary ([`references/audience-vocabulary.md`](references/audience-vocabulary.md)) and step 6's replacement test own that decision.

When you do write a rule with `extends: conditional`, the `second` pattern must capture the term with a plain group. A non-capturing group there makes one match anywhere in the document suppress every `first` match for every term: the rule reports nothing and passes everything, and it looks like a clean document. `BareTicketId.yml` captures correctly. Any new conditional rule needs a fixture that proves it still fires.
