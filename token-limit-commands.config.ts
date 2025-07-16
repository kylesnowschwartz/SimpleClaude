import { defineConfig } from 'token-limit'

export default defineConfig([
  // SimpleClaude Commands - Individual Files
  {
    name: 'sc-create Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-create.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-modify Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-modify.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-understand Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-understand.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-fix Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-fix.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-review Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/sc-review.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'TEMPLATE Command',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/TEMPLATE.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'Commands README',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/README.md',
    limit: '1k',
    showCost: true,
  },

  // Extras Commands - Individual Files
  {
    name: 'sc-eastereggs Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-eastereggs.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-pr-comments Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-pr-comments.md',
    limit: '1k',
    showCost: true,
  },
  {
    name: 'sc-setup Extra',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/sc-setup.md',
    limit: '1k',
    showCost: true,
  },
])

