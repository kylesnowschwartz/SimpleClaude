import type { Engine } from 'claude-code/testing'
import type { On, ProcessRunResult, RenderElement } from 'claude-code'
import { expect, test } from 'claude-code/testing'

const DRAWING = '┌───┐\n│ A │\n└───┘'
const PLACEHOLDER = '*Drawing Mermaid diagram…*'
const STREAMING = 'Here it comes:\n\n```mermaid\nflowchart TD\n  A-->'

const ok = (stdout: string): ProcessRunResult => ({
  exitCode: 0,
  stdout,
  stderr: '',
  isStdoutTruncated: false,
  isStderrTruncated: false,
})

const render = (text: string, requestId: string) => ({
  surface: 'terminal' as const,
  component: 'AssistantMessage' as const,
  requestId,
  viewport: { columns: 100, rows: 40 },
  props: { text, isFirstOfReply: true },
})

/** Stands for the engine beneath the plugin: merman runs, turns echo back, renders show the text. */
function standInEngine(on: On) {
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: ok('merman-cli 0.8.0\n') }
    return { value: ok(DRAWING) }
  })
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  const seen: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e) => {
    seen.push(e.props.text)
    return { type: 'Text', props: {}, children: [e.props.text] } as unknown as RenderElement
  })
  return seen
}

const startTurn = ($: Engine, turnId: string) => $.turn.start({ text: 'draw it', turnId })

const completeTurn = ($: Engine, turnId: string, agentId?: string) =>
  $.turn.complete({ answer: '', durationMs: 1, isAborted: false, reason: 'answer', turnId, agentId })

test('an unclosed fence shows a placeholder while its turn runs', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.ui.render(render(STREAMING, 'streaming'))
  expect(seen).toEqual(['Here it comes:\n\n' + PLACEHOLDER])
})

test('a quoted fence streaming in at a line break shows the placeholder', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.ui.render(render('> ```mermaid\n> flowchart TD\n', 'quoted'))
  expect(seen).toEqual(['> ' + PLACEHOLDER + '\n'])
})

test('an older reply with an unclosed fence keeps its source during a later turn', async ($, on) => {
  const seen = standInEngine(on)
  await $.ui.render(render(STREAMING, 'older-reply'))
  await startTurn($, 'turn-2')
  await $.ui.render(render(STREAMING, 'older-reply'))
  expect(seen).toEqual([STREAMING, STREAMING])
})

test('an unclosed fence shows its source once the turn completes', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await completeTurn($, 'turn-1')
  await $.ui.render(render(STREAMING, 'finished'))
  expect(seen).toEqual([STREAMING])
})

test('an interrupted turn ends the placeholder too', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: true, reason: 'aborted', turnId: 'turn-1' })
  await $.ui.render(render(STREAMING, 'interrupted'))
  expect(seen).toEqual([STREAMING])
})

test("a subagent's turn completing leaves the main turn running", async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await completeTurn($, 'subagent-turn', 'agent-7')
  await $.ui.render(render(STREAMING, 'still-streaming'))
  expect(seen).toEqual(['Here it comes:\n\n' + PLACEHOLDER])
})

test('with no turn started, an unclosed fence shows its source', async ($, on) => {
  const seen = standInEngine(on)
  await $.ui.render(render(STREAMING, 'idle'))
  expect(seen).toEqual([STREAMING])
})

test('a closed fence is drawn while an unclosed one after it streams', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  const text = '```mermaid\nflowchart TD\n  A-->B\n```\n\n```mermaid\nsequenceDiagram\n'
  await $.ui.render(render(text, 'mixed'))
  expect(seen).toEqual(['```text\n' + DRAWING + '\n```\n\n' + PLACEHOLDER])
})
