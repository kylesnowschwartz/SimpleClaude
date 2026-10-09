import type { RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const fenced = (source: string) => '```mermaid\n' + source + '\n```'

const render = (text: string, requestId: string) => ({
  surface: 'terminal' as const,
  component: 'AssistantMessage' as const,
  requestId,
  viewport: { columns: 100, rows: 40 },
  props: { text, isFirstOfReply: true },
})

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
  const seen: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    seen.push(e.props.text)
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })

  const first = fenced('flowchart TD\n  A-->B')
  const second = fenced('sequenceDiagram\n  A->>B: hi')
  await $.ui.render(render(first, 'one'))
  await $.ui.render(render(second, 'two'))

  expect(seen).toEqual([first, second])
  expect(argvs).toEqual([[MERMAN_PATH, '--version']])
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toContain('merman-cli could not run')
})
