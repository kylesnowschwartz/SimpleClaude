import { expect, test } from 'claude-code/testing'
import { DRAWING, MERMAN_VERSION, captureTexts, fenced, ok, render } from './support'

const FENCE = fenced('flowchart TD\n  A-->B')

test('a timed-out draw is not cached, so a later render draws it', async ($, on) => {
  let draws = 0
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: MERMAN_VERSION }
    draws += 1
    if (draws === 1) return { deny: 'aborted: still running after 5000ms' }
    return { value: ok(DRAWING) }
  })
  const seen = captureTexts(on)

  await $.ui.render(render(FENCE, { requestId: 'first' }))
  await $.ui.render(render(FENCE, { requestId: 'second' }))
  await $.ui.render(render(FENCE, { requestId: 'third' }))

  expect(seen).toEqual([FENCE, '```text\n' + DRAWING + '\n```', '```text\n' + DRAWING + '\n```'])
  expect(draws).toBe(2)
})
