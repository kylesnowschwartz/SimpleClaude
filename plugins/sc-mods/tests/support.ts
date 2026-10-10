import type { On, ProcessRunResult, RenderElement } from 'claude-code'

export const DRAWING = '┌───┐\n│ A │\n└───┘'
export const MERMAN_VERSION = ok('merman-cli 0.8.0\n')

export function ok(stdout: string): ProcessRunResult {
  return { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false }
}

export function failed(stderr: string): ProcessRunResult {
  return { ...ok(''), exitCode: 1, stderr }
}

export const fenced = (source: string) => '```mermaid\n' + source + '\n```'

type RenderOptions = { requestId?: string; columns?: number }

/** An AssistantMessage render of `text` on the terminal. */
export function render(text: string, { requestId = 'message', columns = 100 }: RenderOptions = {}) {
  return {
    surface: 'terminal' as const,
    component: 'AssistantMessage' as const,
    requestId,
    viewport: { columns, rows: 40 },
    props: { text, isFirstOfReply: true },
  }
}

/**
 * Stands for the engine's own drawing of an AssistantMessage beneath the
 * plugin. Returns each text the plugin passed on, in order.
 */
export function captureTexts(on: On): string[] {
  const texts: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    texts.push(e.props.text)
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })
  return texts
}
