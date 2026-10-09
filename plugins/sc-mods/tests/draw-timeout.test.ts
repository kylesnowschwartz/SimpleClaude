import type { ProcessRunResult, RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const DRAWING = '┌───┐\n│ A │\n└───┘'
const FENCE = '```mermaid\nflowchart TD\n  A-->B\n```'

const ok = (stdout: string): ProcessRunResult => ({
  exitCode: 0,
  stdout,
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

const render = (requestId: string) => ({
  surface: 'terminal' as const,
  component: 'AssistantMessage' as const,
  requestId,
  viewport: { columns: 100, rows: 40 },
  props: { text: FENCE, isFirstOfReply: true },
})

test('a timed-out draw is not cached, so a later render draws it', async ($, on) => {
  let draws = 0
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: ok('merman-cli 0.8.0\n') }
    draws += 1
    if (draws === 1) return { deny: 'aborted: still running after 5000ms' }
    return { value: ok(DRAWING) }
  })
  const seen: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    seen.push(e.props.text)
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })

  await $.ui.render(render('first'))
  await $.ui.render(render('second'))
  await $.ui.render(render('third'))

  expect(seen).toEqual([FENCE, '```text\n' + DRAWING + '\n```', '```text\n' + DRAWING + '\n```'])
  expect(draws).toBe(2)
})
