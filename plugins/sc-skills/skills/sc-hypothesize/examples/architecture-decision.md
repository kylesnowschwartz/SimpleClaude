# Example: Session Cache Strategy

A worked example showing the ADI cycle applied to an architectural decision.

## Setup

**User**: `/sc-reason How should we handle session caching? We're seeing 200ms p99 on session lookups hitting Postgres directly.`

## Phase 1: Abduction

After reading the codebase to understand the current session handling:

```
## Hypotheses

### H1: Redis Session Store (conservative)
**Approach**: Replace Postgres session lookups with Redis. Store session data
as JSON in Redis with TTL matching session expiry.
**Assumptions**: Redis available in infrastructure, session data fits in memory,
eventual consistency acceptable for session reads.
**Scope**: All authenticated endpoints that read session state.

### H2: Application-Level LRU Cache (conservative)
**Approach**: In-process LRU cache (e.g., groupcache or similar) with short TTL.
Session data cached per-instance, Postgres remains source of truth.
**Assumptions**: Session data is read-heavy, cache hit rate >80%, stale reads
acceptable for 5-10 seconds.
**Scope**: Same endpoints, but simpler infrastructure.

### H3: Signed JWT with Session Claims (radical)
**Approach**: Eliminate session lookups entirely. Encode session state in a signed
JWT. Server validates signature without any database or cache hit.
**Assumptions**: Session data is small (<4KB), session revocation can tolerate
short delay (use denylist for immediate revocation only).
**Scope**: Changes auth flow significantly. Affects session creation, validation,
and revocation.
```

**User**: "These look good. H3 is interesting — I hadn't considered going stateless. Let's verify all three."

## Phase 2: Deduction

```
## Verification Results

### H1: Redis Session Store — PASS
**Logic**: Direct replacement of data store. Read path changes, write path
stays the same. Well-understood pattern.
**Constraints**: We already run Redis for job queues (confirmed in
docker-compose.yml). No new infrastructure.

### H2: Application-Level LRU Cache — PASS
**Logic**: Reduces DB load without new infrastructure. Trade-off is
stale data and cache coherence across instances.
**Constraints**: We run 4 app instances behind a load balancer.
Users hitting different instances will have inconsistent cache state.
Acceptable if TTL is short (5s).

### H3: Signed JWT — REFINE
**Issue**: Session revocation. Current code calls `session.revoke!` in
3 places (password change, admin force-logout, suspicious activity).
JWT can't be revoked without a denylist — which is itself a lookup.
**Refined**: JWT with Redis denylist for revocation. Eliminates the
common-path lookup (session read) while handling the rare-path lookup
(revocation check against a small denylist).
```

**User**: "Good catch on the revocation. The refined H3 still seems viable. Let's gather evidence."

## Phase 3: Induction

```
## Evidence

### H1: Redis Session Store
**Evidence**: Benchmarked Redis GET on our staging instance: 0.3ms p99.
Current Postgres session query: 180ms p99 (confirmed via pg_stat_statements).
Redis session store gems exist for our framework with active maintenance.
**Weakest link**: Haven't tested under our actual session data size
(~2KB avg). Benchmark was with simple key-value.
**Unknowns**: Memory pressure on Redis when sharing with job queues.
**Confidence floor**: Medium-High (internal benchmark, but simplified data)

### H2: Application-Level LRU Cache
**Evidence**: Analyzed access logs — 94% of requests are session reads,
6% are writes. Cache hit rate would be high. BUT: found a feature where
admin dashboard shows "active sessions" across all instances. An LRU
per-instance would break this — stale count, inconsistent data.
**Weakest link**: The admin dashboard feature. Would need separate handling.
**Unknowns**: How often admins actually use that dashboard feature.
**Confidence floor**: Medium (internal analysis found a real compatibility issue)

### H3: Signed JWT with Redis Denylist
**Evidence**: JWT signing/verification: <1ms (crypto benchmark).
Denylist would hold ~50 entries at any time (based on revocation rate
from logs). However: current session middleware touches `session.last_active`
on every request — a write-on-read pattern that JWT eliminates but also
breaks "last active" tracking. 12 places in code reference session.last_active.
**Weakest link**: The write-on-read pattern. Migrating 12 call sites is
significant. Alternative: separate "last seen" tracking via async event,
but that's scope creep.
**Unknowns**: Full blast radius of removing last_active from session model.
**Confidence floor**: Low-Medium (internal analysis found significant migration scope)
```

## Phase 4: Decision

```
## Comparison

|  | H1: Redis | H2: LRU Cache | H3: JWT + Denylist |
|---|---|---|---|
| **Latency improvement** | ~180ms -> ~0.3ms | ~180ms -> ~0.1ms (hit) | ~180ms -> ~1ms |
| **Evidence quality** | Benchmark (med-high) | Log analysis (medium) | Code analysis (low-med) |
| **Weakest link** | Simplified benchmark | Admin dashboard compat | 12-site migration |
| **New infrastructure** | None (Redis exists) | None | None (Redis exists) |
| **Reversibility** | Easy (swap store back) | Easy (remove cache) | Hard (JWT is structural) |
| **Risk** | Redis memory pressure | Stale reads, dashboard | Migration scope creep |

## Recommendation

H1 (Redis) is the strongest option. The evidence is the most direct (actual
benchmark vs code analysis), the risk is the most contained (memory pressure
is monitorable), and it's easily reversible. H2 has a real compatibility issue
with the admin dashboard. H3 solves the problem elegantly but the migration
scope is concerning — 12 call sites touching last_active is a lot of surface area
for a caching optimization.

If you want to explore H3 later as a broader auth modernization, that's a
separate decision with different scope.

## What would you like to go with?
```

**User**: "H1. Redis session store. The benchmark is convincing and we already have the infrastructure."

```
## Decision Record

**Problem**: 200ms p99 on session lookups hitting Postgres directly
**Chosen**: H1 — Redis Session Store
**Rationale**: Best evidence (actual benchmark), lowest risk, uses existing
infrastructure, easily reversible. 0.3ms p99 vs current 180ms.
**Rejected**:
  - H2 (LRU Cache): Admin dashboard compatibility issue, stale reads across instances
  - H3 (JWT + Denylist): Migration scope (12 last_active call sites) too large
    for what's fundamentally a caching optimization
**Revisit when**: If Redis memory becomes a concern, or if auth modernization
becomes a priority (revisit H3 at that point)
```

Saved to `.agent-history/reasoning/session-cache-strategy/`.
