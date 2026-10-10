import type { On, ProcessRunResult, RenderElement } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'

const DRAWING = '┌───┐\n│ A │\n└───┘'
const MAX_DRAWINGS = 200

const ok = (stdout: string): ProcessRunResult => ({
  exitCode: 0,
  stdout,
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

const diagram = (index: number) => '```mermaid\nstateDiagram-v2\n  [*] --> S' + index + '\n```'

const render = (text: string, requestId: string) => ({
  surface: 'terminal' as const,
  component: 'AssistantMessage' as const,
  requestId,
  viewport: { columns: 100, rows: 40 },
  props: { text, isFirstOfReply: true },
})

type DrawCounter = { draws: number }

/** Stands for the engine: merman runs, and `failFirstDraw` makes the first draw reject. */
function standInEngine(on: On, { failFirstDraw = false } = {}): DrawCounter {
  const counter = { draws: 0 }
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: ok('merman-cli 0.8.0\n') }
    counter.draws += 1
    if (failFirstDraw && counter.draws === 1) return { deny: 'spawn failed' }
    return { value: ok(DRAWING) }
  })
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })
  return counter
}

const drawEach = async ($: Engine, indexes: number[]) => {
  for (const index of indexes) await $.ui.render(render(diagram(index), `diagram-${index}`))
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, offset) => from + offset)

test('past the cache size, the least recently used drawing goes first', async ($, on) => {
  const counter = standInEngine(on)
  await drawEach($, range(0, MAX_DRAWINGS - 1))
  expect(counter.draws).toBe(MAX_DRAWINGS)

  await drawEach($, [0])
  expect(counter.draws).toBe(MAX_DRAWINGS)

  await drawEach($, [MAX_DRAWINGS])
  expect(counter.draws).toBe(MAX_DRAWINGS + 1)

  await drawEach($, [0])
  expect(counter.draws).toBe(MAX_DRAWINGS + 1)

  await drawEach($, [1])
  expect(counter.draws).toBe(MAX_DRAWINGS + 2)
})

test('a rejected draw leaves the cache, so the next render draws it again', async ($, on) => {
  const counter = standInEngine(on, { failFirstDraw: true })
  await drawEach($, [0, 0])
  expect(counter.draws).toBe(2)
  await drawEach($, [0])
  expect(counter.draws).toBe(2)
})
