import { defineConfig } from 'token-limit'

export default defineConfig([
  {
    name: 'SimpleClaude Commands',
    model: 'claude-sonnet-4',
    path: '.claude/commands/simpleclaude/*.md',
    limit: '50k',
  },
  {
    name: 'SimpleClaude Shared Patterns',
    model: 'claude-sonnet-4',
    path: '.claude/shared/simpleclaude/*.yml',
    limit: '20k',
  },
  {
    name: 'SimpleClaude Extras',
    model: 'claude-sonnet-4',
    path: '.claude/commands/extras/*.md',
    limit: '10k',
  },
  {
    name: 'SimpleClaude Documentation',
    model: 'claude-sonnet-4',
    path: ['.claude/shared/simpleclaude/*.md', 'docs/*.md', 'README.md'],
    limit: '15k',
  },
])
