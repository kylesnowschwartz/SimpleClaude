# SimpleClaude Todos

## SimpleClaude 2.0 Redesign - Implementation

Implement the new 4+1 command structure from conversations/2025-01-23-simpleclaude-redesign.md

### Core Redesign Tasks


1. **Implement sc-plan command**: "I need to think through something" - analyzes codebase/requirements, creates actionable roadmaps, manages ephemeral todo lifecycle, auto-primes context

2. **Implement sc-work command**: "I need to build/fix/modify something" - takes plan or direct request, spawns appropriate agents (create/modify/fix/test), manages implementation tracking, auto-runs validation

3. **Implement sc-explore command**: "I need to understand something" - research and analysis, domain understanding, codebase navigation, synthesizes findings

4. **Implement sc-review command**: "I need to verify quality/security/performance" - comprehensive analysis, security scanning, performance profiling, architecture assessment

5. **Implement sc-workflow command**: "I need structured, resumable task execution" - complete INIT → SELECT → REFINE → IMPLEMENT → COMMIT lifecycle with persistent artifacts and resumable tasks

6. **Update agent architecture**: Ensure all commands can spawn specialized agents in parallel while maintaining token efficiency through isolated contexts

7. **Migration strategy**: Create backward compatibility or clear migration path from current 5-command structure

8. **Update documentation**: Revise README, examples, and all references to reflect new intent-based command philosophy

9. **Version release**: Consider this SimpleClaude 1.0.0 due to breaking changes, update VERSION file and git tags accordingly
