---
name: sc-patterns
description: Detect codebase conventions and generate pattern briefs for AI-guided planning. This skill SHOULD be used when the user asks to "analyze patterns", "detect conventions", "what patterns does this codebase use", "pattern brief", "initialize pattern detection", or before major planning/implementation work.
argument-hint: "[analyze | brief <task> | init]"
---

# sc-patterns: Codebase Pattern Detection and Convention Guidance

**Purpose**: Extract high-confidence coding conventions from a codebase and make them available as planning constraints for AI agents.

## Mode Detection

Parse `$ARGUMENTS` to determine the mode:

| Input | Mode | Action |
|-------|------|--------|
| Empty or `analyze` | **Analyze** | Full pattern scan, cache results |
| `brief <task description>` | **Brief** | Task-scoped pattern constraints from cache |
| `init` | **Init** | Analyze + generate starter policy.yaml |
| `refresh` | **Refresh** | Force full re-analysis, ignore cache |

## Mode: Analyze (default)

Run the `sc-pattern-analyzer` agent to scan the codebase.

**Steps:**

1. Check if `.patterns/evidence.json` exists and is fresh:
   - Read `.patterns/.cache-meta.json` for the last-analyzed commit SHA
   - Compare to current HEAD SHA via `git rev-parse HEAD`
   - Check if working tree has changes in analyzed paths via `git status --porcelain`
   - If cache is fresh and working tree is clean in analyzed scopes: report cached results instead of re-scanning
2. If stale or missing: spawn `sc-pattern-analyzer` agent with the full analysis task
3. After analysis completes, display a human-readable summary:
   - Count of patterns by confidence band (enforceable / probable / weak / conflicted)
   - Top enforceable patterns with golden file references
   - Any "no pattern detected" scopes
   - Policy overrides applied (if `.patterns/policy.yaml` exists)

**Output example:**
```
## Pattern Analysis Complete

Analyzed 342 files (89 excluded) | Primary: Ruby/Rails

### Enforceable (8 patterns)
- Service objects use `def call` pattern (92% in app/services/)
- Controllers use before_action guards (88% in app/controllers/)
- Models use scopes over class methods (78% in app/models/)
  ...

### Probable (4 patterns)
- Repository pattern for DB access (65% in app/repositories/)
  ...

### Conflicted (2 areas)
- Error handling in services: 40% Result objects, 35% exceptions, 25% booleans
- Component styling: 55% CSS modules, 45% styled-components

### No Strong Pattern
- Serializer conventions in app/serializers/

Cache written to .patterns/evidence.json
Brief written to .patterns/brief.json
```

## Mode: Brief

Generate task-scoped pattern constraints from cached analysis.

**Steps:**

1. Read `.patterns/evidence.json` (run analyze first if missing/stale)
2. Parse the task description to identify relevant scopes:
   - Extract mentioned directories, file types, or entity types
   - Map entity types to directory scopes (e.g., "service" -> `app/services/`)
   - Include patterns from the framework/language scope
3. Filter patterns to only those relevant to the task's scope
4. Include only **enforceable** and **probable** confidence patterns
5. Read `.patterns/policy.yaml` for any overrides affecting the task scope
6. Output a focused pattern brief

**Output example for** `/sc-patterns brief add a new user registration service`:
```
## Pattern Brief: User Registration Service

Relevant scope: app/services/, app/models/, spec/services/

### Follow These Patterns

1. **Service objects use `def call`** (enforceable, 92%)
   See: app/services/create_user_service.rb:8-22

2. **Services accept a params hash** (enforceable, 88%)
   See: app/services/update_profile_service.rb:5-12

3. **Tests mirror source structure** (enforceable, 95%)
   Place test at: spec/services/register_user_service_spec.rb

### Avoid

- Do NOT use multiple public methods (legacy pattern in legacy_export_service.rb)
- Do NOT raise exceptions for business logic failures (per policy.yaml — use Result objects)

### No Consensus (your judgment)

- Error return format: 40% Result objects, 35% exceptions. Policy says use Result objects.
```

## Mode: Init

Run analysis and generate a starter `.patterns/policy.yaml` for human review.

**Steps:**

1. Run the full analyze flow
2. Generate `.patterns/policy.yaml` pre-populated with:
   - Detected enforceable patterns as `enforce:` entries (for human confirmation)
   - Detected conflicted areas as comments asking for human decision
   - Standard `exclude_paths` for the detected framework
   - Placeholder `boundaries` section
3. Tell the user to review and commit the policy file

**Output:**
```
## Pattern Detection Initialized

Analysis complete. Generated:
- .patterns/evidence.json (full analysis, gitignored)
- .patterns/brief.json (compact brief, gitignored)
- .patterns/policy.yaml (human overrides — review and commit this)

Next steps:
1. Review .patterns/policy.yaml — confirm, edit, or remove entries
2. Commit policy.yaml to your repo
3. Run /sc-patterns analyze after significant codebase changes
4. Use /sc-patterns brief <task> before planning new features
```

## Mode: Refresh

Force a full re-analysis regardless of cache state. Same as analyze but skips the freshness check.

## Cache Management

The `.patterns/` directory at project root stores analysis artifacts:

```
.patterns/
  evidence.json       # Full analysis — all patterns, all confidence levels
  brief.json          # Compact — enforceable + probable only, for prompt injection
  policy.yaml         # Human overrides — committed to repo
  .cache-meta.json    # Fingerprint: HEAD SHA, analyzed paths, detector version
```

**Gitignore guidance**: `evidence.json`, `brief.json`, and `.cache-meta.json` should be gitignored. `policy.yaml` should be committed. On first `init`, check if `.gitignore` includes `.patterns/` entries and suggest additions if missing.

## Integration Notes

This command writes files that `sc-plan` and `sc-work` can read. The integration is file-based, not import-based:

- `sc-plan`/`sc-work` check if `.patterns/brief.json` exists
- If it exists and is fresh, they read it for pattern context
- If missing, planning proceeds normally without pattern constraints
- No plugin dependency — just a file on disk

---

**User Request**: $ARGUMENTS
