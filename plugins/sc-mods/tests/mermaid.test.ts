import type { On, ProcessRunResult, RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const FLOWCHART = 'flowchart TD\n  A-->B'
const WIDE_LR = 'flowchart LR\n  A[Alpha service]-->B[Beta service]-->C[Gamma service]-->D[Delta service]'
const DRAWING = '┌───┐\n│ A │\n└───┘'
const OVERFLOW = 'ASCII output exceeds requested width: actual 76 cells > maximum 30 (Unicode)'

const fenced = (source: string) => '```mermaid\n' + source + '\n```'
const ok = (stdout: string): ProcessRunResult => ({
  exitCode: 0,
  stdout,
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
})
const failed = (stderr: string): ProcessRunResult => ({ ...ok(''), exitCode: 1, stderr })

type MermanStub = (argv: readonly string[], stdin: string) => ProcessRunResult

/**
 * Answers `$.process.run` beneath the plugin: `--version` succeeds, every
 * render goes to `stub`. Returns the render calls the plugin made.
 */
function stubMerman(on: On, stub: MermanStub) {
  const renders: { argv: readonly string[]; stdin: string }[] = []
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: ok('merman-cli 0.8.0\n') }
    const stdin = typeof e.init?.stdin === 'string' ? e.init.stdin : ''
    renders.push({ argv: e.argv, stdin })
    return { value: stub(e.argv, stdin) }
  })
  return renders
}

/** Captures the text the plugin passes on to the engine's own drawing. */
function captureText(on: On) {
  const seen: { text?: string } = {}
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    seen.text = e.props.text
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })
  return seen
}

const render = (text: string, columns: number) => ({
  surface: 'terminal' as const,
  component: 'AssistantMessage' as const,
  requestId: `message-${columns}-${text.length}`,
  viewport: { columns, rows: 40 },
  props: { text, isFirstOfReply: true },
})

test('a reply with no mermaid fence passes through untouched', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING))
  const seen = captureText(on)
  const text = 'No diagrams here.\n\n```ts\nconst x = 1\n```'
  await $.ui.render(render(text, 120))
  expect(seen.text).toBe(text)
  expect(renders.length).toBe(0)
})

test('a flowchart fence becomes a text block of the drawing', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING + '\n'))
  const seen = captureText(on)
  await $.ui.render(render(`Here:\n\n${fenced(FLOWCHART)}\n\nDone.`, 104))
  expect(seen.text).toBe('Here:\n\n```text\n' + DRAWING + '\n```\n\nDone.')
  expect(renders[0]?.stdin).toBe(FLOWCHART)
  expect(renders[0]?.argv).toContain('--ascii-max-width')
  expect(renders[0]?.argv[renders[0].argv.indexOf('--ascii-max-width') + 1]).toBe('100')
})

test('the first flowchart layout is the auto profile', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING))
  captureText(on)
  await $.ui.render(render(fenced('flowchart TD\n  X-->Y'), 110))
  const argv = renders[0]?.argv ?? []
  expect(argv[argv.indexOf('--ascii-layout-profile') + 1]).toBe('auto')
})

test('a parse error keeps the fence as source', async ($, on) => {
  const renders = stubMerman(on, () => failed('Diagram parse error (flowchart-v2): unexpected end of input'))
  const seen = captureText(on)
  const text = fenced('flowchart TD\n  A-->')
  await $.ui.render(render(text, 90))
  expect(seen.text).toBe(text)
  expect(renders.length).toBe(1)
})

test('a wide LR flowchart at a narrow width falls back to TD', async ($, on) => {
  const renders = stubMerman(on, (_argv, stdin) => (stdin.startsWith('flowchart TD') ? ok(DRAWING) : failed(OVERFLOW)))
  const seen = captureText(on)
  await $.ui.render(render(fenced(WIDE_LR), 34))
  expect(seen.text).toBe('```text\n' + DRAWING + '\n```')
  // Three LR layouts overflow, then the first TD layout fits.
  expect(renders.length).toBe(4)
  expect(renders[3]?.stdin).toBe(WIDE_LR.replace('flowchart LR', 'flowchart TD'))
})

test('a diagram too wide for every layout keeps the fence as source', async ($, on) => {
  const renders = stubMerman(on, () => failed(OVERFLOW))
  const seen = captureText(on)
  const text = fenced(WIDE_LR.replace('Alpha', 'Epsilon'))
  await $.ui.render(render(text, 24))
  expect(seen.text).toBe(text)
  expect(renders.length).toBe(6)
})

test('a flowchart after a frontmatter block still falls back to TD', async ($, on) => {
  const preamble = '---\ntitle: flowchart LR pipeline\n---\n'
  const renders = stubMerman(on, (_argv, stdin) => (stdin.includes('\nflowchart TD') ? ok(DRAWING) : failed(OVERFLOW)))
  const seen = captureText(on)
  await $.ui.render(render(fenced(preamble + WIDE_LR), 44))
  expect(seen.text).toBe('```text\n' + DRAWING + '\n```')
  expect(renders.length).toBe(4)
  expect(renders[0]?.stdin).toBe(preamble + WIDE_LR)
  expect(renders[3]?.stdin).toBe(preamble + WIDE_LR.replace('flowchart LR', 'flowchart TD'))
})

test('a fence in a list item becomes a text block inside that item', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING))
  const seen = captureText(on)
  const text = '1. Flow:\n\n   ```mermaid\n   flowchart TD\n     A-->B\n   ```\n2. Done'
  await $.ui.render(render(text, 100))
  const indentedDrawing = DRAWING.split('\n').map(line => '   ' + line).join('\n')
  expect(seen.text).toBe('1. Flow:\n\n   ```text\n' + indentedDrawing + '\n   ```\n2. Done')
  expect(renders[0]?.stdin).toBe('flowchart TD\n  A-->B')
})

test('a fence in a quoted list item is drawn narrower by its prefix', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING))
  captureText(on)
  await $.ui.render(render('> - ```mermaid\n>   flowchart TD\n>   ```', 104))
  const argv = renders[0]?.argv ?? []
  expect(argv[argv.indexOf('--ascii-max-width') + 1]).toBe('96')
})

test('a mermaid fence quoted in a markdown example stays as source', async ($, on) => {
  const renders = stubMerman(on, () => ok(DRAWING))
  const seen = captureText(on)
  const text = '````markdown\n' + fenced(FLOWCHART) + '\n````'
  await $.ui.render(render(text, 100))
  expect(seen.text).toBe(text)
  expect(renders.length).toBe(0)
})

test('a flowchart after an init directive and comments still falls back to TD', async ($, on) => {
  const preamble = '%%{init: {"theme": "dark"}}%%\n%% the release pipeline\n\n'
  const renders = stubMerman(on, (_argv, stdin) => (stdin.includes('flowchart TD') ? ok(DRAWING) : failed(OVERFLOW)))
  const seen = captureText(on)
  await $.ui.render(render(fenced(preamble + WIDE_LR), 46))
  expect(seen.text).toBe('```text\n' + DRAWING + '\n```')
  expect(renders.length).toBe(4)
  expect(renders[0]?.stdin).toBe(preamble + WIDE_LR)
  expect(renders[3]?.stdin).toBe(preamble + WIDE_LR.replace('flowchart LR', 'flowchart TD'))
})
