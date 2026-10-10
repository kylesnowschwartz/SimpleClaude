import { expect, test } from 'claude-code/testing'
import { captureTexts, failed, fenced, recordToasts, render } from './support'

const MERMAN_PATH = '/opt/merman/merman-cli'

test('a merman-cli that cannot run keeps every fence and is tried once', { options: { MERMAN_PATH } }, async ($, on) => {
  const argvs: (readonly string[])[] = []
  on('process.run', async (_$, e) => {
    argvs.push(e.argv)
    throw new Error('spawn ENOENT')
  })
  const toasts: string[] = []
  on('ui.toast', async (_$, e) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  const seen = captureTexts(on)

  const first = fenced('flowchart TD\n  A-->B')
  const second = fenced('sequenceDiagram\n  A->>B: hi')
  await $.ui.render(render(first, { requestId: 'one' }))
  await $.ui.render(render(second, { requestId: 'two' }))

  expect(seen).toEqual([first, second])
  expect(argvs).toEqual([[MERMAN_PATH, '--version']])
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toContain('merman-cli could not run')
})

test('a launcher that cannot provide merman-cli names its reason in the notice', async ($, on) => {
  const reason = 'merman-cli: downloading merman 0.8.0 needs curl, which is not on PATH'
  on('process.run', async () => ({ value: { ...failed(`${reason}\n`), exitCode: 127 } }))
  const toasts = recordToasts(on)
  const seen = captureTexts(on)

  const fence = fenced('flowchart TD\n  A-->B')
  await $.ui.render(render(fence))

  expect(seen).toEqual([fence])
  expect(toasts).toEqual([expect.stringContaining(`could not run (${reason})`)])
})
