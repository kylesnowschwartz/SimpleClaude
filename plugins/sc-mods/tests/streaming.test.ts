import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import { DRAWING, MERMAN_VERSION, captureTexts, ok, render } from './support'

const PLACEHOLDER = '*Drawing Mermaid diagram…*'
const STREAMING = 'Here it comes:\n\n```mermaid\nflowchart TD\n  A-->'

/** Stands for the engine beneath the plugin: merman runs, turns echo back, renders show the text. */
function standInEngine(on: On) {
  on('process.run', async (_$, e) => {
    if (e.argv.includes('--version')) return { value: MERMAN_VERSION }
    return { value: ok(DRAWING) }
  })
  on('turn.start', async (_$, e) => ({ turnId: e.turnId }))
  on('turn.complete', async (_$, e) => ({ text: e.answer }))
  return captureTexts(on)
}

const startTurn = ($: Engine, turnId: string) => $.turn.start({ text: 'draw it', turnId })

const completeTurn = ($: Engine, turnId: string, agentId?: string) =>
  $.turn.complete({ answer: '', durationMs: 1, isAborted: false, reason: 'answer', turnId, agentId })

test('an unclosed fence shows a placeholder while its turn runs', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.ui.render(render(STREAMING, { requestId: 'streaming' }))
  expect(seen).toEqual(['Here it comes:\n\n' + PLACEHOLDER])
})

test('a quoted fence streaming in at a line break shows the placeholder', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.ui.render(render('> ```mermaid\n> flowchart TD\n', { requestId: 'quoted' }))
  expect(seen).toEqual(['> ' + PLACEHOLDER + '\n'])
})

test('an older reply with an unclosed fence keeps its source during a later turn', async ($, on) => {
  const seen = standInEngine(on)
  await $.ui.render(render(STREAMING, { requestId: 'older-reply' }))
  await startTurn($, 'turn-2')
  await $.ui.render(render(STREAMING, { requestId: 'older-reply' }))
  expect(seen).toEqual([STREAMING, STREAMING])
})

test('an unclosed fence shows its source once the turn completes', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await completeTurn($, 'turn-1')
  await $.ui.render(render(STREAMING, { requestId: 'finished' }))
  expect(seen).toEqual([STREAMING])
})

test('an interrupted turn ends the placeholder too', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await $.turn.complete({ answer: '', durationMs: 1, isAborted: true, reason: 'aborted', turnId: 'turn-1' })
  await $.ui.render(render(STREAMING, { requestId: 'interrupted' }))
  expect(seen).toEqual([STREAMING])
})

test('a completion for a turn that never started changes nothing', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  await completeTurn($, 'subagent-turn', 'agent-7')
  await $.ui.render(render(STREAMING, { requestId: 'still-streaming' }))
  expect(seen).toEqual(['Here it comes:\n\n' + PLACEHOLDER])
})

test('with no turn started, an unclosed fence shows its source', async ($, on) => {
  const seen = standInEngine(on)
  await $.ui.render(render(STREAMING, { requestId: 'idle' }))
  expect(seen).toEqual([STREAMING])
})

test('a closed fence is drawn while an unclosed one after it streams', async ($, on) => {
  const seen = standInEngine(on)
  await startTurn($, 'turn-1')
  const text = '```mermaid\nflowchart TD\n  A-->B\n```\n\n```mermaid\nsequenceDiagram\n'
  await $.ui.render(render(text, { requestId: 'mixed' }))
  expect(seen).toEqual(['```text\n' + DRAWING + '\n```\n\n' + PLACEHOLDER])
})
