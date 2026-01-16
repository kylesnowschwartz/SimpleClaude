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
| `/sc-refactor:sc-production-review [PR#]` | Gate-check PR before merge |
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

All agents are read-only (analysis only) and report findings with confidence scores.

## Usage

### PR Review

```
/sc-refactor:sc-review-pr 42
```

Gathers PR metadata, linked ticket context, and CLAUDE.md guidelines, then runs parallel review agents.

### Production Gate Check

```
/sc-refactor:sc-production-review 42
```

Multi-phase validation pipeline with finding validation. Only reports high-confidence, validated issues.

### Codebase Health

```
/sc-refactor:sc-codebase-health src/
```

Runs all 6 agents in parallel, produces categorized report with quick wins and recommended refactors.

## Natural Language Triggers

The skill routes requests automatically:

- "Review my PR" -> sc-review-pr workflow
- "Find dead code" -> sc-dead-code-detector
- "Check for duplication" -> sc-duplication-hunter
- "Simplify this codebase" -> sc-abstraction-critic
- "Run a health check" -> sc-codebase-health

## Version

0.1.0 (pre-release)

## License

MIT
