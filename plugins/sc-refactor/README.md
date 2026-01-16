# sc-refactor

Unified review, refactoring, and cleanup workflows with specialized analysis agents.

## Purpose

This plugin provides post-implementation validation workflows. Use it to:
- Review PRs with full context (ticket integration, CLAUDE.md compliance)
- Find dead code, duplication, and unnecessary abstractions
- Verify structural completeness after refactoring
- Run comprehensive codebase health checks

## What This Plugin Is NOT

- **Not a linter replacement** - Style/formatting is handled by ESLint, Rubocop, etc.
- **Not a test generator** - Use sc-test-runner for test execution
- **Not an architecture planner** - Use sc-code-architect for greenfield design
- **Not pre-work planning** - This is strictly for post-implementation validation

## Commands

| Command | Purpose |
|---------|---------|
| `/sc-refactor:sc-review-pr [PR#]` | Context-aware PR review with ticket integration |
| `/sc-refactor:sc-pr-comments [PR#]` | Fetch unresolved PR review comments |
| `/sc-refactor:sc-resolve-pr-parallel [PR#]` | Batch resolve all PR comments in parallel |
| `/sc-refactor:sc-cleanup [dir]` | Post-AI session cleanup (debug statements, duplicates) |
| `/sc-refactor:sc-audit [dir]` | Verify structural completeness (wiring, configs) |
| `/sc-refactor:sc-codebase-health [dir]` | Full codebase health analysis |

## Agents

| Agent | Focus |
|-------|-------|
| `sc-structural-reviewer` | Change completeness, orphaned code, dev artifacts |
| `sc-duplication-hunter` | Copy-paste, structural, logic duplication |
| `sc-abstraction-critic` | YAGNI violations, over-engineering |
| `sc-naming-auditor` | Convention violations, semantic drift |
| `sc-dead-code-detector` | Unreferenced exports, orphan files |
| `sc-test-organizer` | Test structure, missing tests |
| `sc-pr-comment-resolver` | Implement PR review comment changes |

Analysis agents are read-only. `sc-pr-comment-resolver` makes targeted code changes.

## Usage

### PR Review

```
/sc-refactor:sc-review-pr 42
```

Gathers PR metadata, linked ticket context, and CLAUDE.md guidelines, then runs parallel review agents.

### Post-AI Cleanup

```
/sc-refactor:sc-cleanup src/
```

Find debug statements, duplicate code, naming inconsistencies after AI coding sessions. Offers auto-fix.

### Structural Audit

```
/sc-refactor:sc-audit src/
```

Verify routes registered, ENV vars documented, migrations complete, exports updated, docs current.

### Codebase Health

```
/sc-refactor:sc-codebase-health src/
```

Runs all 6 agents in parallel, produces categorized report with quick wins and recommended refactors.

## Natural Language Triggers

The skill routes requests automatically:

- "Review my PR" -> sc-review-pr
- "Show PR comments" -> sc-pr-comments
- "Fix PR feedback" -> sc-resolve-pr-parallel
- "Clean up after AI session" -> sc-cleanup
- "Check structural completeness" -> sc-audit
- "Run a health check" -> sc-codebase-health
- "Find dead code" -> sc-dead-code-detector
- "Check for duplication" -> sc-duplication-hunter

## Version

1.0.0

## License

MIT
