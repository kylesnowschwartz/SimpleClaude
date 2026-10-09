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

test('a timed-out check is asked again on a later render, with no notice', async ($, on) => {
  let checks = 0
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) {
      checks += 1
      if (checks === 1) return { deny: 'aborted: still running after 15000ms' }
      return { value: ok('merman-cli 0.8.0\n') }
    }
    return { value: ok(DRAWING) }
  })
  const toasts: string[] = []
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const seen: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    seen.push(e.props.text)
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })

  await $.ui.render(render('first'))
  await $.ui.render(render('second'))

  expect(seen).toEqual([FENCE, '```text\n' + DRAWING + '\n```'])
  expect(checks).toBe(2)
  expect(toasts).toEqual([])
})
