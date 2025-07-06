**Purpose**: Smart modification router for code improvements and system changes

---

@include shared/simpleclaude/core-patterns.yml#Core_Philosophy

## Command Execution

Executes immediately. Natural language controls behavior. Transforms:
"$ARGUMENTS" into structured intent:

- What: [extracted-target]
- How: [detected-approach]
- When: [execution-mode]

Intelligently modifies, improves, refactors, migrates, or deploys code by
transforming natural language into structured modification directives.

### Semantic Transformations

```
"improve performance" →
  What: current codebase performance bottlenecks
  How: profiling, optimization, caching, algorithm improvements
  When: immediate with measurement validation

"refactor this messy function" →
  What: identified complex/problematic function
  How: extract methods, simplify logic, improve naming
  When: immediate with behavior preservation

"migrate to TypeScript --plan" →
  What: JavaScript codebase requiring type safety
  How: incremental migration strategy, type definitions
  When: planned mode - show migration steps first

"cleanup unused code" →
  What: dead code, unused dependencies, orphaned files
  How: static analysis, dependency graph, safe removal
  When: immediate with --safe mode implied
```

@include shared/simpleclaude/core-patterns.yml#Evidence_Standards

Examples:

- `/sc-modify improve performance` - Optimize code performance
- `/sc-modify refactor this messy function` - Clean up code structure
- `/sc-modify migrate to TypeScript --plan` - Show migration plan first
- `/sc-modify deploy to production --magic` - Deploy with UI dashboard
- `/sc-modify cleanup unused code` - Remove dead code and dependencies

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
automatically | Chooses optimal approach | Evidence-based modifications

**--watch:** Monitor changes continuously | Real-time impact tracking |
Auto-rollback on issues **--interactive:** Step-by-step modifications | Approval
at each stage | Explain changes **--safe:** Conservative mode | Preserve all
functionality | Extensive testing

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
