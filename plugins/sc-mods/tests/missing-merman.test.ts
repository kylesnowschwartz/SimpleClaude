import { expect, test } from 'claude-code/testing'
import { captureTexts, fenced, render } from './support'

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
