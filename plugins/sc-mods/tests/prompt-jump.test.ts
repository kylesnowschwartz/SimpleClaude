import type { On, PromptOrigin, SessionMessage } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import {
  anchorOf,
  entriesOnScreen,
  jumpTarget,
  positionText,
  unseenEdge,
  type DrawnEntry,
  type Placement,
  type PlacedEntry,
} from '../hooks/prompt-jump'
import { rowsOfTranscriptFields, TranscriptOrder } from '../hooks/transcript-order'
import { drawsEngineDefaults, ok, recordToasts } from './support'

const BAND = {
  hasSurvey: false,
  isWorking: false,
  maxRows: 10,
  bodyColumns: 95,
  scroll: { offset: 0, bodyRows: 10 },
  view: {},
}

const mountBand = ($: Engine, props: Partial<typeof BAND> = {}) =>
  $.ui.mount({ plugin: 'sc-mods', surface: 'terminal', component: 'AbovePrompt', props: { ...BAND, ...props } })

const COMPOSER: PromptOrigin = { kind: 'composer' }
const POSITION = { type: 'Text' }
const HOME = '/home/person'
const TRANSCRIPT = `${HOME}/.claude/projects/-work/session.jsonl`
// Long enough for every wait the plugin starts after a draw or a load.
const SETTLE_MS = 200

type OnScreen = { first: number; last: number; of: number } | null
const TOP_SHOWN: OnScreen = { first: 0, last: 1, of: 2 }

// --- The session beneath the plugin -------------------------------------

/** A row the session stores: prompts are named `p…`, replies `r…`. */
type Row = { id: string; text: string; toolUseIds?: string[] }

const isPromptId = (id: string) => id.startsWith('p')
const row = (id: string, text = isPromptId(id) ? `prompt ${id}` : `reply ${id}`): Row => ({ id, text })
const rows = (...ids: string[]) => ids.map(id => row(id))

/** What `grep -n -o` prints of a transcript file holding the rows. */
function transcriptFields(kept: readonly Row[]): string {
  return kept
    .flatMap(({ id, toolUseIds = [] }, at) => [
      `${at + 1}:"uuid":"${id}"`,
      ...(isPromptId(id) ? [`${at + 1}:"origin":{"kind":"human"`] : []),
      ...toolUseIds.map(toolUseId => `${at + 1}:"type":"tool_use","id":"${toolUseId}"`),
    ])
    .join('\n')
}

const messageOf = ({ id, text, toolUseIds = [] }: Row): SessionMessage => ({
  role: isPromptId(id) ? 'user' : 'assistant',
  text,
  toolUses: toolUseIds.map(tool_use_id => ({ tool_use_id }) as SessionMessage['toolUses'][number]),
})

// The newest messages `$.session.messages()` returns.
const MESSAGE_WINDOW = 4096

type StoredSession = { rows: Row[]; clock: MockClock }

/**
 * Stands for the session: the rows its transcript file kept before the
 * plugin loaded, and every row it holds, read back as messages.
 */
function storedSession(on: On, kept: readonly Row[] = []): StoredSession {
  drawsEngineDefaults(on)
  const session: StoredSession = { rows: [...kept], clock: mock.clock(on) }
  mock.env(on, { HOME })
  on('process.run', async (_$, e) => ({ value: ok(e.argv[0] === 'find' ? `${TRANSCRIPT}\n` : transcriptFields(kept)) }))
  on('session.messages', async () => ({ value: session.rows.slice(-MESSAGE_WINDOW).map(messageOf) }))
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.id', async () => ({ value: 'session' }))
  return session
}

const settle = (session: StoredSession) => session.clock.advance(SETTLE_MS)

/** The plugin loading into a session that kept rows before it: a restart, a resume or a reload. */
async function load($: Engine, session: StoredSession) {
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await settle(session)
}

/** The session storing a row while the plugin runs. */
async function store($: Engine, session: StoredSession, stored: Row) {
  session.rows.push(stored)
  const isPrompt = isPromptId(stored.id)
  const toolUses = (stored.toolUseIds ?? []).map(id => ({ type: 'tool_use', id, name: 'Read', input: {} }))
  await $.session.append({
    message: {
      type: isPrompt ? 'user' : 'assistant',
      role: isPrompt ? 'user' : 'assistant',
      content: [{ type: 'text', text: stored.text }, ...toolUses],
    },
    door: isPrompt ? 'prompt' : 'response',
    origin: isPrompt ? COMPOSER : { kind: 'model', model: 'claude' },
    uuid: stored.id,
  })
}

async function storeAll($: Engine, session: StoredSession, stored: readonly Row[]) {
  for (const each of stored) await store($, session, each)
}

// --- What the screen draws ----------------------------------------------

type PromptDraw = { origin?: PromptOrigin; onScreen?: OnScreen; isExpanded?: boolean; text?: string }

const drawPrompt = ($: Engine, requestId: string, { origin = COMPOSER, onScreen = null, isExpanded = true, text }: PromptDraw = {}) =>
  $.ui.render({
    surface: 'terminal',
    component: 'UserMessage',
    requestId,
    props: { text: text ?? row(requestId).text, origin, isExpanded, onScreen },
  })

const drawReply = ($: Engine, requestId: string, onScreen: OnScreen = null, text = row(requestId).text) =>
  $.ui.render({
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId,
    props: { text, isFirstOfReply: true, onScreen },
  })

const drawTool = ($: Engine, toolUseId: string, onScreen: OnScreen = null) =>
  $.ui.render({
    surface: 'terminal',
    component: 'ToolUse',
    requestId: toolUseId,
    props: { tool_use_id: toolUseId, tool: 'Read', input: {}, isRunning: false, isErrored: false, isInterrupted: false, onScreen },
  })

/** Draws each row off screen, as the rows around the view are. */
async function drawAll($: Engine, ids: readonly string[]) {
  for (const id of ids) await (isPromptId(id) ? drawPrompt($, id) : drawReply($, id))
}

async function bandCount($: Engine) {
  return (await (await mountBand($)).find(POSITION))?.text
}

// --- The band -----------------------------------------------------------

test('the band draws ◀ on hotkey 1 and ▶ on hotkey 2', async $ => {
  const band = await mountBand($)
  expect((await band.find({ key: 'prompt-jump:previous' }))?.props).toMatchObject({ label: '◀', hotkey: '1' })
  expect((await band.find({ key: 'prompt-jump:next' }))?.props).toMatchObject({ label: '▶', hotkey: '2' })
})

test('the band yields to a survey', async ($, on) => {
  drawsEngineDefaults(on)
  const band = await mountBand($, { hasSurvey: true })
  expect(await band.find({ key: 'prompt-jump:previous' })).toBeUndefined()
})

test('the band stays out of an agent transcript', async ($, on) => {
  drawsEngineDefaults(on)
  const band = await mountBand($, { view: { agentId: 'agent-1' } })
  expect(await band.find({ key: 'prompt-jump:previous' })).toBeUndefined()
})

test('with no prompt known, ◀ says there is no earlier prompt and no count shows', async ($, on) => {
  const toasts = recordToasts(on)
  const band = await mountBand($)
  expect(await band.find(POSITION)).toBeUndefined()
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts).toEqual(['No earlier prompt'])
})

test('the band counts the prompt the view is on among the prompts known, dim between the arrows', async ($, on) => {
  const session = storedSession(on)
  await storeAll($, session, rows('p1', 'r1', 'p2', 'r2'))
  await drawAll($, ['p1', 'r1', 'p2', 'r2'])
  await settle(session)
  const band = await mountBand($)
  const leaves = (await band.findAll({})).filter(element => element.type !== 'Box')
  expect(leaves.map(element => element.type)).toEqual(['Button', 'Text', 'Button'])
  expect((await band.find(POSITION))?.text).toBe('2/2')
  expect((await band.find(POSITION))?.props).toMatchObject({ dimColor: true })
})

test('the in-flight prompt, rows the person did not type, and queued prompts are not counted', async ($, on) => {
  const session = storedSession(on)
  const toasts = recordToasts(on)
  await storeAll($, session, rows('p1', 'r1'))
  await drawAll($, ['p1', 'r1'])
  await drawPrompt($, 'placeholder', { text: 'prompt p2' })
  await drawPrompt($, 'notice', { origin: { kind: 'task-notification' } as PromptOrigin })
  await drawPrompt($, 'queued-a', { isExpanded: false, onScreen: TOP_SHOWN, text: 'prompt p3' })
  await drawPrompt($, 'queued-b', { onScreen: TOP_SHOWN, text: 'prompt p3' })
  await settle(session)
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('1/1')
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts).toEqual(['No later prompt'])
})

test('the count follows a reply scrolling into view, with no change to the band', async ($, on) => {
  const session = storedSession(on)
  await storeAll($, session, rows('p1', 'r1', 'p2', 'r2'))
  await drawAll($, ['p1', 'r1', 'p2', 'r2'])
  await settle(session)
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('2/2')

  await drawReply($, 'r1', { first: 10, last: 40, of: 80 })
  await settle(session)
  expect((await band.find(POSITION))?.text).toBe('1/2')
})

// The kit has no transcript to scroll, so its scroll fails the way a surface without one does.
test('a scroll that does not move the transcript toasts why', async ($, on) => {
  const session = storedSession(on)
  const toasts = recordToasts(on)
  await storeAll($, session, rows('p1', 'p2'))
  await drawAll($, ['p1', 'p2'])
  await settle(session)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
})

// --- Placing drawn rows in the transcript -------------------------------

// Claude Code draws the rows near the view after a reload, and an older row
// only once the view scrolls up to it, so it is drawn after newer rows.
test('an older prompt drawn after a reload, above the rows on screen, counts first', async ($, on) => {
  const session = storedSession(on, rows('p1', 'r1', 'p2', 'r2'))
  await load($, session)
  await drawAll($, ['r1', 'p2', 'r2'])
  await settle(session)
  await drawPrompt($, 'p1', { onScreen: TOP_SHOWN })
  await drawReply($, 'r1', { first: 0, last: 40, of: 80 })
  await settle(session)
  expect(await bandCount($)).toBe('1/2')
})

test('rows stored after a reload follow the rows the transcript file kept', async ($, on) => {
  const session = storedSession(on, rows('p1', 'r1'))
  await load($, session)
  await storeAll($, session, rows('p2', 'r2'))
  await drawAll($, ['r2', 'p2', 'r1'])
  await drawPrompt($, 'p1', { onScreen: TOP_SHOWN })
  await settle(session)
  expect(await bandCount($)).toBe('1/2')
})

test('the same reply text in two turns counts under the turn it was drawn in', async ($, on) => {
  const kept = [row('p1', 'first'), row('r1', 'Done.'), row('p2', 'second'), row('r2', 'Done.')]
  const session = storedSession(on, kept)
  await load($, session)
  await drawPrompt($, 'p2', { text: 'second' })
  await drawReply($, 'r2', null, 'Done.')
  await settle(session)
  await drawReply($, 'r1', { first: 0, last: 1, of: 2 }, 'Done.')
  await settle(session)
  await drawPrompt($, 'p1', { text: 'first' })
  await settle(session)
  expect(await bandCount($)).toBe('1/2')
})

test('the same prompt text sent three times counts each in its own place', async ($, on) => {
  const kept = [row('p0', 'yes'), row('r0'), row('p1', 'yes'), row('r1'), row('p2', 'yes'), row('r2')]
  const session = storedSession(on, kept)
  await load($, session)
  await drawReply($, 'r1')
  await drawPrompt($, 'p2', { text: 'yes' })
  await drawReply($, 'r2')
  await settle(session)
  await drawPrompt($, 'p1', { text: 'yes' })
  await settle(session)
  await drawPrompt($, 'p0', { text: 'yes', onScreen: TOP_SHOWN })
  await drawReply($, 'r0')
  await settle(session)
  expect(await bandCount($)).toBe('1/3')
})

// `$.session.messages()` returns the newest 4096 messages, so each message
// stored past that moves every message's index in it.
test('rows drawn on either side of the 4096th stored message keep transcript order', async ($, on) => {
  const kept = Array.from({ length: MESSAGE_WINDOW }, (_, at) => row(at % 2 === 0 ? `p${at}` : `r${at}`))
  const session = storedSession(on, kept)
  await load($, session)
  await drawPrompt($, 'p4000')
  await drawReply($, 'r4095')
  await settle(session)
  await storeAll(
    $,
    session,
    Array.from({ length: 100 }, (_, offset) => row(offset % 2 === 0 ? `p${4096 + offset}` : `r${4096 + offset}`)),
  )
  await drawPrompt($, 'p4050', { onScreen: TOP_SHOWN })
  await drawReply($, 'r4195')
  await settle(session)
  expect(await bandCount($)).toBe('2/2')
})

test('a tool call row is placed by its call id', async ($, on) => {
  const session = storedSession(on, [row('p1'), { ...row('r1'), toolUseIds: ['toolu_1'] }])
  await load($, session)
  await drawPrompt($, 'p1')
  await drawTool($, 'toolu_1', TOP_SHOWN)
  await settle(session)
  expect(await bandCount($)).toBe('1/1')
})

test('grep output of a transcript file reads back as its rows, a subagent row and a reminder left out of the prompts', () => {
  const fields = [
    '3:"uuid":"a"',
    '3:"origin":{"kind":"human"',
    '4:"uuid":"b"',
    '4:"type":"tool_use","id":"toolu_9"',
    '5:"isSidechain":true',
    '5:"uuid":"c"',
    '6:"isMeta":true',
    '6:"origin":{"kind":"human"',
    '6:"uuid":"d"',
  ].join('\n')
  expect(rowsOfTranscriptFields(fields)).toEqual([
    { ids: ['a'], isPrompt: true },
    { ids: ['b', 'toolu_9'], isPrompt: false },
    { ids: ['d'], isPrompt: false },
  ])
})

// --- The view's place among the prompts ---------------------------------

const OFF: Placement = { kind: 'offScreen' }

/** On screen from line `firstLine`, its last line shown, reported at `reportedAt`. */
const shownFrom = (firstLine: number, { isBottomShown = true, reportedAt = 0 } = {}): Placement => ({
  kind: 'onScreen',
  firstLine,
  isBottomShown,
  reportedAt,
})
const TOP = shownFrom(0)

const prompt = (requestId: string, placement: Placement = OFF): DrawnEntry => ({ requestId, isPrompt: true, placement })
const reply = (requestId: string, placement: Placement = OFF): DrawnEntry => ({ requestId, isPrompt: false, placement })

const idOf = (entry: DrawnEntry | undefined) => entry?.requestId

test('a step back from the newest prompt, its top out of view, lands on its own top', () => {
  expect(idOf(jumpTarget([prompt('p1'), prompt('p2', shownFrom(3))], undefined, -1))).toBe('p2')
})

test('a step back from a prompt whose top shows lands on the one before', () => {
  expect(idOf(jumpTarget([prompt('p1'), prompt('p2', TOP)], undefined, -1))).toBe('p1')
})

test('a step on counts from the topmost prompt on screen', () => {
  expect(idOf(jumpTarget([prompt('p1'), prompt('p2', TOP), prompt('p3', TOP), prompt('p4')], undefined, 1))).toBe('p3')
})

test('with no row on screen, a step counts from the prompt last jumped to', () => {
  const prompts = [prompt('p1'), prompt('p2'), prompt('p3')]
  expect(idOf(jumpTarget(prompts, 'p1', 1))).toBe('p2')
  expect(idOf(jumpTarget(prompts, 'p2', -1))).toBe('p2')
})

test('with no row on screen and no jump yet, a step back lands on the newest prompt', () => {
  expect(idOf(jumpTarget([prompt('p1'), prompt('p2')], undefined, -1))).toBe('p2')
})

test('there is nothing before the first prompt or after the last', () => {
  expect(jumpTarget([prompt('p1', TOP), prompt('p2')], undefined, -1)).toBeUndefined()
  expect(jumpTarget([prompt('p1'), prompt('p2', TOP)], undefined, 1)).toBeUndefined()
  expect(jumpTarget([], undefined, 1)).toBeUndefined()
})

test('the anchor is the topmost prompt on screen, noting whether its top shows', () => {
  expect(anchorOf([prompt('p1'), prompt('p2', TOP), prompt('p3', TOP)], undefined)).toEqual({ index: 1, isTopShown: true })
  expect(anchorOf([prompt('p1'), prompt('p2', shownFrom(4))], 'p1')).toEqual({ index: 1, isTopShown: false })
})

test('with no row on screen, the anchor is the prompt last jumped to, else the newest', () => {
  const prompts = [prompt('p1'), prompt('p2'), prompt('p3')]
  expect(anchorOf(prompts, 'p1')).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf(prompts, undefined)).toEqual({ index: 2, isTopShown: false })
  expect(anchorOf([], undefined)).toBeUndefined()
})

test('the prompt last jumped to stays the anchor when an older prompt becomes known', () => {
  expect(anchorOf([prompt('p2'), prompt('p3')], 'p2')).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf([prompt('p1'), prompt('p2'), prompt('p3')], 'p2')).toEqual({ index: 1, isTopShown: false })
})

test('the count reads the anchor and the prompts known', () => {
  expect(positionText([prompt('p1'), prompt('p2', TOP), prompt('p3')], undefined)).toBe('2/3')
  expect(positionText([], undefined)).toBe('')
})

test('with only a reply on screen, the anchor is the prompt that owns it', () => {
  const entries = [prompt('p1'), reply('r1'), prompt('p2'), reply('r2', shownFrom(7)), prompt('p3'), reply('r3')]
  expect(anchorOf(entries, 'p3')).toEqual({ index: 1, isTopShown: false })
  expect(positionText(entries, 'p3')).toBe('2/3')
})

test('a step back from a reply lands on the top of the prompt that owns it', () => {
  const entries = [prompt('p1'), reply('r1'), prompt('p2'), reply('r2', shownFrom(7)), prompt('p3')]
  expect(idOf(jumpTarget(entries, 'p3', -1))).toBe('p2')
  expect(idOf(jumpTarget(entries, 'p3', 1))).toBe('p3')
})

test('a reply on screen above every known prompt puts the view before the first of them', () => {
  const entries = [reply('r5', TOP), prompt('p6'), reply('r6')]
  expect(anchorOf(entries, 'p6')).toEqual({ index: -1, isTopShown: false })
  expect(jumpTarget(entries, 'p6', -1)).toBeUndefined()
  expect(idOf(jumpTarget(entries, 'p6', 1))).toBe('p6')
  expect(positionText(entries, 'p6')).toBe('')
})

// A jump moves the view past a tall reply in one step; the reply was at no
// edge of the viewport, so its last report still has its middle on screen.
test('a row the view jumped past, still reported on screen, does not hold the anchor', () => {
  const tallReplyBefore = reply('r5', shownFrom(0, { isBottomShown: false, reportedAt: 1 }))
  const nextPrompt = prompt('p6', shownFrom(0, { reportedAt: 2 }))
  const nextReply = reply('r6', shownFrom(0, { isBottomShown: false, reportedAt: 3 }))
  const entries = [prompt('p5'), tallReplyBefore, nextPrompt, nextReply]
  expect(entriesOnScreen(entries).map(entry => entry.requestId)).toEqual(['p6', 'r6'])
  expect(anchorOf(entries, 'p5')).toEqual({ index: 1, isTopShown: true })
  expect(positionText(entries, 'p5')).toBe('2/2')
  expect(jumpTarget(entries, 'p5', 1)).toBeUndefined()
  expect(idOf(jumpTarget(entries, 'p5', -1))).toBe('p5')
})

test('a row reported off screen between two shown rows leaves out the older report', () => {
  const upper = prompt('p1', shownFrom(0, { reportedAt: 1 }))
  const lower = prompt('p3', shownFrom(0, { reportedAt: 5 }))
  expect(anchorOf([upper, reply('r1'), lower], undefined)).toEqual({ index: 1, isTopShown: true })
})

test('the topmost row on screen decides, a reply above a prompt included', () => {
  expect(anchorOf([prompt('p1'), reply('r1', shownFrom(30)), prompt('p2', TOP)], undefined)).toEqual({ index: 0, isTopShown: false })
})

// --- Past the drawn rows ------------------------------------------------

/** The transcript's rows in order, the drawn ones placed among them. */
function placedAmong(storedIds: readonly string[], drawn: readonly DrawnEntry[]) {
  const order = TranscriptOrder.of(storedIds.map(id => ({ ids: [id], isPrompt: isPromptId(id) })))
  const placed: PlacedEntry[] = drawn.map(entry => ({ place: order.placeOf([entry.requestId]) ?? -1, entry }))
  return { order, placed }
}

test('past the drawn rows, a step moves the edge row so the turns beyond it get drawn', () => {
  const { order, placed } = placedAmong(['p1', 'r1', 'p2', 'r2', 'p3', 'r3', 'p4', 'r4'], [prompt('p3', TOP), reply('r3')])
  expect(idOf(unseenEdge(placed, order, -1))).toBe('p3')
  expect(idOf(unseenEdge(placed, order, 1))).toBe('r3')
})

test('at the ends of the session, there is nothing past the drawn rows', () => {
  const drawn = [prompt('p1', TOP), reply('r1'), prompt('p2'), reply('r2')]
  const { order, placed } = placedAmong(['p1', 'r1', 'p2', 'r2'], drawn)
  expect(unseenEdge(placed, order, -1)).toBeUndefined()
  expect(unseenEdge(placed, order, 1)).toBeUndefined()
})

test('a reply drawn at the top edge has its prompt above it to draw', () => {
  const { order, placed } = placedAmong(['p1', 'r1', 'p2'], [reply('r1', TOP), prompt('p2')])
  expect(idOf(unseenEdge(placed, order, -1))).toBe('r1')
})
