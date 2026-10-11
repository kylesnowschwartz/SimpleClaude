# Review names

Use when: the user asks to review names, plans a rename pass, or reviews an API's design.

The method follows Feitelson's three steps for naming: choose the concepts the name must carry,
choose a word for each concept, then build the name from those words.

1. List the identifiers the change introduces or renames: types, functions, parameters, fields, files, config keys.
   Skip local variables with under ~5 lines of scope. For a whole-module review, list its public names.
2. For each name, write what it tells a reader who has not seen the implementation.
   If you need the body to understand the name, that is a finding.
3. Check the concepts: the name carries every concept a caller needs (what it is, its unit, its role)
   and no implementation detail (how it was computed or stored).
4. Check the words: grep for the term the codebase already uses for this concept. The existing domain word
   wins over a synonym. Count the variants; three names for one concept is a high-priority finding.
5. Check misleading names: a function that does more or less than its name says. Compare name and body.
6. Check the construction: order and casing match the neighbors, booleans read as predicates (`is_ready`, `has_items`),
   collections are plural, and functions with side effects are verbs.
   Count case styles and abbreviations (`usr` and `user`, `msg` and `message`); the majority form is the convention.
7. Flag generic words (`data`, `info`, `manager`, `handler`, `util`, `process`) and process nouns used for states.
8. Skip single-letter loop indexes and well-known abbreviations (`id`, `url`, `api`).
9. Propose one replacement per finding. Apply renames only with a tool that moves every reference (an LSP rename),
   following `refactor-safely.md`.

Stop / report: one line per finding with the current name, what it fails to tell the reader, and the proposed name,
ranked by how much the name misleads.

Source: Feitelson et al., "How Developers Choose Names", IEEE TSE 2022, arXiv:2103.07487; Alpern et al. 2024, arXiv:2402.10022.
