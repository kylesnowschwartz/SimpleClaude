**Purpose**: Smart modification router for code improvements and system changes

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy @include
shared/simpleclaude/mode-detection.yml

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]
- Mode: [detected-modes]

Intelligently modifies, improves, refactors, migrates, or deploys code by
transforming natural language into structured modification directives.

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

"quickly fix the typo" →
  What: identified typo in codebase
  How: immediate correction, minimal validation
  When: quick execution mode
  Mode: [quick]

"monitor while optimizing performance" →
  What: performance optimization with continuous monitoring
  How: profile, optimize, track metrics in real-time
  When: watch mode with continuous feedback
  Mode: [watch]

"walk me through migrating to TypeScript" →
  What: JavaScript to TypeScript migration
  How: step-by-step conversion with explanations
  When: interactive mode with user approval
  Mode: [interactive]
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

"quickly refactor with tests" →
  Modes: [quick]
  Result: Fast refactoring but maintains test coverage

"interactively migrate the database" →
  Modes: [interactive]
  Result: Step-by-step migration with confirmations
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-modify improve performance` - Optimize code performance
- `/sc-modify carefully refactor the payment module` - Safe refactoring with
  backups
- `/sc-modify quickly fix the typo in README` - Immediate fix, minimal overhead
- `/sc-modify monitor while optimizing database queries` - Real-time performance
  tracking
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

**Intelligent Context Detection:** Analyzes request intent | Identifies scope
automatically | Chooses optimal approach | Evidence-based modifications |
Detects modes from natural language patterns

@include shared/simpleclaude/core-patterns.yml#Task_Management

@include shared/simpleclaude/workflows.yml#Modify_Workflow

@include shared/simpleclaude/core-patterns.yml#Output_Organization

## Core Workflows

**Performance:** Profile first → Identify bottlenecks → Optimize algorithms →
Measure improvements

**Refactoring:** Analyze patterns → Extract common code → Simplify structure →
Verify behavior

**Migration:** Assess current state → Plan incremental steps → Execute safely →
Validate thoroughly

**Deployment:** Build artifacts → Configure environments → Execute deployment →
Monitor health

## Sub-Agent Delegation

```yaml
When: Large-scale refactoring | Multi-file migrations | Complex deployments
How: Analyzer agent → Multiple modification agents → Validation agent
Examples:
  - Codebase-wide refactor: Pattern analysis → Parallel modifications
  - Framework migration: Research agent → Staged migration agents
  - Multi-service deploy: Parallel deployment agents
```

## Safety & Validation

1. Always preserve existing functionality
2. Create backups before major changes
3. Test incrementally during modifications
4. Provide rollback strategies
5. Document all significant changes

## Best Practices

- Make minimal necessary changes
- Follow existing code conventions
- Maintain backward compatibility
- Add tests for new patterns
- Update documentation as needed
