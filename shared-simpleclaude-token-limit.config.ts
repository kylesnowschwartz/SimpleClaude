import { defineConfig } from 'token-limit'
import { readdirSync } from 'fs'
import { basename, join } from 'path'

const markdownFiles = readdirSync('shared/simpleclaude')
  .filter(file => file.endsWith('.md'))
  .map(file => join('shared/simpleclaude', file))

const individualConfigs = markdownFiles.map(file => ({
  name: basename(file, '.md'),
  model: 'claude-sonnet-4' as const,
  path: [file],
  limit: '1k' as const,
}))

const combinedConfigs = [
  {
    name: 'All New Structure Combined',
    model: 'claude-sonnet-4' as const,
    path: ['shared/simpleclaude/0*.md'],
    limit: '3k' as const,
  },
  {
    name: 'All Legacy Files Combined',
    model: 'claude-sonnet-4' as const,
    path: ['shared/simpleclaude/!(0*).md'],
    limit: '3k' as const,
  },
  {
    name: 'All Files Combined',
    model: 'claude-sonnet-4' as const,
    path: ['shared/simpleclaude/*.md'],
    limit: '5k' as const,
  },
]

export default defineConfig([
  ...individualConfigs,
  ...combinedConfigs,
])