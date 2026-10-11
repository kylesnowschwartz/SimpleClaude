# Find code that can be deleted

Use when: the user asks what can be deleted, whether something is still used, or wants cleanup before a migration.

Dead code is code that is never run or never referenced. Treat a tool's list as candidates, not as findings.

1. Run the language's dead-code tool and the compiler or linter "unused" warnings:
   vulture (Python), knip or ts-prune (TypeScript), deadcode (Go), debride (Ruby). Collect candidates with locations.
2. Add what tools miss: files nothing imports, commented-out code blocks (not documentation comments),
   feature flags whose feature is gone, debug leftovers (`console.log`, `debugger`, `binding.pry`, `byebug`, stray `print`),
   and TODO, FIXME, or HACK comments older than 6 months (`git blame`).
3. For each candidate, grep for references a tool cannot see: string lookups, reflection, dependency injection,
   routes, serializers, templates, feature-flag names, and public APIs that other repositories use.
4. Do not flag entry points, framework hooks and lifecycle methods, library exports, test helpers the runner loads,
   side-effect imports, or logger calls.
5. Check production evidence where it exists: production coverage, logs, metrics, last-called dates.
   Zero calls over a release cycle means deletable. No data means "unknown", not dead.
6. Check git history. Code added in the last few weeks is probably not dead yet.
7. Classify each candidate:
   - Unreachable: safe to delete.
   - Unused export: delete when no outside consumer exists.
   - Orphaned feature: delete together with its tests, config, and docs.
   - Stale flag: remove the flag and the branch that no longer runs.
8. Give each a confidence: CERTAIN (no references, no dynamic use possible), LIKELY (dynamic use possible),
   or POSSIBLE (may be an entry point or public API).
9. When the user asks you to delete, make one commit per class, and run the full check after each.

Stop / report: candidates by class with location, evidence, and confidence; the "unknown" ones with the evidence
needed to decide; and the lines removed if you deleted anything.

Source: Romano, Vendome, Scanniello & Poshyvanyk, "A Multi-Study Investigation into Dead Code", IEEE TSE 2018; Fowler, *Refactoring*, 2nd ed., 2018 ("Dead Code" smell).
