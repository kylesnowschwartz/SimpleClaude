import type { On, UiCopyResult } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import { DRAWING, MERMAN_VERSION, captureTexts, fenced, ok, recordToasts } from './support'

const SURFACES = ['terminal', 'desktop'] as const
type Surface = (typeof SURFACES)[number]

const REPLY = `Here is the flow:\n\n${fenced('flowchart TD\n  A-->B')}\n\nThat is all.`
const COPY_KEY = 'reply-copy:reply-1'

/** Stands for merman-cli: every diagram draws as DRAWING. */
function drawsEveryDiagram(on: On) {
  on('process.run', async (_$, e) => ({ value: e.argv.includes('--version') ? MERMAN_VERSION : ok(DRAWING) }))
}

/** Stands for the clipboard, answering `result`. Returns each text copied. */
function recordCopies(on: On, result: UiCopyResult = { isCopied: true }): string[] {
  const copied: string[] = []
  on('ui.copy', async (_$, e) => {
    copied.push(e.text)
    return { value: result }
  })
  return copied
}

const mountReply = ($: Engine, surface: Surface, text: string, extra: { isSummary?: true } = {}) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface,
    component: 'AssistantMessage',
    requestId: 'reply-1',
    viewport: { columns: 104, rows: 40 },
    props: { text, isFirstOfReply: true, ...extra },
  })

for (const surface of SURFACES) {
  test(`${surface}: a reply with a diagram shows the drawing and one copy button`, async ($, on) => {
    drawsEveryDiagram(on)
    const engineTexts = captureTexts(on)
    const reply = await mountReply($, surface, REPLY)

    expect(engineTexts).toEqual(['Here is the flow:\n\n```text\n' + DRAWING + '\n```\n\nThat is all.'])
    const buttons = await reply.findAll({ type: 'Button' })
    expect(buttons.map(button => button.key)).toEqual([COPY_KEY])
    expect(buttons[0]?.props).toMatchObject({ label: '⧉ copy', dimColor: true })
  })

  test(`${surface}: the copy button copies the reply's markdown, not its drawing`, async ($, on) => {
    drawsEveryDiagram(on)
    captureTexts(on)
    const copied = recordCopies(on)
    const toasts = recordToasts(on)
    const reply = await mountReply($, surface, REPLY)

    await reply.press({ key: COPY_KEY })
    expect(copied).toEqual([REPLY])
    expect(toasts).toEqual([`Copied ${REPLY.length} characters`])
  })

  test(`${surface}: a copy that does not take toasts the reason`, async ($, on) => {
    captureTexts(on)
    recordCopies(on, { isCopied: false, reason: 'no-clipboard' })
    const toasts = recordToasts(on)
    const reply = await mountReply($, surface, 'Plain words.')

    await reply.press({ key: COPY_KEY })
    expect(toasts).toEqual(['Copy failed: no-clipboard'])
  })

  test(`${surface}: a summary block has no copy button`, async ($, on) => {
    captureTexts(on)
    const reply = await mountReply($, surface, 'Read three files.', { isSummary: true })
    expect(await reply.findAll({ type: 'Button' })).toEqual([])
  })
}
