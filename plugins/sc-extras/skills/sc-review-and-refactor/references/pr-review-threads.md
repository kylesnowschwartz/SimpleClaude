# Fetch and resolve human PR review threads

Use when: the user asks to read, list, or address the review comments people left on a GitHub pull request.

`gh pr view --comments` does not show inline review threads or whether they are resolved.
The skill's scripts query the GitHub GraphQL API for reviews, PR comments, and review threads with their resolved state.
SKILL.md's Scripts section shows both commands with the full script paths. Use those commands.

1. Show the open feedback with the tree command from SKILL.md's Scripts section.
   `--all` adds resolved threads, marked `[RESOLVED]`. Use it when the user wants history.
   The scripts fetch the first 100 reviews, comments, and threads, and the first 20 comments per thread.
2. To act on the threads, use the JSON command from SKILL.md's Scripts section. In its output,
   `threads[]` has `threadId`, `path`, `line`, `isOutdated`, and `comments[]` with `author` and `body`.
3. Group the open threads: bug fix, refactoring request, style, documentation, question, other.
   Questions and disagreements go to the user, not to a fix agent.
4. Group the threads by file. Start one subagent per file, in parallel. Each agent owns every thread in its file
   and edits only that file. Give it those threads (line and every comment) and the instructions in step 5.
5. Each agent:
   - States its reading of each request before it edits. If a request is unclear, it skips it and says so.
   - Changes only what the threads ask for, and only in its own file.
   - Reports, instead of editing, when a fix needs a change in another file.
   - Explains, instead of editing, when the request would break something or conflicts with CLAUDE.md.
   - Does not run tests or linters; they share one working tree, so you run them once in step 6.
   - Does not commit, reset, or restore files.
   - Reports per thread: the comment summary, the change, and status RESOLVED or NEEDS USER.
6. When all agents finish, read the combined diff yourself. Make any cross-file changes the agents reported.
   Run the linter and the full test suite once.
7. Do not reply to or resolve threads on GitHub unless the user asks. When asked, resolve one with:
   `gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -f id=<threadId>`

Stop / report: one entry per thread with location, request, change made or reason not made, and status;
then the test result. Leave the commit to the user.

Source: GitHub GraphQL API reference, `PullRequest.reviewThreads` and `resolveReviewThread` (docs.github.com/graphql).
