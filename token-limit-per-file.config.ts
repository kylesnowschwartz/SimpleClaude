import { defineConfig } from 'token-limit'

export default defineConfig([
  // SimpleClaude Commands - Individual Files
  {
    name: 'sc-create Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-create.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'sc-modify Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-modify.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'sc-understand Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-understand.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'sc-fix Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-fix.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'sc-review Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-review.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'TEMPLATE Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/TEMPLATE.md',
    limit: '10k',
    showCost: true,
  },
  {
    name: 'Commands README',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/README.md',
    limit: '5k',
    showCost: true,
  },

  // Extras Commands - Individual Files
  {
    name: 'sc-eastereggs Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-eastereggs.md',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'sc-pr-comments Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-pr-comments.md',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'sc-setup Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-setup.md',
    limit: '5k',
    showCost: true,
  },

  // Shared Files - Individual Files
  {
    name: 'Shared README',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/README.md',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Context Detection',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/context-detection.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Core Patterns',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/core-patterns.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Includes',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/includes.md',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Mode Detection',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/mode-detection.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Modes',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/modes.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Sub-agents',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/sub-agents.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Thinking Modes',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/thinking-modes.yml',
    limit: '5k',
    showCost: true,
  },
  {
    name: 'Workflows',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/workflows.yml',
    limit: '5k',
    showCost: true,
  },
])
