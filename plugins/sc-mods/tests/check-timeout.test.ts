import { expect, test } from 'claude-code/testing'
import { DRAWING, MERMAN_VERSION, captureTexts, fenced, ok, render } from './support'

const FENCE = fenced('flowchart TD\n  A-->B')

test('a timed-out check is asked again on a later render, with no notice', async ($, on) => {
  let checks = 0
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) {
      checks += 1
      if (checks === 1) return { deny: 'aborted: still running after 15000ms' }
      return { value: MERMAN_VERSION }
    }
    return { value: ok(DRAWING) }
  })
  const toasts: string[] = []
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const seen = captureTexts(on)

  await $.ui.render(render(FENCE, { requestId: 'first' }))
  await $.ui.render(render(FENCE, { requestId: 'second' }))

  expect(seen).toEqual([FENCE, '```text\n' + DRAWING + '\n```'])
  expect(checks).toBe(2)
  expect(toasts).toEqual([])
})
