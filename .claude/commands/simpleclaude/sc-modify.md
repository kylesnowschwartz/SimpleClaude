**Purpose**: Smart modification router for code improvements and system changes

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

@include shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms: "$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Intelligently modifies, improves, refactors, migrates, or deploys code by transforming natural language into structured modification directives.

### Semantic Transformations

```
"improve performance" →
  What: current codebase performance bottlenecks
  How: profiling, optimization, caching, algorithm improvements
  When: immediate with measurement validation
  Mode: [standard]

"carefully refactor the payment module" →
  What: payment module requiring careful refactoring
  How: backup first, extract methods, preserve behavior, extensive testing
  When: safe mode with validation at each step
  Mode: [safe, careful]
```

### Mode Detection & Adaptation

The command detects modes from natural language patterns:

**Safe Mode** (safe, careful, cautious, secure)

- Create backups before changes
- Validate each modification step
- Extensive testing after changes
- Rollback capability

**Quick Mode** (quick, fast, rapid, immediate)

- Minimal validation overhead
- Direct execution
- Focus on speed
- Basic testing only

**Watch Mode** (watch, monitor, track, continuous)

- Real-time file monitoring
- Continuous metric tracking
- Auto-rollback on issues
- Live feedback during changes

**Interactive Mode** (interactive, walkthrough, guide, step-by-step)

- User approval at each step
- Detailed explanations
- Option to modify approach
- Educational process

**Mode Blending**

```
"carefully monitor performance improvements" →
  Modes: [safe, watch]
  Result: Safe changes with real-time monitoring
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-modify improve performance` - Optimize code performance
- `/sc-modify carefully refactor the payment module` - Safe refactoring with backups
- `/sc-modify quickly fix the typo in README` - Immediate fix, minimal overhead
- `/sc-modify monitor while optimizing database queries` - Real-time performance tracking
- `/sc-modify walk me through upgrading React` - Interactive upgrade process

## Smart Detection & Routing

```yaml
Improve/Optimize: [improve, optimize, performance, faster, speed up, enhance]
  → Performance profiling, algorithm optimization, caching, query tuning

Refactor: [refactor, cleanup, clean up, reorganize, simplify, reduce complexity]
  → Code structure improvements, DRY principles, pattern extraction

Migrate: [migrate, upgrade, update, convert, move to, switch to]
  → Framework upgrades, language migrations, dependency updates, API versions

Deploy: [deploy, release, ship, publish, push to production]
  → Build process, environment configs, CI/CD, monitoring setup

Cleanup: [cleanup, clean, remove unused, delete dead code, prune]
  → Dead code removal, dependency pruning, file organization
```

**Intelligent Context Detection:** Analyzes request intent | Identifies scope automatically | Chooses optimal approach | Evidence-based modifications | Detects modes from natural language patterns

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Modify_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Performance:** Profile first → Identify bottlenecks → Optimize algorithms → Measure improvements

**Refactoring:** Analyze patterns → Extract common code → Simplify structure → Verify behavior

## Sub-Agent Delegation

```yaml
When: Large-scale refactoring | Multi-file migrations | Complex deployments
How: Analyzer agent → Multiple modification agents → Validation agent
Examples:
  - Codebase-wide refactor: Pattern analysis → Parallel modifications
  - Framework migration: Research agent → Staged migration agents
```

## Best Practices

- Always preserve existing functionality
- Create backups before major changes
- Test incrementally during modifications
- Provide rollback strategies
- Document all significant changes
