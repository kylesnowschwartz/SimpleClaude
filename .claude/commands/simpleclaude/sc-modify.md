# /sc-modify

Intelligent modification command that parses natural language requests and
routes to appropriate SuperClaude operations.

## Usage

```
/sc-modify <natural-language-request> [options]
```

## Examples

```
/sc-modify "improve performance of database queries"
/sc-modify "migrate authentication to TypeScript"
/sc-modify "deploy to production with zero downtime"
/sc-modify "refactor user module for better testability"
/sc-modify "clean up unused dependencies"
```

## Options

- `--dry-run`: Preview changes without applying them
- `--backup`: Create backup before modifications (auto-enabled for risky
  operations)
- `--scope <file|module|project>`: Limit modification scope
- `--force`: Skip safety confirmations (use with caution)
- `--parallel`: Enable parallel processing for multi-file operations

## Pattern Includes

### Refactoring Workflows

@include .claude/workflows.yml#refactoring

### Quality Validation

@include .claude/patterns/quality.yml#validation @include
.claude/patterns/quality.yml#testing

### Modification Modes

@include .claude/modes/improve.yml @include .claude/modes/migrate.yml @include
.claude/modes/refactor.yml

## Command Implementation

```typescript
interface ModificationRequest {
  type: "improve" | "migrate" | "cleanup" | "deploy" | "refactor";
  target: string;
  scope: "file" | "module" | "project";
  options: {
    dryRun: boolean;
    backup: boolean;
    force: boolean;
    parallel: boolean;
  };
}

class ModificationRouter {
  async parseRequest(input: string): Promise<ModificationRequest> {
    // Use TodoWrite to track analysis steps
    const tasks = [
      {
        id: "parse_intent",
        content: "Analyze natural language to determine modification type",
        status: "pending",
        priority: "high",
      },
      {
        id: "detect_scope",
        content: "Determine scope and target of modification",
        status: "pending",
        priority: "high",
      },
      {
        id: "assess_risk",
        content: "Evaluate risk level and required safety measures",
        status: "pending",
        priority: "high",
      },
    ];

    // Intent detection patterns
    const patterns = {
      improve: /improve|optimize|enhance|speed up|performance/i,
      migrate: /migrate|convert|upgrade|port|transition/i,
      cleanup: /clean|remove|delete|unused|redundant/i,
      deploy: /deploy|release|publish|ship|production/i,
      refactor: /refactor|restructure|reorganize|modularize/i,
    };

    // Scope detection
    const scopePatterns = {
      file: /file|component|module|class|function/i,
      module: /module|package|service|feature/i,
      project: /project|codebase|application|entire|all/i,
    };

    return this.buildRequest(input, patterns, scopePatterns);
  }

  async routeToCommand(request: ModificationRequest): Promise<void> {
    // Safety checks based on risk assessment
    if (this.isHighRisk(request) && !request.options.force) {
      await this.performSafetyChecks(request);
    }

    // Route to appropriate SuperClaude command
    switch (request.type) {
      case "improve":
        return this.executeImprove(request);
      case "migrate":
        return this.executeMigrate(request);
      case "cleanup":
        return this.executeCleanup(request);
      case "deploy":
        return this.executeDeploy(request);
      case "refactor":
        return this.executeRefactor(request);
    }
  }

  private isHighRisk(request: ModificationRequest): boolean {
    // High risk: project-wide changes, deployments, deletions
    return (
      request.scope === "project" ||
      request.type === "deploy" ||
      (request.type === "cleanup" && request.target.includes("delete"))
    );
  }

  private async performSafetyChecks(
    request: ModificationRequest,
  ): Promise<void> {
    const checks = [
      {
        id: "backup_check",
        content: "Create backup of affected files",
        status: "pending",
        priority: "critical",
      },
      {
        id: "test_check",
        content: "Verify test coverage for affected code",
        status: "pending",
        priority: "high",
      },
      {
        id: "dependency_check",
        content: "Analyze impact on dependent modules",
        status: "pending",
        priority: "high",
      },
    ];

    // Execute safety checks with sub-agents
    await this.executeWithSubAgents(checks);
  }
}
```

## Routing Logic

### Improve Command

- **Triggers**: "improve", "optimize", "enhance", "speed up"
- **Sub-agents**: Performance Analyzer, Code Optimizer
- **Safety**: Benchmarks before/after, gradual rollout

### Migrate Command

- **Triggers**: "migrate", "convert", "upgrade", "port"
- **Sub-agents**: Migration Planner, Compatibility Checker
- **Safety**: Parallel old/new code, feature flags

### Cleanup Command

- **Triggers**: "clean", "remove", "delete", "unused"
- **Sub-agents**: Dependency Analyzer, Dead Code Detector
- **Safety**: Backup always, usage analysis first

### Deploy Command

- **Triggers**: "deploy", "release", "publish", "ship"
- **Sub-agents**: Deployment Validator, Rollback Planner
- **Safety**: Health checks, canary deployment

### Refactor Command

- **Triggers**: "refactor", "restructure", "reorganize"
- **Sub-agents**: Architecture Analyzer, Test Coverage Checker
- **Safety**: Incremental changes, test-driven

## Natural Language Processing

```typescript
class NaturalLanguageParser {
  parseModificationIntent(input: string): ModificationIntent {
    // Extract key components
    const components = {
      action: this.extractAction(input),
      target: this.extractTarget(input),
      constraints: this.extractConstraints(input),
      goals: this.extractGoals(input),
    };

    // Build structured intent
    return {
      type: this.mapActionToType(components.action),
      target: components.target,
      scope: this.inferScope(components.target),
      requirements: this.buildRequirements(components),
    };
  }

  private extractTarget(input: string): string {
    // Pattern matching for common targets
    const targetPatterns = [
      /(?:of|the|to|from)\s+(\w+[\w\s]*(?:module|service|component|file))/i,
      /(\w+\.(?:ts|js|tsx|jsx))/i,
      /(database|api|frontend|backend|authentication|user|payment)/i,
    ];

    for (const pattern of targetPatterns) {
      const match = input.match(pattern);
      if (match) return match[1];
    }

    return "codebase"; // Default to full scope
  }
}
```

## Safety Features

### Dry Run Mode

```typescript
class DryRunExecutor {
  async execute(request: ModificationRequest): Promise<DryRunReport> {
    const report = {
      affectedFiles: [],
      proposedChanges: [],
      riskAssessment: {},
      estimatedImpact: {},
    };

    // Analyze without modifying
    await this.analyzeImpact(request, report);
    await this.generateChangePreview(request, report);

    return report;
  }
}
```

### Backup System

```typescript
class BackupManager {
  async createBackup(scope: string): Promise<BackupInfo> {
    const timestamp = new Date().toISOString();
    const backupPath = `.claude/backups/${timestamp}`;

    // Use sub-agent for backup creation
    const backupAgent = await this.spawnBackupAgent();
    return await backupAgent.createBackup(scope, backupPath);
  }

  async restoreBackup(backupId: string): Promise<void> {
    // Restoration logic with verification
    await this.verifyBackupIntegrity(backupId);
    await this.performRestore(backupId);
  }
}
```

## Integration with Other Commands

### Command Chaining

```bash
# Analyze before modifying
/sc-analyze "performance bottlenecks" | /sc-modify "improve identified issues"

# Test after refactoring
/sc-modify "refactor auth module" && /sc-test "auth integration tests"
```

### Workflow Integration

```yaml
modification_workflow:
  steps:
    - analyze: Understand current state
    - plan: Create modification plan
    - backup: Save current state
    - modify: Apply changes incrementally
    - test: Verify modifications
    - deploy: Roll out changes
```

## Error Handling

```typescript
class ModificationErrorHandler {
  async handleError(error: Error, request: ModificationRequest): Promise<void> {
    if (error instanceof ModificationError) {
      // Attempt automatic rollback
      if (request.options.backup) {
        await this.rollbackToBackup(error.backupId);
      }

      // Provide detailed error report
      this.generateErrorReport(error, request);
    }

    // Spawn debugging agent for complex errors
    if (this.isComplexError(error)) {
      await this.spawnDebugAgent(error, request);
    }
  }
}
```

## Best Practices

1. **Always use dry-run for major changes**: Preview before applying
2. **Enable backups for risky operations**: Automatic for cleanup/deploy
3. **Start with smallest scope**: File → Module → Project
4. **Chain with analysis commands**: Understand before modifying
5. **Monitor with sub-agents**: Real-time modification tracking

## Examples of Advanced Usage

### Performance Improvement

```bash
/sc-modify "improve database query performance in user service" --dry-run
# Reviews proposed optimizations, then:
/sc-modify "improve database query performance in user service" --backup
```

### Safe Migration

```bash
/sc-modify "migrate authentication from JWT to OAuth2" --scope module --parallel
# Runs old and new auth in parallel with feature flags
```

### Intelligent Refactoring

```bash
/sc-modify "refactor payment module for better testability"
# Automatically splits monolithic code, adds interfaces, improves DI
```

## Sub-agent Coordination

The command automatically spawns specialized sub-agents:

- **Analysis Agent**: Pre-modification assessment
- **Safety Agent**: Risk evaluation and backup
- **Execution Agent**: Actual modification work
- **Validation Agent**: Post-modification verification
- **Rollback Agent**: Emergency restoration

Each agent reports progress through TodoWrite for real-time tracking.
