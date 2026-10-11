# Fetch and resolve human PR review threads

Use when: the user asks to read, list, or address the review comments people left on a GitHub pull request.

`gh pr view --comments` does not show inline review threads or whether they are resolved.
The scripts below query the GitHub GraphQL API for reviews, PR comments, and review threads with their resolved state.
`${CLAUDE_PLUGIN_ROOT}` is the plugin directory; if the shell does not set it, use the skill directory path that SKILL.md shows.

1. Show the open feedback as a tree:

       "${CLAUDE_PLUGIN_ROOT}/skills/sc-review-and-refactor/scripts/get-pr-comments.sh" [--all] [PR] \
         | ruby "${CLAUDE_PLUGIN_ROOT}/skills/sc-review-and-refactor/scripts/format-pr-tree.rb"

   PR forms: nothing (the current branch's PR), `123`, a PR URL, or `owner/repo 123`.
   `--all` must come first; it adds resolved threads, marked `[RESOLVED]`. Use it when the user wants history.
   The scripts fetch the first 100 reviews, comments, and threads, and the first 20 comments per thread.
2. To act on the threads, run `get-pr-comments.sh` without the formatter. It prints JSON:
   `threads[]` has `threadId`, `path`, `line`, `isOutdated`, and `comments[]` with `author` and `body`.
3. Group the open threads: bug fix, refactoring request, style, documentation, question, other.
   Questions and disagreements go to the user, not to a fix agent.
4. Start one subagent per thread, in parallel. Give each one only its thread: file, line, every comment in it,
   and the instructions in step 5. Threads that touch the same lines go to one agent, so edits do not collide.
5. Each agent:
   - States its reading of the request before it edits. If the request is unclear, it stops and says so.
   - Changes only what the thread asks for. No side quests, no edits to other agents' files.
   - Explains, instead of editing, when the request would break something or conflicts with CLAUDE.md.
   - Runs the relevant tests and linter.
   - Does not commit, reset, or restore files.
   - Reports: the comment summary, files changed, how the change answers it, and status RESOLVED or NEEDS USER.
6. When all agents finish, read the combined diff yourself. Run the full test suite once.
7. Do not reply to or resolve threads on GitHub unless the user asks. When asked, resolve one with:
   `gh api graphql -f query='mutation($id:ID!){resolveReviewThread(input:{threadId:$id}){thread{isResolved}}}' -f id=<threadId>`

Stop / report: one entry per thread with location, request, change made or reason not made, and status;
then the test result. Leave the commit to the user.

Source: GitHub GraphQL API reference, `PullRequest.reviewThreads` and `resolveReviewThread` (docs.github.com/graphql).
