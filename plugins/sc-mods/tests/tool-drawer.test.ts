import type { On, PromptOrigin, RenderElement } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import type { HeldCall } from '../types'
import {
  callsInScope,
  cardBody,
  cardText,
  drawerLayout,
  durationText,
  earlierCallsText,
  endingOf,
  isHeld,
  keptOutput,
  MAX_HELD_CALLS,
  MAX_KEPT_LINES,
  NEW_VIEW,
  openedOnFailure,
  toggleExpanded,
  ARROWS_ROWS,
  drawerRoom,
  otherRowsOf,
  scopeText,
  runningText,
  barTexts,
  SHOWN_LINES,
  startedCall,
  summaryText,
  switched,
  withCall,
} from '../hooks/tool-drawer'
import { turnRuleText } from '../hooks/turn-rule'
import { rowsOf } from '../hooks/band-rows'

const BAND = {
  hasSurvey: false,
  isCollapsed: false,
  isWorking: false,
  maxRows: 40,
  bodyColumns: 60,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const COMPOSER: PromptOrigin = { kind: 'composer' }
const ENGINE = { type: 'Text', text: 'engine' }
// A card's mark is a Text inside its Button, on the card's row.
const MARKS = ['✓', '✗', '⊘', '■', '…']

// --- The session beneath the plugin ---------------------------------------

/** A Bash call the session runs; `finish` ends it with what it printed or an error. */
type Pending = { finish: (answer: { stdout?: string; stderr?: string; error?: string; deny?: string }) => void }

/**
 * Stands for the engine: each component drawn as a Text `engine`, the clock,
 * and Bash calls that run until the test finishes them.
 */
function session(on: On): { clock: MockClock; calls: Map<string, Pending> } {
  on('ui.render', async () => ({ type: 'Text', props: {}, children: ['engine'] }) as unknown as RenderElement)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  on('command.register', () => ({ value: { command: 'tool-drawer' } }))
  const clock = mock.clock(on, { now: 1_000_000 })
  const calls = new Map<string, Pending>()
  on('tool.call', (_$, e) =>
    new Promise(resolve => {
      calls.set(e.tool_use_id, {
        finish: ({ stdout = '', stderr = '', error, deny }) => {
          if (deny !== undefined) resolve({ deny })
          else if (error !== undefined) resolve({ isError: true, result: undefined, text: error })
          else resolve({ result: { stdout, stderr, interrupted: false } })
        },
      })
    }),
  )
  return { clock, calls }
}

const prompt = ($: Engine, uuid: string) =>
  $.session.append({ message: { type: 'user', role: 'user', content: [{ type: 'text', text: uuid }] }, door: 'prompt', origin: COMPOSER, uuid })

/** Starts a Bash call and lets it reach the session; resolves `{ running }`, the call under way. */
async function startCall($: Engine, world: { calls: Map<string, Pending>; clock: MockClock }, id: string, command = `echo ${id}`) {
  const running = $.tool.call({ tool: 'Bash', tool_use_id: id, command })
  await world.clock.advance(0)
  return { running }
}

async function finishCall(world: { calls: Map<string, Pending>; clock: MockClock }, { running }: { running: Promise<unknown> }, id: string, answer: Parameters<Pending['finish']>[0] = { stdout: 'ok\n' }) {
  world.calls.get(id)?.finish(answer)
  await running
}

const mountBand = ($: Engine, props: Partial<typeof BAND> = {}) =>
  $.ui.mount({ plugin: 'sc-mods', surface: 'terminal', component: 'AbovePrompt', props: { ...BAND, ...props } })

const mountToolUse = ($: Engine, id: string, tool = 'Bash') =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'ToolUse',
    requestId: id,
    props: { tool_use_id: id, tool, input: { command: 'x' }, isRunning: false, isErrored: false, isInterrupted: false, isExpanded: true },
  })

const mountToolResult = ($: Engine, id: string) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'ToolResult',
    requestId: id,
    props: { tool_use_id: id, tool: 'Bash', output: { stdout: 'ok', stderr: '' }, isErrored: false, isExpanded: true },
  })

const mountProgress = ($: Engine, id: string) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'ToolProgress',
    requestId: id,
    props: { tool_use_id: id, kind: 'background_hint', hint: '(ctrl+b to run in background)' },
  })

const mountGroup = ($: Engine, ids: Array<[string, string]>) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'ToolGroup',
    requestId: 'group',
    props: {
      calls: ids.map(([id, tool]) => ({ tool_use_id: id, tool, input: {}, isRunning: false, isErrored: false, isInterrupted: false })),
      isActive: false,
      isExpanded: true,
    },
  })

const command = ($: Engine, args: string) =>
  $.command.run({ command: 'tool-drawer', args, origin: COMPOSER, presentation: { layout: 'main', columns: 100 } } as never)

/** Whether the row draws as the engine draws it; the drawing is unmounted after. */
async function shows(mounting: Promise<{ find: (q: object) => Promise<unknown>; unmount: () => Promise<unknown> }>) {
  const ui = await mounting
  const isShown = (await ui.find(ENGINE)) !== undefined
  await ui.unmount()
  return isShown
}

const call = (fields: Partial<HeldCall> = {}): HeldCall => ({ ...startedCall('c1', 'ls -la', 'p1', 0), ...fields })

// --- Recording ------------------------------------------------------------

test('a call is kept running, then done with its output and duration', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1', 'ls')
  const band = await mountBand($)
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 running · bash)')
  expect(await band.find({ type: 'Text', text: '●' })).toBeDefined()

  await world.clock.advance(400)
  await finishCall(world, running, 'c1', { stdout: 'a\nb\n', stderr: 'warn\n' })
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 done · bash)')
  expect(await band.find({ type: 'Text', text: '●' })).toBeUndefined()
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toBe('▸ ✓ bash 0.4s  ls')

  await band.press({ key: 'tool-drawer:card:c1' })
  const texts = (await band.findAll({ type: 'Text' })).map(found => found.text)
  expect(texts.filter(text => text.startsWith('┃'))).toEqual(['┃ $ ls', '┃ a', '┃ b', '┃ warn'])
})

test('a failed call opens its own card; a refused one is declined', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const failing = await startCall($, world, 'c1')
  await finishCall(world, failing, 'c1', { error: 'Exit code 2\nboom' })
  const refused = await startCall($, world, 'c2')
  await finishCall(world, refused, 'c2', { deny: 'Permission denied' })
  const band = await mountBand($)
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 failed · 1 declined · bash)')
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾ ✗ bash/)
  expect(await band.find({ type: 'Text', text: '┃ boom' })).toBeDefined()
  expect(await band.find({ type: 'Text', text: '✗' })).toMatchObject({ props: { color: 'error' } })
  expect(String((await band.find({ key: 'tool-drawer:card:c2' }))?.props.label)).toMatch(/^▸ ⊘ bash/)
  expect(await band.find({ type: 'Text', text: '⊘' })).toMatchObject({ props: { dimColor: true } })
  await band.press({ key: 'tool-drawer:card:c2' })
  expect(await band.find({ type: 'Text', text: '┃ Permission denied' })).toBeDefined()
})

test('a failed card the person closed stays closed', async ($, on) => {
  const view = toggleExpanded(openedOnFailure(NEW_VIEW, 'c1'), 'c1')
  expect(view.expanded).toEqual([])
  expect(openedOnFailure(view, 'c1').expanded).toEqual([])
  expect(toggleExpanded(view, 'c1')).toMatchObject({ expanded: ['c1'], collapsed: [] })
})

test('a call cut short by an abort, or stopped with Esc, is interrupted', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const stopped = await startCall($, world, 'c1')
  await finishCall(world, stopped, 'c1', { error: '[Request interrupted by user for tool use]' })
  const band = await mountBand($)
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▸ ■ bash/)
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 interrupted · bash)')
})

test('a row an abort ended marks its call interrupted', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const failing = await startCall($, world, 'c1')
  await finishCall(world, failing, 'c1', { error: 'Exit code 130' })
  const row = await $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'ToolUse',
    requestId: 'c1',
    props: { tool_use_id: 'c1', tool: 'Bash', input: {}, isRunning: false, isErrored: true, isInterrupted: true, isExpanded: true },
  })
  await world.clock.advance(0)
  await row.unmount()
  expect(String((await (await mountBand($)).find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾ ■ bash/)
})

test('a running card counts its seconds up while the call runs', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1', 'sleep 5')
  const band = await mountBand($)
  await world.clock.advance(3000)
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toBe('▸ … bash 3s  sleep 5')
  await finishCall(world, running, 'c1')
})

// --- Hiding rows ----------------------------------------------------------

test('rows of a held call draw nothing; other calls and tools keep theirs', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  expect(await shows(mountToolUse($, 'c1'))).toBe(false)
  expect(await shows(mountProgress($, 'c1'))).toBe(false)
  await finishCall(world, running, 'c1')
  expect(await shows(mountToolResult($, 'c1'))).toBe(false)

  expect(await shows(mountToolUse($, 'from-before'))).toBe(true)
  expect(await shows(mountProgress($, 'from-before'))).toBe(true)
  expect(await shows(mountToolUse($, 'c1', 'Read'))).toBe(true)
})

test('a group draws nothing only when every call in it is held', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  await finishCall(world, running, 'c1')
  expect(await shows(mountGroup($, [['c1', 'Bash']]))).toBe(false)
  expect(await shows(mountGroup($, [['c1', 'Bash'], ['r1', 'Read']]))).toBe(true)
})

test('/tool-drawer off gives the rows back and hides the drawer; on takes them again', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  await finishCall(world, running, 'c1')

  expect((await command($, 'off')).text).toMatch(/off/)
  expect(await shows(mountToolUse($, 'c1'))).toBe(true)
  expect(await (await mountBand($)).find({ key: 'tool-drawer:toggle' })).toBeUndefined()
  expect((await command($, '')).text).toMatch(/is off/)

  expect((await command($, 'on')).text).toMatch(/on/)
  expect(await shows(mountToolUse($, 'c1'))).toBe(false)
  expect(await (await mountBand($)).find({ key: 'tool-drawer:toggle' })).toBeDefined()
})

// --- The drawer -----------------------------------------------------------

test('with no call in scope the drawer draws nothing and the arrows stay', async ($, on) => {
  session(on)
  await prompt($, 'p1')
  const band = await mountBand($)
  expect(await band.find({ key: 'tool-drawer:toggle' })).toBeUndefined()
  expect(await band.find({ key: 'prompt-jump:previous' })).toBeDefined()
})

test('the drawer yields to a survey and stays out of an agent transcript', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  expect(await (await mountBand($, { hasSurvey: true })).find({ key: 'tool-drawer:toggle' })).toBeUndefined()
  expect(await (await mountBand($, { view: { agentId: 'a1' } })).find({ key: 'tool-drawer:toggle' })).toBeUndefined()
  await finishCall(world, running, 'c1')
})

test('the drawer sits above the arrows', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  const keys = (await (await mountBand($)).findAll({ type: 'Button' })).map(found => found.key)
  expect(keys.indexOf('tool-drawer:toggle')).toBeLessThan(keys.indexOf('prompt-jump:previous'))
  await finishCall(world, running, 'c1')
})

test('scope follows the arrows, and the scope button switches to all turns', async ($, on) => {
  const world = session(on)
  on('ui.scroll', () => ({}))
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1'), 'c1')
  await prompt($, 'p2')
  await finishCall(world, await startCall($, world, 'c2'), 'c2')

  const band = await mountBand($)
  expect((await band.find({ key: 'tool-drawer:scope' }))?.props.label).toBe('Turn 2/2')
  expect(await band.find({ key: 'tool-drawer:card:c1' })).toBeUndefined()
  expect(await band.find({ key: 'tool-drawer:card:c2' })).toBeDefined()

  await band.press({ key: 'prompt-jump:previous' })
  expect((await band.find({ key: 'tool-drawer:scope' }))?.props.label).toBe('Turn 1/2')
  expect(await band.find({ key: 'tool-drawer:card:c1' })).toBeDefined()
  expect(await band.find({ key: 'tool-drawer:card:c2' })).toBeUndefined()

  await band.press({ key: 'tool-drawer:scope' })
  expect((await band.find({ key: 'tool-drawer:scope' }))?.props.label).toBe('All')
  expect(await band.find({ key: 'tool-drawer:card:c1' })).toBeDefined()
  expect(await band.find({ key: 'tool-drawer:card:c2' })).toBeDefined()
})

test('a card opens and closes on a press', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1')
  const band = await mountBand($)
  await band.press({ key: 'tool-drawer:card:c1' })
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toMatch(/^▾/)
  expect(await band.find({ type: 'Text', text: '┃ $ ls' })).toBeDefined()
  await band.press({ key: 'tool-drawer:card:c1' })
  expect(await band.find({ type: 'Text', text: '┃ $ ls' })).toBeUndefined()
})

test('the drawer opens on a new turn’s first call until the person opens or closes it by hand', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1'), 'c1')
  const band = await mountBand($)
  expect(await band.find({ key: 'tool-drawer:card:c1' })).toBeDefined()

  await band.press({ key: 'tool-drawer:toggle' })
  expect(await band.find({ key: 'tool-drawer:card:c1' })).toBeUndefined()
  await prompt($, 'p2')
  await finishCall(world, await startCall($, world, 'c2'), 'c2')
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toMatch(/^▸/)
  expect(await band.find({ key: 'tool-drawer:card:c2' })).toBeUndefined()
})

test('/clear forgets the held calls and their rows come back', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1'), 'c1')
  await $.session.end({ reason: 'clear', sessionId: 'session', resume: { id: 'session' } })
  expect(await shows(mountToolUse($, 'c1'))).toBe(true)
  expect(await (await mountBand($)).find({ key: 'tool-drawer:toggle' })).toBeUndefined()
})

test('/resume forgets the held calls', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1'), 'c1')
  await $.session.end({ reason: 'resume', sessionId: 'session', resume: { id: 'resumed' } })
  expect(await shows(mountToolUse($, 'c1'))).toBe(true)
})

// --- The turn rule --------------------------------------------------------

const mountUserRow = ($: Engine, requestId: string) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'UserMessage',
    requestId,
    viewport: { columns: 30, rows: 40 },
    props: { text: 'hi', origin: COMPOSER, isExpanded: true },
  } as never)

test('a rule with the turn number sits above the second prompt on, not the first or other rows', async ($, on) => {
  session(on)
  await prompt($, 'p1')
  await prompt($, 'p2')
  const second = await mountUserRow($, 'p2')
  expect((await second.find({ type: 'Text', text: /Turn 2/ }))?.text).toBe(turnRuleText(2, 26))
  expect(await second.find(ENGINE)).toBeDefined()

  const first = await mountUserRow($, 'p1')
  expect(await first.find({ type: 'Text', text: /Turn/ })).toBeUndefined()
  const notice = await mountUserRow($, 'notice')
  expect(await notice.find({ type: 'Text', text: /Turn/ })).toBeUndefined()
})

test('the turn rule stays while the drawer is off', async ($, on) => {
  session(on)
  await prompt($, 'p1')
  await prompt($, 'p2')
  await command($, 'off')
  expect(await (await mountUserRow($, 'p2')).find({ type: 'Text', text: /Turn 2/ })).toBeDefined()
})

// --- Pure helpers ---------------------------------------------------------

test('turnRuleText fills the width with the label near the right end', () => {
  expect(turnRuleText(3, 20)).toBe('╌╌╌╌╌╌╌╌╌╌ Turn 3 ╌╌')
  expect(turnRuleText(3, 20)).toHaveLength(20)
  expect(turnRuleText(3, 5)).toBe('Turn 3')
})

test('keptOutput keeps the last lines and counts them all', () => {
  const text = Array.from({ length: MAX_KEPT_LINES + 5 }, (_, n) => `line ${n}`).join('\n') + '\n'
  const kept = keptOutput(text)
  expect(kept.outputLineCount).toBe(MAX_KEPT_LINES + 5)
  expect(kept.output).toHaveLength(MAX_KEPT_LINES)
  expect(kept.output[0]).toBe('line 5')
  expect(keptOutput('x'.repeat(1000)).output[0]).toHaveLength(400)
  expect(keptOutput('')).toEqual({ output: [], outputLineCount: 0 })
})

test('endingOf reads stdout then stderr, an error, or a refusal', () => {
  expect(endingOf({ result: { stdout: 'a\n', stderr: 'b\n' } } as never)).toEqual({ status: 'done', text: 'a\nb' })
  expect(endingOf({ isError: true, result: undefined, text: 'boom' })).toEqual({ status: 'error', text: 'boom' })
  expect(endingOf({ deny: 'no' })).toEqual({ status: 'declined', text: 'no' })
  expect(endingOf({ isError: true, result: undefined, text: 'denied' }, { wasAsked: true, wasSeenRunning: false }).status).toBe('declined')
  expect(endingOf({ isError: true, result: undefined, text: 'exit 1' }, { wasAsked: true, wasSeenRunning: true }).status).toBe('error')
  expect(endingOf({ isError: true, result: undefined, text: 'Interrupted by user' }).status).toBe('interrupted')
  expect(endingOf({ result: { stdout: '', stderr: '', interrupted: true } } as never).status).toBe('interrupted')
})

test('withCall keeps at most MAX_HELD_CALLS, dropping the oldest', () => {
  let calls: HeldCall[] = []
  for (let n = 0; n < MAX_HELD_CALLS + 3; n += 1) calls = withCall(calls, call({ id: `c${n}` }))
  expect(calls).toHaveLength(MAX_HELD_CALLS)
  expect(calls[0]?.id).toBe('c3')
})

test('summaryText counts each status shown', () => {
  expect(summaryText([call({ status: 'done' }), call({ status: 'done' }), call({ status: 'running' })])).toBe('Tool Usage (2 done · 1 running · bash)')
  expect(summaryText([call({ status: 'error' })])).toBe('Tool Usage (1 failed · bash)')
})

test('callsInScope picks the turn’s calls or all of them', () => {
  const calls = [call({ id: 'a', promptId: 'p1' }), call({ id: 'b', promptId: 'p2' }), call({ id: 'c', promptId: '' })]
  const turn = { promptId: 'p2', number: 2, count: 2 }
  expect(callsInScope(calls, 'turn', turn).map(one => one.id)).toEqual(['b'])
  expect(callsInScope(calls, 'all', turn).map(one => one.id)).toEqual(['a', 'b', 'c'])
  expect(callsInScope(calls, 'turn', undefined)).toEqual([])
  expect(scopeText('turn', turn)).toBe('Turn 2/2')
  expect(scopeText('all', turn)).toBe('All')
})

test('durationText and cardText', () => {
  expect(durationText(400)).toBe('0.4s')
  expect(durationText(12_300)).toBe('12s')
  expect(durationText(65_000)).toBe('1m05s')
  const done = call({ status: 'done', durationMs: 400, command: 'git status\nmore' })
  expect(cardText(done, false, 0, 80)).toBe('▸ ✓ bash 0.4s  git status')
  expect(cardText(done, true, 0, 12)).toBe('▾ ✓ bash 0.…')
})

test('cardBody shows the last lines with a note of the earlier ones', () => {
  const lines = Array.from({ length: 40 }, (_, n) => `l${n}`)
  const body = cardBody(call({ output: lines, outputLineCount: 240 }), 80)
  expect(body.command).toBe('┃ $ ls -la')
  expect(body.lines).toHaveLength(30)
  expect(body.lines[0]).toBe('┃ l10')
  expect(body.earlierNote).toBe('┃ … 210 earlier lines')
  expect(cardBody(call({ output: ['x'], outputLineCount: 1 }), 80).earlierNote).toBeUndefined()
})

test('isHeld only while on and only for a kept call', () => {
  const calls = [call({ id: 'c1' })]
  expect(isHeld(NEW_VIEW, calls, 'c1')).toBe(true)
  expect(isHeld(NEW_VIEW, calls, 'c2')).toBe(false)
  expect(isHeld({ ...NEW_VIEW, isOn: false }, calls, 'c1')).toBe(false)
})

test('switched turns the drawer on and off and reports its state', () => {
  expect(switched(NEW_VIEW, 'off').view.isOn).toBe(false)
  expect(switched({ ...NEW_VIEW, isOn: false }, ' on ').view.isOn).toBe(true)
  expect(switched(NEW_VIEW, '').text).toMatch(/^Tool drawer is on\./)
  expect(switched(NEW_VIEW, 'maybe').text).toMatch(/Unknown option "maybe"/)
})

// --- Fitting the band -----------------------------------------------------

const layoutRows = (layout: ReturnType<typeof drawerLayout>) =>
  1 +
  (layout.earlierCalls > 0 ? 1 : 0) +
  layout.cards.reduce((rows, { call: one, bodyLines }) => {
    if (bodyLines === undefined) return rows + 1
    return rows + 2 + bodyLines + (one.outputLineCount > bodyLines ? 1 : 0)
  }, 0)

const longCall = (id: string, lines = 30) =>
  call({ id, output: Array.from({ length: lines }, (_, n) => `l${n}`), outputLineCount: lines })

test('a 30-line body in a 12-row band leaves the rows beneath the drawer clear', () => {
  const room = drawerRoom(12, 1)
  const layout = drawerLayout([longCall('a')], ['a'], room)
  expect(layoutRows(layout)).toBeLessThanOrEqual(room)
  // Bar, card, command row, note, then the last lines.
  expect(layout.cards[0]?.bodyLines).toBe(room - 4)
  expect(cardBody(longCall('a'), 80, room - 4).earlierNote).toBe(`┃ … ${30 - (room - 4)} earlier lines`)
})

test('many cards in a small band show the newest under a note of the earlier ones', () => {
  const calls = Array.from({ length: 10 }, (_, n) => call({ id: `c${n}` }))
  const layout = drawerLayout(calls, [], 5)
  expect(layout.cards.map(one => one.call.id)).toEqual(['c7', 'c8', 'c9'])
  expect(layout.earlierCalls).toBe(7)
  expect(layoutRows(layout)).toBe(5)
  expect(earlierCallsText(7, 80)).toBe('… 7 earlier calls')
})

test('the newest expanded card gets the room first', () => {
  const layout = drawerLayout([longCall('a'), longCall('b')], ['a', 'b'], 10)
  expect(layout.cards.map(one => one.bodyLines)).toEqual([undefined, 5])
  expect(layoutRows(layout)).toBeLessThanOrEqual(10)
})

test('a roomy band shows a body’s 30 lines; a tiny one shows the bar alone', () => {
  expect(drawerLayout([longCall('a', 50)], ['a'], 60).cards[0]?.bodyLines).toBe(SHOWN_LINES)
  expect(drawerLayout([longCall('a')], ['a'], 1)).toEqual({ cards: [], earlierCalls: 0 })
})

test('in a 12-row band the arrows stay under an expanded 30-line card', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const out = Array.from({ length: 30 }, (_, n) => `line ${n}`).join('\n')
  await finishCall(world, await startCall($, world, 'c1', 'seq 30'), 'c1', { stdout: out })
  const band = await mountBand($, { maxRows: 12, scroll: { offset: 0, bodyRows: 11 } })
  await band.press({ key: 'tool-drawer:card:c1' })
  // One element a row: the scope button shares the bar's row; the arrows' row and the engine's drawing are beneath the drawer.
  const drawerRows = (await band.findAll({}))
    .filter(found => found.type === 'Text' || found.type === 'Button')
    .filter(found => found.key !== 'tool-drawer:scope' && !String(found.key ?? '').startsWith('prompt-jump') && found.text !== 'Turn 1/1' && found.text !== 'engine' && !MARKS.includes(found.text))
  expect(drawerRows.length).toBeLessThanOrEqual(drawerRoom(12, 0))
  expect(await band.find({ type: 'Text', text: '┃ line 29' })).toBeDefined()
  expect(await band.find({ type: 'Text', text: '┃ line 0' })).toBeUndefined()
})

// --- Room left by other plugins' band rows --------------------------------

const box = (props: Record<string, unknown>, ...children: unknown[]) => ({ type: 'Box', props, children })
const text = (value: string) => ({ type: 'Text', props: {}, children: [value] })
/** A framed one-line box, as an activity box draws its row: border, headline, border. */
const FRAMED_ROW = box({ flexDirection: 'row' }, box({ flexDirection: 'column', borderStyle: 'round', paddingX: 1 }, box({ flexDirection: 'row' }, text('▸'), text('Running tests'))))

test('rowsOf reads a tree’s rows', () => {
  expect(rowsOf(text('one'))).toBe(1)
  expect(rowsOf(text('one\ntwo'))).toBe(2)
  expect(rowsOf(box({ flexDirection: 'column' }, text('a'), text('b'), text('c')))).toBe(3)
  expect(rowsOf(box({}, text('a'), box({ flexDirection: 'column' }, text('b'), text('c'))))).toBe(2)
  expect(rowsOf(FRAMED_ROW)).toBe(3)
  expect(rowsOf(box({ flexDirection: 'column', paddingY: 1, gap: 1 }, text('a'), text('b')))).toBe(5)
  expect(rowsOf(box({ display: 'none' }, text('a')))).toBe(0)
  expect(rowsOf(box({}))).toBe(0)
  expect(rowsOf({ type: 'Button', props: { label: 'x' } })).toBe(1)
  expect(rowsOf({ type: 'engine', ref: 1 })).toBe(1)
})

test('otherRowsOf counts only the other plugins’ rows', () => {
  const rows = [
    { plugin: 'activity', tree: FRAMED_ROW },
    { plugin: 'sc-mods', tree: box({ flexDirection: 'column' }, text('a'), text('b')) },
    { plugin: 'clock', tree: text('12:00') },
  ]
  expect(otherRowsOf(rows, 'sc-mods')).toBe(4)
  expect(drawerRoom(12, 4)).toBe(12 - ARROWS_ROWS - 4)
})

test('with another plugin’s 3-row row in the band, the drawer and the arrows fit in maxRows', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const out = Array.from({ length: 30 }, (_, n) => `line ${n}`).join('\n')
  await finishCall(world, await startCall($, world, 'c1', 'seq 30'), 'c1', { stdout: out })
  const list = await $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'AbovePromptList',
    props: { ...BAND, maxRows: 12, rows: [{ plugin: 'activity', tree: FRAMED_ROW }] },
  } as never)
  await world.clock.advance(0)
  await list.unmount()

  const band = await mountBand($, { maxRows: 12, scroll: { offset: 0, bodyRows: 11 } })
  await band.press({ key: 'tool-drawer:card:c1' })
  const drawerRows = (await band.findAll({}))
    .filter(found => found.type === 'Text' || found.type === 'Button')
    .filter(found => found.key !== 'tool-drawer:scope' && !String(found.key ?? '').startsWith('prompt-jump') && found.text !== 'Turn 1/1' && found.text !== 'engine' && !MARKS.includes(found.text))
  expect(drawerRows.length + ARROWS_ROWS + 3).toBeLessThanOrEqual(12)
  expect(await band.find({ type: 'Text', text: '┃ line 29' })).toBeDefined()
})

// --- The running command on the bar ---------------------------------------

test('runningText names the newest running command and its seconds', () => {
  const calls = [call({ id: 'a', command: 'ls', status: 'running', startedAt: 0 }), call({ id: 'b', command: 'npm test\n--watch', status: 'running', startedAt: 1000 }), call({ id: 'c', status: 'done' })]
  expect(runningText(calls, 13_500)).toBe('npm test 12s')
  expect(runningText([call({ status: 'done' })], 0)).toBeUndefined()
})

test('barTexts gives the summary room first and cuts the running command', () => {
  const summary = '▸ Tool Usage (2 done · 1 running · bash)'
  expect(barTexts(summary, 'npm test 12s', 'Turn 3/8', 80)).toEqual({ summary, running: 'npm test 12s' })
  const tight = barTexts(summary, 'npm test --coverage 12s', 'Turn 3/8', 62)
  expect(tight.summary).toBe(summary)
  expect(tight.running).toBe('npm t…')
  expect(barTexts(summary, 'npm test 12s', 'Turn 3/8', 50).running).toBeUndefined()
})

test('the bar shows the running command after the dot', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1', 'npm test')
  await world.clock.advance(12_000)
  const band = await mountBand($, { bodyColumns: 80 })
  expect(await band.find({ type: 'Text', text: 'npm test 12s' })).toBeDefined()
  await finishCall(world, running, 'c1')
  expect(await band.find({ type: 'Text', text: 'npm test 12s' })).toBeUndefined()
})
