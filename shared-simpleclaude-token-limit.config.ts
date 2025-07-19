import { defineConfig } from 'token-limit'
import { readdirSync, statSync } from 'fs'
import { basename, join } from 'path'

// Helper function to recursively find all markdown files
function findMarkdownFiles(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...findMarkdownFiles(fullPath))
    } else if (entry.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

// Find all markdown files in .claude directory
const allMarkdownFiles = findMarkdownFiles('.claude')

// Create individual configs for each file with unique names
const individualConfigs = allMarkdownFiles.map(file => {
  const pathParts = file.split('/')
  const filename = basename(file, '.md')
  const parent = pathParts.slice(-2, -1)[0]
  const grandparent = pathParts.slice(-3, -2)[0]

  // Create unique name based on path structure
  let uniqueName = filename
  if (parent === 'simpleclaude' && grandparent === 'shared') {
    uniqueName = `${filename} (shared)`
  } else if (parent === 'simpleclaude' && grandparent === 'commands') {
    uniqueName = `${filename} (commands)`
  } else if (parent === 'extras') {
    uniqueName = `${filename} (extras)`
  } else {
    uniqueName = `${filename} (${parent})`
  }

  return {
    name: uniqueName,
    model: 'claude-sonnet-4' as const,
    path: [file],
    limit: '1k' as const,
  }
})

const combinedConfigs = [
  {
    name: 'Shared Framework Core (00-03)',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/shared/simpleclaude/0*.md'],
    limit: '3k' as const,
  },
  {
    name: 'Shared Framework Complete',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/shared/simpleclaude/*.md'],
    limit: '5k' as const,
  },
  {
    name: 'Core Commands',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/commands/simpleclaude/sc-*.md'],
    limit: '8k' as const,
  },
  {
    name: 'Extra Commands',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/commands/extras/*.md'],
    limit: '3k' as const,
  },
  {
    name: 'All Commands Combined',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/commands/**/*.md'],
    limit: '12k' as const,
  },
  {
    name: 'Complete SimpleClaude',
    model: 'claude-sonnet-4' as const,
    path: ['.claude/**/*.md'],
    limit: '20k' as const,
  },
]

export default defineConfig([
  ...individualConfigs,
  ...combinedConfigs,
])
