// Draws diagrams with the real merman-cli through sc-mods' draw path.
// Run with `just test-mods-real`, which first runs the launcher so the cache holds merman-cli.
import { spawnSync } from 'node:child_process'
import { expect, test } from 'bun:test'
import { drawDiagram, type RunResult, type Runner } from '../../plugins/sc-mods/hooks/merman'

const MERMAN_CLI = new URL('../../plugins/sc-mods/bin/merman-cli', import.meta.url).pathname
const WIDTH = 80
const NARROW_WIDTH = 40

const FLOWCHART = 'flowchart TD\n  Plan[Plan] --> Build[Build]\n  Build --> Ship[Ship]'
const WIDE_FLOWCHART = 'flowchart LR\n  Plan --> Build --> Review --> Release --> Ship'
const SEQUENCE = 'sequenceDiagram\n  Alice->>Bob: Hello\n  Bob-->>Alice: Hi'
const INVALID = 'flowchart TD\n  A-->'

const runMerman: Runner = async (args, stdin): Promise<RunResult> => {
  const result = spawnSync(MERMAN_CLI, args, { input: stdin, encoding: 'utf8' })
  if (result.error !== undefined) throw result.error
  if (result.status === null) throw new Error(`merman-cli ended on signal ${result.signal}`)
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr }
}

// merman draws with box-drawing characters and the diagram's ASCII labels,
// each one terminal cell.
const widestLine = (drawing: string) => Math.max(...drawing.split('\n').map(line => Array.from(line).length))

test('a flowchart is drawn with its node labels, within the width', async () => {
  const drawing = await drawDiagram(runMerman, FLOWCHART, WIDTH)
  expect(drawing).toBeDefined()
  expect(drawing).toContain('Plan')
  expect(drawing).toContain('Ship')
  expect(widestLine(drawing!)).toBeLessThanOrEqual(WIDTH)
})

test('a left-to-right flowchart too wide for the width still fits', async () => {
  const drawing = await drawDiagram(runMerman, WIDE_FLOWCHART, NARROW_WIDTH)
  expect(drawing).toBeDefined()
  expect(drawing).toContain('Release')
  expect(widestLine(drawing!)).toBeLessThanOrEqual(NARROW_WIDTH)
})

test('a sequence diagram is drawn with its actors and messages', async () => {
  const drawing = await drawDiagram(runMerman, SEQUENCE, WIDTH)
  expect(drawing).toBeDefined()
  expect(drawing).toContain('Alice')
  expect(drawing).toContain('Hello')
  expect(widestLine(drawing!)).toBeLessThanOrEqual(WIDTH)
})

test('an invalid diagram is refused, so the reply keeps its source', async () => {
  expect(await drawDiagram(runMerman, INVALID, WIDTH)).toBeUndefined()
})
