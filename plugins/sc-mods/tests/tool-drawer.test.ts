import type { On, PromptOrigin, RenderElement, ToolCallResult } from 'claude-code'
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
  prunedView,
  openedOnFailure,
  toggleExpanded,
  ARROWS_ROWS,
  FRAME_ROWS,
  drawerRoom,
  otherRowsOf,
  scopeText,
  backgroundNoteText,
  restoredCalls,
  cardParts,
  commandBlock,
  COMMAND_ROWS,
  outputBlocks,
  wrapCells,
  bodyRows,
  elapsedCells,
  TOOL_ICON,
  copyText,
  runningText,
  barTexts,
  NO_ROOM_NOTE,
  SHOWN_LINES,
  startedCall,
  summaryText,
  switched,
  withCall,
} from '../hooks/tool-drawer'
import { turnRuleText } from '../hooks/turn-rule'
import { rowsOf } from '../hooks/band-rows'
import { recordToasts } from './support'

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
/** The drawer's framed block in a drawn band. */
function frameIn(tree: unknown): unknown {
  if (tree === null || typeof tree !== 'object') return undefined
  const element = tree as { props?: Record<string, unknown>; children?: unknown[] }
  if (element.props?.borderStyle === 'round') return element
  for (const child of element.children ?? []) {
    const found = frameIn(child)
    if (found !== undefined) return found
  }
  return undefined
}

// --- The session beneath the plugin ---------------------------------------

/**
 * How a running Bash call ends: it prints, errs with `error`, is refused by
 * the tool with `deny`, or rejects with `throws`.
 */
type Ending = { stdout?: string; stderr?: string; error?: string; deny?: string; throws?: string; backgroundTaskId?: string }
type Pending = { finish: (answer: Ending) => Promise<void> }

/**
 * Stands for the engine: each component drawn as a Text `engine`, the clock,
 * and Bash calls that run until the test finishes them.
 */
function session(on: On): { clock: MockClock; calls: Map<string, Pending>; store: Map<string, unknown>; declines: Set<string> } {
  on('ui.render', async () => ({ type: 'Text', props: {}, children: ['engine'] }) as unknown as RenderElement)
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  on('command.register', () => ({ value: { command: 'tool-drawer' } }))
  const clock = mock.clock(on, { now: 1_000_000 })
  const store = new Map<string, unknown>()
  on('store.get', async (_$, e) => ({ value: store.get(e.key) }))
  on('store.set', async (_$, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  const calls = new Map<string, Pending>()
  const declines = new Set<string>()
  // An allowed call runs through `tool.run`, which holds it until the test finishes it.
  on('tool.run', (_$, e) =>
    new Promise<ToolCallResult>((resolve, reject) => {
      calls.set(e.tool_use_id, {
        finish: async ({ stdout = '', stderr = '', error, deny, throws, backgroundTaskId }) => {
          if (throws !== undefined) reject(new Error(throws))
          else if (deny !== undefined) resolve({ deny })
          else if (error !== undefined) resolve({ isError: true, result: undefined, text: error })
          else resolve({ result: { stdout, stderr, interrupted: false, ...(backgroundTaskId === undefined ? {} : { backgroundTaskId, backgroundedByUser: true }) } })
        },
      })
    }),
  )
  // A call the test declines is refused before it runs, as a declined dialog refuses it.
  on('tool.check', async (_$, e) => (e.tool_use_id !== undefined && declines.has(e.tool_use_id) ? { decision: 'deny', reason: 'declined' } : { decision: 'allow' }))
  return { clock, calls, store, declines }
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
  await world.calls.get(id)?.finish(answer)
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
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toBe('▸ ✓ 󰯠  0.4s  ls')

  await band.press({ key: 'tool-drawer:card:c1' })
  expect(await band.find({ type: 'Code' })).toMatchObject({ props: { source: 'ls', language: 'bash' } })
  expect(await band.find({ type: 'Text', text: 'a\nb\nwarn' })).toBeDefined()
  expect(await band.findAll({ type: 'Button', text: '┃' })).toHaveLength(4)
  expect(await band.find({ type: 'Text', text: '$ ' })).toMatchObject({ props: { color: 'suggestion' } })
  expect(await band.find({ type: 'Text', text: 'ls' })).toMatchObject({ props: { color: 'suggestion' } })
})

test('a failed call opens its own card; a refused one is declined', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const failing = await startCall($, world, 'c1')
  await finishCall(world, failing, 'c1', { error: 'Exit code 2\nboom' })
  world.declines.add('c2')
  await (await startCall($, world, 'c2')).running
  const band = await mountBand($)
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 failed · 1 declined · bash)')
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾ ✗ 󰯠/u)
  expect(await band.find({ type: 'Text', text: /(^|\n)boom(\n|$)/ })).toBeDefined()
  expect(await band.find({ type: 'Text', text: '✗' })).toMatchObject({ props: { color: 'error' } })
  expect(String((await band.find({ key: 'tool-drawer:card:c2' }))?.props.label)).toMatch(/^▸ ⊘ 󰯠/u)
  expect(await band.find({ type: 'Text', text: '⊘' })).toMatchObject({ props: { dimColor: true } })
  expect(await band.find({ type: 'Text', text: /declined/ })).toBeUndefined()
  await band.press({ key: 'tool-drawer:card:c2' })
  expect(await band.find({ type: 'Text', text: /declined/ })).toBeDefined()
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
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▸ ■ 󰯠/u)
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
  expect(String((await (await mountBand($)).find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾ ■ 󰯠/u)
})

test('a running card counts its seconds up while the call runs', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1', 'sleep 5')
  const band = await mountBand($)
  await world.clock.advance(3000)
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toBe('▸ … 󰯠  3s  sleep 5')
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

  // From the end, the first ◀ lands on the newest prompt, the second on the one before it.
  await band.press({ key: 'prompt-jump:previous' })
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
  expect(await band.find({ key: 'tool-drawer:bar:c1:0' })).toBeDefined()
  await band.press({ key: 'tool-drawer:card:c1' })
  expect(await band.find({ key: 'tool-drawer:bar:c1:0' })).toBeUndefined()
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
  expect(endingOf({ deny: 'no' }, false)).toEqual({ status: 'declined', text: 'no' })
  expect(endingOf({ isError: true, result: undefined, text: 'The user declined' }, false).status).toBe('declined')
  expect(endingOf({ isError: true, result: undefined, text: 'Exit code 1' }, true).status).toBe('error')
  expect(endingOf({ deny: 'no' }, true).status).toBe('error')
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
  expect(cardText(done, false, 0, 80)).toBe('▸ ✓ 󰯠  0.4s  git status')
  expect(cardText(done, true, 0, 8)).toBe('▾ ✓ 󰯠  …')
  expect(cardText(done, false, 0, 15)).toBe('▸ ✓ 󰯠  0.4s  g…')
})

test('cardBody shows the last lines with a note of the earlier ones', () => {
  const lines = Array.from({ length: 40 }, (_, n) => `l${n}`)
  const body = cardBody(call({ output: lines, outputLineCount: 240 }), 80)
  expect(body.commandRows).toEqual(['ls -la'])
  expect(body.lines).toHaveLength(30)
  expect(body.lines[0]).toBe('l10')
  expect(body.earlierNote).toBe('… 210 earlier lines')
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

const layoutRows = (layout: ReturnType<typeof drawerLayout>): number =>
  1 +
  (layout.cards.length > 0 ? FRAME_ROWS : 0) +
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
  // Frame, bar, card, command row, note, then the last lines.
  expect(layout.cards[0]?.bodyLines).toBe(room - 6)
  expect(cardBody(longCall('a'), 80, room - 6).earlierNote).toBe(`… ${30 - (room - 6)} earlier lines`)
})

test('many cards in a small band show the newest under a note of the earlier ones', () => {
  const calls = Array.from({ length: 10 }, (_, n) => call({ id: `c${n}` }))
  const layout = drawerLayout(calls, [], 7)
  expect(layout.cards.map(one => one.call.id)).toEqual(['c7', 'c8', 'c9'])
  expect(layout.earlierCalls).toBe(7)
  expect(layoutRows(layout)).toBe(7)
  expect(earlierCallsText(7, 80)).toBe('… 7 earlier calls')
})

test('the newest expanded card gets the room first', () => {
  const layout = drawerLayout([longCall('a'), longCall('b')], ['a', 'b'], 12)
  expect(layout.cards.map(one => one.bodyLines)).toEqual([undefined, 5])
  expect(layoutRows(layout)).toBeLessThanOrEqual(12)
})

test('a roomy band shows a body’s 30 lines; a tiny one shows the bar alone', () => {
  expect(drawerLayout([longCall('a', 50)], ['a'], 60).cards[0]?.bodyLines).toBe(SHOWN_LINES)
  expect(drawerLayout([longCall('a')], ['a'], 3)).toEqual({ cards: [], earlierCalls: 0 })
  expect(drawerLayout([longCall('a')], [], 4).cards).toHaveLength(1)
})

test('in a 12-row band the arrows stay under an expanded 30-line card', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const out = Array.from({ length: 30 }, (_, n) => `line ${n}`).join('\n')
  await finishCall(world, await startCall($, world, 'c1', 'seq 30'), 'c1', { stdout: out })
  const band = await mountBand($, { maxRows: 12, scroll: { offset: 0, bodyRows: 11 } })
  await band.press({ key: 'tool-drawer:card:c1' })
  const frame = frameIn(await band.drawn())
  expect(rowsOf(frame)).toBeGreaterThan(FRAME_ROWS)
  expect(rowsOf(frame)).toBeLessThanOrEqual(drawerRoom(12, 0))
  expect(await band.find({ type: 'Text', text: /(^|\n)line 29(\n|$)/ })).toBeDefined()
  expect(await band.find({ type: 'Text', text: /(^|\n)line 0(\n|$)/ })).toBeUndefined()
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
  const frame = frameIn(await band.drawn())
  expect(rowsOf(frame)).toBeGreaterThan(FRAME_ROWS)
  expect(rowsOf(frame) + ARROWS_ROWS + 3).toBeLessThanOrEqual(12)
  expect(await band.find({ type: 'Text', text: /(^|\n)line 29(\n|$)/ })).toBeDefined()
})

// --- The running command on the bar ---------------------------------------

test('runningText names the newest running command and its seconds', () => {
  const calls = [call({ id: 'a', command: 'ls', status: 'running', startedAt: 0 }), call({ id: 'b', command: 'npm test\n--watch', status: 'running', startedAt: 1000 }), call({ id: 'c', status: 'done' })]
  expect(runningText(calls, 13_500)).toBe('npm test 12s')
  expect(runningText([call({ status: 'done' })], 0)).toBeUndefined()
})

test('barTexts gives the summary room first and cuts the running command', () => {
  const summary = '▸ Tool Usage (2 done · 1 running · bash)'
  expect(barTexts(summary, 'npm test 12s', 'Turn 3/8', 80)).toEqual({ summary, running: 'npm test 12s', note: undefined })
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

// --- The frame --------------------------------------------------------------

test('the open drawer is framed, in the running colour while a call runs and dim after', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1')
  const band = await mountBand($)
  const frameOf = async () => JSON.stringify(await band.drawn()).match(/"borderStyle":"round"[^}]*/)?.[0]
  expect(await frameOf()).toContain('"borderColor":"warning"')
  await finishCall(world, running, 'c1')
  expect(await frameOf()).toContain('"borderDimColor":true')
  await band.press({ key: 'tool-drawer:toggle' })
  expect(await frameOf()).toBeUndefined()
})

// --- Colour and copy --------------------------------------------------------

test('a card shows the shell icon on each card, one cell wide, its command coloured', () => {
  expect(TOOL_ICON.codePointAt(0)).toBe(0xf0be0)
  const parts = cardParts(call({ status: 'done', durationMs: 0, command: 'pwd && ls' }), false, 0, 40)
  expect(parts.head).toBe(` ${TOOL_ICON}  0.0s  `)
  expect(parts.command.map(token => [token.text, token.role])).toEqual([['pwd', 'command'], [' ', 'plain'], ['&&', 'operator'], [' ', 'plain'], ['ls', 'command']])
  expect(cardText(call({ status: 'done', durationMs: 0, command: 'pwd && ls' }), false, 0, 40)).toBe(`▸ ✓ ${TOOL_ICON}  0.0s  pwd && ls`)
})

test('a click on an open card\'s side bar collapses it; its text is no button; the copy button still copies', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1', { stdout: 'a\nb\n' })
  const band = await mountBand($)
  await band.press({ key: 'tool-drawer:card:c1' })
  expect(await band.findAll({ type: 'Button', text: 'a\nb' })).toHaveLength(0)
  expect(await band.find({ key: 'tool-drawer:copy:c1' })).toBeDefined()
  await band.press({ key: 'tool-drawer:bar:c1:2' })
  expect(await band.find({ key: 'tool-drawer:bar:c1:0' })).toBeUndefined()
  expect(await band.find({ key: 'tool-drawer:copy:c1' })).toBeUndefined()
})

test('a failed card draws its error text in the error colour', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1'), 'c1', { error: 'boom' })
  expect(await (await mountBand($)).find({ type: 'Text', text: /(^|\n)boom(\n|$)/ })).toMatchObject({ props: { color: 'error' } })
})

test('an open card’s copy button copies the command and its output', async ($, on) => {
  const world = session(on)
  const copied: string[] = []
  on('ui.copy', async (_$, e) => {
    copied.push(e.text)
    return { value: { isCopied: true } }
  })
  const toasts = recordToasts(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1', { stdout: 'a\nb\n' })
  const band = await mountBand($)
  expect(await band.find({ key: 'tool-drawer:copy:c1' })).toBeUndefined()
  await band.press({ key: 'tool-drawer:card:c1' })
  await band.press({ key: 'tool-drawer:copy:c1' })
  expect(copied).toEqual(['$ ls\na\nb'])
  expect(toasts).toEqual(['Copied the command and its output'])
  expect(copyText(call({ command: 'x', output: [] }))).toBe('$ x')
})

test('a refused copy says why', async ($, on) => {
  const world = session(on)
  on('ui.copy', async () => ({ value: { isCopied: false, reason: 'no-clipboard' as const } }))
  const toasts = recordToasts(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1')
  const band = await mountBand($)
  await band.press({ key: 'tool-drawer:card:c1' })
  await band.press({ key: 'tool-drawer:copy:c1' })
  expect(toasts).toEqual(['Copy failed: no-clipboard'])
})

// --- The remembered switch --------------------------------------------------

test('/tool-drawer off is kept across sessions and read at session start', async ($, on) => {
  const { store } = session(on)
  await command($, 'off')
  expect(store.get('toolDrawerOn')).toBe(false)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  expect((await command($, '')).text).toMatch(/is off/)
})

test('a switch kept off from an earlier session holds at start', async ($, on) => {
  const { store } = session(on)
  store.set('toolDrawerOn', false)
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  expect((await command($, '')).text).toMatch(/is off/)
  await command($, 'on')
  expect(store.get('toolDrawerOn')).toBe(true)
})

// --- Past commands read back -------------------------------------------------

const use = (id: string, command: string, outcome: { result?: unknown; text?: string; isError?: true }) => ({ tool_use_id: id, tool: 'Bash', input: { command }, ...outcome })
const PAST = [
  { role: 'user', uuid: 'p1', text: 'go', toolUses: [] },
  { role: 'assistant', uuid: 'a1', text: '', toolUses: [use('old1', 'ls', { result: { stdout: 'a\n', stderr: '' }, text: 'a' }), { tool_use_id: 'r1', tool: 'Read', input: {}, text: 'x' }] },
  { role: 'user', uuid: 'n1', text: 'notice', toolUses: [] },
  { role: 'user', uuid: 'p2', text: 'again', toolUses: [] },
  { role: 'assistant', uuid: 'a2', text: '', toolUses: [use('old2', 'false', { text: 'Exit code 1', isError: true }), use('live', 'sleep 9', {})] },
]

test('restoredCalls takes the finished shell commands under their prompts', () => {
  const calls = restoredCalls(PAST, new Set(['p1', 'p2']), new Set())
  expect(calls.map(one => [one.id, one.promptId, one.status, one.durationMs])).toEqual([
    ['old1', 'p1', 'done', -1],
    ['old2', 'p2', 'error', -1],
  ])
  expect(calls[0]?.output).toEqual(['a'])
  expect(restoredCalls(PAST, new Set(['p1', 'p2']), new Set(['old1'])).map(one => one.id)).toEqual(['old2'])
  expect(cardText(calls[0] as HeldCall, false, 0, 80)).toBe('▸ ✓ 󰯠  ls')
})

test('at session start the past shell commands join the drawer and their rows leave', async ($, on) => {
  const world = session(on)
  on('session.messages', async () => ({ value: PAST }) as never)
  await prompt($, 'p1')
  await prompt($, 'p2')
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await world.clock.advance(50)
  expect(await shows(mountToolUse($, 'old1'))).toBe(false)
  expect(await shows(mountToolUse($, 'live'))).toBe(true)
  const band = await mountBand($)
  // Past commands leave the drawer closed.
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toMatch(/^▸/)
  await band.press({ key: 'tool-drawer:toggle' })
  expect(await band.find({ key: 'tool-drawer:card:old1' })).toBeUndefined()
  expect(await band.find({ key: 'tool-drawer:card:old2' })).toBeDefined()
  await band.press({ key: 'tool-drawer:scope' })
  expect(await band.find({ key: 'tool-drawer:card:old1' })).toBeDefined()
  expect(await band.find({ key: 'tool-drawer:card:old2' })).toBeDefined()
})

// --- The command decides the hook's answer ---------------------------------

/**
 * A session whose clock the test can refuse: while `refuse.on`, `$.clock.now`
 * is denied, so the drawer's bookkeeping fails. The Bash call answers what
 * `answer` holds, or rejects with `throws`.
 */
function faultySession(on: On) {
  const refuse = { on: false }
  const answer: { stdout: string; throws?: string; refusesAfterStart?: true } = { stdout: 'fine\n' }
  let ran = 0
  on('ui.render', async () => ({ type: 'Text', props: {}, children: ['engine'] }) as unknown as RenderElement)
  on('clock.now', async () => (refuse.on ? { deny: 'clock refused' } : { value: 1000 }))
  on('tool.call', async () => {
    ran += 1
    if (answer.refusesAfterStart) refuse.on = true
    if (answer.throws !== undefined) throw new Error(answer.throws)
    return { result: { stdout: answer.stdout, stderr: '', interrupted: false } }
  })
  return { refuse, answer, runs: () => ran }
}

test('bookkeeping that fails before the run still runs the command and returns its result', async ($, on) => {
  const world = faultySession(on)
  world.refuse.on = true
  expect(await $.tool.call({ tool: 'Bash', tool_use_id: 'c1', command: 'ls' })).toMatchObject({ result: { stdout: 'fine\n' } })
  expect(world.runs()).toBe(1)
})

test('bookkeeping that fails after a successful run returns the result unchanged', async ($, on) => {
  const world = faultySession(on)
  world.answer.refusesAfterStart = true
  expect(await $.tool.call({ tool: 'Bash', tool_use_id: 'c1', command: 'ls' })).toMatchObject({ result: { stdout: 'fine\n' } })
  expect(world.runs()).toBe(1)
})

test('a command that throws surfaces its own error when the bookkeeping fails too', async ($, on) => {
  const world = faultySession(on)
  world.refuse.on = true
  world.answer.throws = 'the command failed'
  const thrown = await $.tool.call({ tool: 'Bash', tool_use_id: 'c1', command: 'boom' }).then(
    () => undefined,
    (error: unknown) => (error instanceof Error ? error.message : String(error)),
  )
  expect(thrown).toBeDefined()
  expect(thrown).not.toMatch(/clock refused/)
})

// --- Declined against failed -------------------------------------------------

test('a command that ran and failed is failed however quickly it ended, and opens its card', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls /nonexistent'), 'c1', { error: 'Exit code 1\nls: /nonexistent: No such file or directory' })
  const band = await mountBand($)
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 failed · bash)')
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾ ✗ 󰯠/u)
  expect(await band.find({ type: 'Text', text: /(^|\n)ls: \/nonexistent: No such file or directory(\n|$)/ })).toMatchObject({ props: { color: 'error' } })
})

test('a command declined at the dialog never ran and is declined', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  world.declines.add('c1')
  await (await startCall($, world, 'c1', 'rm -rf x')).running
  const band = await mountBand($)
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▸ ⊘ 󰯠/u)
})


// --- The view keeps only held calls ------------------------------------------

test('prunedView drops the ids of calls no longer held', () => {
  const view = { ...NEW_VIEW, expanded: ['a', 'gone'], collapsed: ['b', 'old'] }
  expect(prunedView(view, [call({ id: 'a' }), call({ id: 'b' })])).toMatchObject({ expanded: ['a'], collapsed: ['b'] })
})

test('a call that fails after its conversation was cleared leaves the new one alone', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const old = await startCall($, world, 'c1', 'make')
  await $.session.end({ reason: 'clear', sessionId: 'session', resume: { id: 'session' } })
  await finishCall(world, old, 'c1', { error: 'Exit code 2' })
  await prompt($, 'p2')
  // The same id in the new conversation starts with its card closed.
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1')
  const band = await mountBand($)
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▸ ✓ 󰯠/u)
})

// --- No room for cards -----------------------------------------------------

test('barTexts fits the no-room note after the running command', () => {
  const summary = '▾ Tool Usage (1 done · bash)'
  expect(barTexts(summary, undefined, 'Turn 1/1', 80, NO_ROOM_NOTE).note).toBe('no room for cards')
  expect(barTexts(summary, undefined, 'Turn 1/1', 50, NO_ROOM_NOTE).note).toBe('no room…')
  expect(barTexts(summary, undefined, 'Turn 1/1', 40, NO_ROOM_NOTE).note).toBeUndefined()
})

test('an open drawer with no room for a card says so on its bar', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', 'ls'), 'c1')
  const cramped = await mountBand($, { maxRows: 4, bodyColumns: 80 })
  expect(await cramped.find({ type: 'Text', text: 'no room for cards' })).toBeDefined()
  expect(await cramped.find({ key: 'tool-drawer:card:c1' })).toBeUndefined()
  await cramped.press({ key: 'tool-drawer:toggle' })
  expect(await cramped.find({ type: 'Text', text: 'no room for cards' })).toBeUndefined()
  await cramped.unmount()
  const roomy = await mountBand($, { bodyColumns: 80 })
  await roomy.press({ key: 'tool-drawer:toggle' })
  expect(await roomy.find({ type: 'Text', text: 'no room for cards' })).toBeUndefined()
})

// --- In the background ---------------------------------------------------------

test('a command moved to the background shows ↗, counts apart and says where its output goes', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  const running = await startCall($, world, 'c1', 'npm run dev')
  await world.clock.advance(4800)
  await finishCall(world, running, 'c1', { stdout: 'starting\n', backgroundTaskId: 'b7' })
  const band = await mountBand($, { bodyColumns: 120 })
  expect((await band.find({ key: 'tool-drawer:toggle' }))?.props.label).toBe('▾ Tool Usage (1 in background · bash)')
  expect(await band.find({ type: 'Text', text: '●' })).toBeUndefined()
  // It does not open by itself and claims no finished time.
  expect((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label).toBe('▸ ↗ 󰯠  npm run dev')
  expect(await band.find({ type: 'Text', text: '↗' })).toMatchObject({ props: { dimColor: true } })
  await band.press({ key: 'tool-drawer:card:c1' })
  expect(await band.find({ type: 'Text', text: backgroundNoteText('b7') })).toMatchObject({ props: { dimColor: true } })
  expect(await band.find({ type: 'Text', text: /(^|\n)starting(\n|$)/ })).toBeDefined()
})

test('endingOf reads a background task id; a read-back call with one is in the background too', () => {
  expect(endingOf({ result: { stdout: '', stderr: '', interrupted: false, backgroundTaskId: 'b1' } } as never)).toEqual({ status: 'background', text: '', backgroundTaskId: 'b1' })
  const past = [{ role: 'assistant', toolUses: [{ tool_use_id: 'x', tool: 'Bash', input: { command: 'sleep 99' }, result: { stdout: '', stderr: '', backgroundTaskId: 'b2' }, text: 'running in background' }] }]
  expect(restoredCalls(past, new Set(), new Set())[0]).toMatchObject({ status: 'background', backgroundTaskId: 'b2' })
})

test('a background card’s note takes its row in the layout', () => {
  const background = { ...longCall('a'), status: 'background' as const, backgroundTaskId: 'b1' }
  const layout = drawerLayout([background], ['a'], 12)
  expect(layout.cards[0]?.bodyLines).toBe(12 - FRAME_ROWS - 1 - 1 - 1 - 1 - 1)
})

// --- Restored output, open cards first, one command column ------------------

test('a restored call carries its output and its ending as the conversation read gives them', () => {
  const past = [
    { role: 'user', uuid: 'p1', toolUses: [] },
    {
      role: 'assistant',
      toolUses: [
        { tool_use_id: 'r1', tool: 'Bash', input: { command: 'echo alpha; echo beta' }, result: { stdout: 'alpha\nbeta', stderr: '', interrupted: false }, text: 'alpha\nbeta' },
        { tool_use_id: 'r2', tool: 'Bash', input: { command: 'ls /nonexistent' }, result: 'Error: Exit code 1\nls: /nonexistent: No such file or directory', text: 'Exit code 1\nls: /nonexistent: No such file or directory', isError: true as const },
      ],
    },
  ]
  const [ok, failed] = restoredCalls(past, new Set(['p1']), new Set())
  expect(ok).toMatchObject({ status: 'done', output: ['alpha', 'beta'], outputLineCount: 2, durationMs: -1, promptId: 'p1' })
  expect(failed).toMatchObject({ status: 'error', output: ['Exit code 1', 'ls: /nonexistent: No such file or directory'] })
})

test('an open card takes the room before older closed cards, the most recently opened first', () => {
  const calls = Array.from({ length: 22 }, (_, n) => call({ id: `c${n}`, status: 'done', output: ['a', 'b'], outputLineCount: 2 }))
  // 9 rows: frame and bar take 3, leaving 6 for cards.
  const layout = drawerLayout(calls, ['c3'], 9)
  const open = layout.cards.find(card => card.call.id === 'c3')
  expect(open?.bodyLines).toBe(2)
  const rows = layout.cards.length + (layout.earlierCalls > 0 ? 1 : 0) + 1 + 2
  expect(rows).toBeLessThanOrEqual(6)
  expect(layout.earlierCalls).toBe(22 - layout.cards.length)
  expect(layout.cards.at(-1)?.call.id).toBe('c21')

  const two = drawerLayout(calls, ['c3', 'c5'], 7)
  expect(two.cards.find(card => card.call.id === 'c5')?.bodyLines).toBeDefined()
  expect(two.cards.find(card => card.call.id === 'c3')?.bodyLines).toBeUndefined()
})

test('an open card without room for its body draws closed, never open and empty', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  for (const id of ['c1', 'c2', 'c3', 'c4']) await finishCall(world, await startCall($, world, id, `echo ${id}`), id, { stdout: 'x\n' })
  await (await mountBand($, { maxRows: 20 })).press({ key: 'tool-drawer:card:c1' })
  // In a smaller band the oldest card, open, still shows with its body; closed cards give way.
  const band = await mountBand($, { maxRows: 9 })
  expect(String((await band.find({ key: 'tool-drawer:card:c1' }))?.props.label)).toMatch(/^▾/)
  expect(await band.find({ key: 'tool-drawer:bar:c1:0' })).toBeDefined()
  expect(await band.find({ key: 'tool-drawer:card:c2' })).toBeUndefined()
  expect(await band.find({ key: 'tool-drawer:card:c4' })).toBeDefined()

  const tiny = drawerLayout([call({ id: 'a', output: ['x'], outputLineCount: 1 })], ['a'], 4)
  expect(tiny.cards).toEqual([{ call: expect.objectContaining({ id: 'a' }), bodyLines: undefined }])
  const cramped = await mountBand($, { maxRows: 5 })
  for (const found of await cramped.findAll({ type: 'Button' })) {
    const label = String(found.props.label)
    if (label.startsWith('▾ ✓')) expect(await cramped.find({ key: String(found.props.key).replace('card', 'body') + ':command' })).toBeDefined()
  }
})

test('cards with and without a time start their commands at one column', () => {
  const timed = call({ id: 't', status: 'done', durationMs: 5900, command: 'git status' })
  const restored = call({ id: 'r', status: 'done', durationMs: -1, command: 'ls' })
  const timeCells = elapsedCells([timed, restored], 0)
  expect(timeCells).toBe(4)
  const a = cardText(timed, false, 0, 80, timeCells)
  const b = cardText(restored, false, 0, 80, timeCells)
  expect(a).toBe(`▸ ✓ ${TOOL_ICON}  5.9s  git status`)
  expect(b).toBe(`▸ ✓ ${TOOL_ICON}        ls`)
  expect(a.indexOf('git')).toBe(b.indexOf('ls'))
})

// --- The open card's command and output blocks ------------------------------

test('wrapCells splits a line by cells and keeps an empty line as one row', () => {
  expect(wrapCells('abcdefg', 3)).toEqual(['abc', 'def', 'g'])
  expect(wrapCells('', 3)).toEqual([''])
  expect(wrapCells('漢字漢', 3)).toEqual(['漢', '字', '漢'])
})

test('the command block keeps line breaks, wraps long lines, and stops at COMMAND_ROWS with a count of the rest', () => {
  expect(commandBlock("python3 - <<'EOF'\nprint(1)\nEOF", 40)).toEqual({ rows: ["python3 - <<'EOF'", 'print(1)', 'EOF'], moreRows: 0 })
  expect(commandBlock('x'.repeat(25), 12).rows).toEqual(['x'.repeat(10), 'x'.repeat(10), 'x'.repeat(5)])
  const long = commandBlock(Array.from({ length: 12 }, (_, n) => `line ${n}`).join('\n'), 40)
  expect(long.rows).toHaveLength(COMMAND_ROWS)
  expect(long.moreRows).toBe(12 - COMMAND_ROWS)
  const body = cardBody(call({ command: Array.from({ length: 12 }, (_, n) => `l${n}`).join('\n'), output: ['out'], outputLineCount: 1 }), 40)
  expect(body.commandNote).toBe(`… ${12 - COMMAND_ROWS} more lines`)
  expect(bodyRows(body)).toBe(COMMAND_ROWS + 1 + 1)
})

test('output blocks draw a diff hunk header as a plain row and recount a cut hunk', () => {
  const lines = ['diff --git a/V b/V', '--- a/V', '+++ b/V', '@@ -1,5 +1,5 @@ top', ' a', '-b', '+c']
  const blocks = outputBlocks(lines, { format: 'diff' })
  expect(blocks).toEqual([
    { lines: ['diff --git a/V b/V', '--- a/V', '+++ b/V', '@@ -1,5 +1,5 @@ top'] },
    { source: '@@ -1,2 +1,2 @@ top\n a\n-b\n+c', language: { format: 'diff' } },
  ])
  expect(outputBlocks(['{"a": 1}'], { language: 'json' })).toEqual([{ source: '{"a": 1}', language: { language: 'json' } }])
  expect(outputBlocks(['x'], undefined)).toEqual([{ lines: ['x'] }])
})

test('rowsOf counts a Code by its drawn lines: a diff\'s hunk headers take none', () => {
  expect(rowsOf({ type: 'Code', props: { source: 'a\nb\nc' } })).toBe(3)
  expect(rowsOf({ type: 'Code', props: { source: '@@ -1 +1 @@\n-a\n+b', format: 'diff' } })).toBe(2)
  expect(rowsOf({ type: 'Box', props: { flexDirection: 'column' }, children: [{ type: 'Text', props: {}, children: ['x\ny'] }, { type: 'Code', props: { source: 'p\nq' } }] })).toBe(4)
})

test('an open card\'s bar has one row a body row, and the drawn body fits the band', async ($, on) => {
  const world = session(on)
  await prompt($, 'p1')
  await finishCall(world, await startCall($, world, 'c1', "cat <<'EOF'\na\nb\nEOF"), 'c1', { stdout: Array.from({ length: 40 }, (_, n) => `l${n}`).join('\n') })
  const band = await mountBand($, { maxRows: 16 })
  await band.press({ key: 'tool-drawer:card:c1' })
  const bars = await band.findAll({ type: 'Button', text: '┃' })
  const frame = frameIn(await band.drawn())
  expect(rowsOf(frame)).toBeLessThanOrEqual(drawerRoom(16, 0))
  // Frame, bar line and card row, then one bar row per body row.
  expect(bars.length).toBe(rowsOf(frame) - FRAME_ROWS - 2)
  expect(await band.find({ type: 'Code' })).toMatchObject({ props: { source: "cat <<'EOF'\na\nb\nEOF", language: 'bash', wrap: 'truncate-end' } })
})

const drawnRows = (blocks: ReturnType<typeof outputBlocks>) =>
  blocks.reduce((sum, block) => sum + ('lines' in block ? block.lines.length : rowsOf({ type: 'Code', props: { source: block.source, ...block.language } })), 0)

test('hunk lines that read like file headers stay in their hunk, one row each', () => {
  const lines = ['--- a/a.sql', '+++ b/a.sql', '@@ -1,3 +1,3 @@', '--- old sql comment', '-i++;', '+new sql', '+++i;', ' keep']
  const blocks = outputBlocks(lines, { format: 'diff' })
  expect(blocks).toEqual([
    { lines: ['--- a/a.sql', '+++ b/a.sql', '@@ -1,3 +1,3 @@'] },
    { source: '@@ -1,3 +1,3 @@\n--- old sql comment\n-i++;\n+new sql\n+++i;\n keep', language: { format: 'diff' } },
  ])
  expect(drawnRows(blocks)).toBe(lines.length)
})

test('a no-newline marker keeps the hunk whole and draws as a plain row after it', () => {
  const lines = ['@@ -1 +1 @@', '-old', '\\ No newline at end of file', '+new', '\\ No newline at end of file', 'diff --git a/c b/c']
  const blocks = outputBlocks(lines, { format: 'diff' })
  expect(blocks).toEqual([
    { lines: ['@@ -1 +1 @@'] },
    { source: '@@ -1,1 +1,1 @@\n-old\n+new', language: { format: 'diff' } },
    { lines: ['\\ No newline at end of file', '\\ No newline at end of file', 'diff --git a/c b/c'] },
  ])
  expect(drawnRows(blocks)).toBe(lines.length)
})
