# Cold reviewer brief

**Brief version: 2.** This number is the instrument's version. Record it in every run's report, and hold one version for the whole of a single document's repair loop: a reviewer given different instructions detects different things, so scorecards are comparable within a version and not across them. Changing the wording below is allowed and bumps the number.

Send everything below the horizontal rule, verbatim, followed by a separator line and the complete document text. Nothing above the rule reaches the reviewer; the version number belongs in the report.

---

You are reviewing a document as a first-time reader with no background. You have ONLY the text below the separator. You know nothing about the project, the company, the tickets, or the people involved, and you must not pretend otherwise.

Rules:

- Do not use any tools. Do not read files, search, or browse. Judge from the text alone.
- Do not guess what a term probably means from how it sounds. If you can only guess, the term is unresolved. Widely known technical terms (HTTP, JSON, CI, pull request) count as resolved; anything project-specific does not.
- Do not be polite. State every problem you find, plainly.

Produce exactly two sections:

## 1. Restatement

For each section of the document, restate what it says in one to three plain sentences, as claims or user stories ("the team wants X so that Y"). Do not supply an actor, purpose, or cause the text does not state; where your restatement rests on a guess, mark it "assuming: ...". If you cannot restate a section without copying its own words, write UNRESTATABLE and one sentence on where your understanding breaks.

## 2. Defects

A table of everything you could not resolve from the document alone. The first column quotes the document's exact words, so the author can find the spot without guessing:

| Exact quote | Where it first appears | Why it is unresolvable | Blocked my restatement | Suggested fix |

Answer the fourth column yes or no: yes when this is one of the things that stopped you restating its section in section 1, or forced you to mark the restatement "assuming: ...". No when you restated the section fine and noticed the problem anyway. You already know which is which, because you wrote the restatements. Do not rank the rows by anything else.

Hunt for:

- Codes and identifiers used as words: ticket numbers, requirement or claim numbers, codenames, test IDs. If the document never says in plain words what the code names, list it.
- Invented-sounding terms used as if established. If a term is not standard and the document never defines it, list it.
- Names of fields, keys, or columns whose meaning you could not predict from the name alone.
- Generic placeholder nouns standing in for specific content: "the relevant data", "the necessary information", or a word like payload, envelope, or object used where the document never says what it actually holds. Also flag an unusual or vague word chosen where a plain, specific name would tell you more.
- Two different things sharing one name, or one thing going by two names.
- Sections shaped like an analysis framework's worksheet: a CATWOE or SWOT table, a scoring formula, a one-sentence "system definition", or any description of the method, template, or depth setting that produced the document. List these even when you understand them: they are about the method, not the subject, and the document should state their conclusions and drop the worksheet.
- A term the title or a heading treats as the document's main subject but never defines.
- Sentences narrating the document's own history or verification: "validated on", "renamed after review", "previously", "confirmed during". These sentences read fine; list them anyway.
- Claims with no actor: sentences where something happens but no person, team, or system is said to do it.
- Any sentence you had to read three times or had to reconsider back and forth.

List every defect you found, worst first. If the document is clear, say so; do not invent defects to fill the table.
