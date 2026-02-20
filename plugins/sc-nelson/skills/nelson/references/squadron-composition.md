# Squadron Composition Reference

Use this file to choose execution mode and team size.

## Mode Selection

Choose the first condition that matches.

1. If work is sequential, tightly coupled, or mostly in the same files, use `single-session`.
2. If work can be parallelized, use `agent-team`. This is the default for any multi-agent mission — creates teammates via TeamCreate with a shared task list, peer-to-peer messaging, and user-visible display.
3. If work is simple parallel discovery or throwaway research where coordination is not needed, use `subagents` as a lightweight fallback. Subagents report results to the admiral only and run as invisible background processes.

`agent-team` is the default multi-agent mode because teammates are visible to the user, coordinate independently via shared tasks, and support direct messaging. `subagents` should be the exception, not the rule.

## Decision Matrix

| Condition | Preferred Mode | Why |
| --- | --- | --- |
| Single critical path, low ambiguity | `single-session` | Lowest coordination overhead |
| Parallel work (default) | `agent-team` | Teammates with shared tasks, peer messaging, user visibility |
| High threat or high blast radius | `agent-team` + red-cell navigator | Adds explicit control points |
| Simple parallel discovery, no coordination needed | `subagents` | Lightweight fallback — background-only, report to admiral only |

## Team Sizing

- Small mission: `1 admiral + 2-3 captains`.
- Medium mission: `1 admiral + 4-5 captains`.
- Large mission: `1 admiral + 6-7 captains`.
- Add `1 red-cell navigator` at medium/high threat.
- Keep one admiral only.
- Squadron cap: 10 squadron-level agents (admiral, captains, red-cell navigator). Crew are additional — up to 4 per captain, governed by `references/crew-roles.md`.

## Role Guide

- `admiral`: Defines sailing orders, delegates, tracks dependencies, resolves blockers, final synthesis.
- `captain`: Commands a ship. Breaks task into sub-tasks, crews roles, coordinates crew, verifies outputs. Implements directly only when the task is atomic (0 crew).
  - Crew roles: Executive Officer (XO), Principal Warfare Officer (PWO), Navigating Officer (NO), Marine Engineering Officer (MEO), Weapon Engineering Officer (WEO), Logistics Officer (LOGO), Coxswain (COX). See `references/crew-roles.md` for role definitions and crewing rules.
- `red-cell navigator`: Challenges assumptions, validates outputs, checks rollback readiness.

## Worktree Isolation

`subagents` and `agent-team` modes use git worktrees for filesystem isolation. Each captain gets a dedicated worktree at `.worktrees/<slug>-hms-<ship>/` branched from the current branch. File conflicts become merge conflicts at consolidation time, not race conditions during execution.

`single-session` mode works directly in the main working tree — no worktrees needed.

## Anti-Patterns

See the Standing Orders table in SKILL.md for the full list of standing orders and known anti-patterns.
