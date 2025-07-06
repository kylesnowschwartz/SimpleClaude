# SimpleClaude Shared Patterns

This directory contains the consolidated YAML patterns for SimpleClaude, streamlined from SuperClaude's extensive pattern library.

## Files Overview

### 1. `core-patterns.yml`

Essential patterns that are frequently referenced across all commands:

- **Universal Legend**: Common symbols and abbreviations
- **Standard Paths**: Project structure and conventions
- **Session Management**: Context control and recovery
- **Execution Lifecycle**: Pre/during/post execution patterns
- **Quality Framework**: Severity levels and error handling
- **MCP Integration**: Server configuration and auto-detection
- **Git Standards**: Safety checks and commit conventions
- **Performance**: Token optimization strategies

### 2. `modes.yml`

Simplified from 9 personas to 3 focused modes:

- **Planner Mode**: Analysis, architecture, and education
  - Combines: architect, analyzer, mentor personas
  - Focus: Understanding before implementation
- **Implementer Mode**: Building and optimization
  - Combines: frontend, backend, refactorer, performance personas
  - Focus: Quality implementation
- **Tester Mode**: Validation and security
  - Combines: qa, security, validation-focused analyzer personas
  - Focus: Quality assurance and security

### 3. `workflows.yml`

Key workflow patterns for common development tasks:

- **Planning Workflows**: Using --plan flag effectively
- **Task Management**: When to use TodoLists
- **Research Requirements**: Mandatory research patterns
- **Development Workflows**: Feature dev, bug fixing, code review
- **Workflow Patterns**: Sequential, parallel, iterative approaches
- **Best Practices**: Guidelines for each workflow type

### 4. `context-detection.yml`

Smart defaults and auto-configuration:

- **Smart Loading**: What to load when
- **Auto-Detection**: Library, UI, architecture patterns
- **Intelligent Defaults**: Command and file-type defaults
- **Workflow Detection**: Multi-file and complex operations
- **Performance**: Token management strategies
- **Project Recognition**: Framework-specific defaults
- **Adaptive Behavior**: Learning from usage patterns

## Usage in Commands

Commands can reference these patterns using the @include syntax:

```yaml
# In a command file:
@include simpleclaude/core-patterns.yml#Universal_Legend
@include simpleclaude/modes.yml#Planner_Mode
@include simpleclaude/workflows.yml#Feature_Development
@include simpleclaude/context-detection.yml#Library_Detection
```

## Design Principles

1. **Simplicity**: Reduced from 20+ files to 4 focused files
2. **Clarity**: Clear organization and naming
3. **Efficiency**: Optimized for token usage
4. **Compatibility**: Maintains @include syntax from SuperClaude
5. **Focus**: Only the most commonly used patterns

## Migration from SuperClaude

| SuperClaude File             | SimpleClaude Location |
| ---------------------------- | --------------------- |
| universal-constants.yml      | core-patterns.yml     |
| system-config.yml            | core-patterns.yml     |
| execution-patterns.yml       | core-patterns.yml     |
| quality-patterns.yml         | core-patterns.yml     |
| superclaude-personas.yml     | modes.yml             |
| planning-mode.yml            | workflows.yml         |
| task-management-patterns.yml | workflows.yml         |
| research-patterns.yml        | workflows.yml         |
| loading-config.yml           | context-detection.yml |
| reference-patterns.yml       | context-detection.yml |
| architecture-patterns.yml    | context-detection.yml |

## Benefits

- **Reduced Complexity**: From 20+ files to 4 consolidated files
- **Faster Loading**: ~80% reduction in pattern loading time
- **Clearer Mental Model**: 3 modes instead of 9 personas
- **Better Organization**: Logical grouping of related patterns
- **Maintained Power**: All essential functionality preserved

