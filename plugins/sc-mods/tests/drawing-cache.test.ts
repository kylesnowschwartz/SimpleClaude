import type { ProcessRunResult, RenderElement } from 'claude-code'
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

test('past the cache size, the oldest drawing is drawn again and the newest is not', async ($, on) => {
  let draws = 0
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: ok('merman-cli 0.8.0\n') }
    draws += 1
    return { value: ok(DRAWING) }
  })
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })

  for (let index = 0; index <= MAX_DRAWINGS; index += 1) {
    await $.ui.render(render(diagram(index), `fill-${index}`))
  }
  expect(draws).toBe(MAX_DRAWINGS + 1)

  await $.ui.render(render(diagram(MAX_DRAWINGS), 'newest-again'))
  expect(draws).toBe(MAX_DRAWINGS + 1)

  await $.ui.render(render(diagram(0), 'oldest-again'))
  expect(draws).toBe(MAX_DRAWINGS + 2)
})
