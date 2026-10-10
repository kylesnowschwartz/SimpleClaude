import type { On, PromptOrigin, RenderElement, SessionMessage } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import {
  anchorOf,
  entriesOnScreen,
  jumpTarget,
  isLastPromptAtEnd,
  positionText,
  type DrawnEntry,
  type Placement,
  type PromptView,
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

/** The rows the current conversation holds, and each transcript file's rows by path. */
type StoredSession = { rows: Row[]; files: Map<string, readonly Row[]>; clock: MockClock }

/**
 * Stands for the session: the rows its transcript file kept before the
 * plugin loaded, and every row the conversation holds, read back as messages.
 */
function storedSession(on: On, kept: readonly Row[] = [], { readMs = 0 } = {}): StoredSession {
  drawsEngineDefaults(on)
  const session: StoredSession = { rows: [...kept], files: new Map([[TRANSCRIPT, kept]]), clock: mock.clock(on) }
  mock.env(on, { HOME })
  on('process.run', async (_$, e) => {
    if (e.argv[0] === 'find') return { value: ok(`${TRANSCRIPT}\n`) }
    if (readMs > 0) await session.clock.sleep(readMs)
    return { value: ok(transcriptFields(session.files.get(e.argv.at(-1) ?? '') ?? [])) }
  })
  on('session.messages', async () => ({ value: session.rows.slice(-MESSAGE_WINDOW).map(messageOf) }))
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  on('session.id', async () => ({ value: 'session' }))
  on('classic.SessionStart', async () => ({}))
  return session
}

/** `/clear`: the conversation ends and the process goes on with an empty one. */
async function clear($: Engine, session: StoredSession) {
  await $.session.end({ reason: 'clear', sessionId: 'session', resume: { id: 'session' } })
  session.rows = []
  await $.classic.SessionStart({ source: 'clear' })
  await settle(session)
}

/** `/resume`: the conversation ends and the process goes on with a stored one. */
async function resume($: Engine, session: StoredSession, resumed: readonly Row[]) {
  const transcript = `${HOME}/.claude/projects/-work/resumed.jsonl`
  await $.session.end({ reason: 'resume', sessionId: 'session', resume: { id: 'session' } })
  session.rows = [...resumed]
  session.files.set(transcript, resumed)
  await $.classic.SessionStart({ source: 'resume', transcript_path: transcript })
  await settle(session)
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

test('the band draws ◀ on hotkey 1 and ▶ on hotkey 2', async ($, on) => {
  drawsEngineDefaults(on)
  const band = await mountBand($)
  expect((await band.find({ key: 'prompt-jump:previous' }))?.props).toMatchObject({ label: '◀', hotkey: '1' })
  expect((await band.find({ key: 'prompt-jump:next' }))?.props).toMatchObject({ label: '▶', hotkey: '2' })
})

test('the band keeps what the plugins beneath it draw, above the arrows', async ($, on) => {
  on('ui.render', { component: 'AbovePrompt' }, async () => ({
    type: 'Box',
    props: { key: 'beneath' },
    children: [],
  }) as unknown as RenderElement)
  const band = await mountBand($)
  expect(await band.find({ key: 'beneath' })).toBeDefined()
  expect(await band.find({ key: 'prompt-jump:previous' })).toBeDefined()
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
  drawsEngineDefaults(on)
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

test('a new count draws the band again, and none of the transcript’s rows', async ($, on) => {
  const replyDraws: string[] = []
  on('ui.render', { component: 'AssistantMessage' }, async (_$, e, next) => {
    replyDraws.push(e.requestId)
    return next(e)
  })
  const session = storedSession(on)
  await storeAll($, session, rows('p1', 'r1', 'p2', 'r2'))
  await drawAll($, ['p1', 'p2'])
  await $.ui.mount({
    plugin: 'sc-mods',
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId: 'r2',
    props: { text: 'reply r2', isFirstOfReply: true, onScreen: null },
  })
  await settle(session)
  const band = await mountBand($)
  replyDraws.length = 0

  await drawReply($, 'r1', { first: 10, last: 40, of: 80 })
  await settle(session)
  expect((await band.find(POSITION))?.text).toBe('1/2')
  expect(replyDraws).toEqual(['r1'])
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

test('a compaction stored while the plugin runs leaves the prompts before it uncounted', async ($, on) => {
  const session = storedSession(on)
  await load($, session)
  await storeAll($, session, rows('p1', 'r1'))
  await $.session.append({
    message: { type: 'system', name: 'compact_boundary', content: [{ type: 'text', text: 'Conversation compacted' }] },
    door: 'notice',
    origin: { kind: 'engine' },
    uuid: 'boundary',
  } as Parameters<Engine['session']['append']>[0])
  await storeAll($, session, rows('p2', 'r2'))
  await drawPrompt($, 'p2', { onScreen: TOP_SHOWN })
  await drawReply($, 'r2')
  await settle(session)
  expect(await bandCount($)).toBe('1/1')
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
  // 2048 prompts kept, 50 stored after; p4050 is the 2026th.
  expect(await bandCount($)).toBe('2026/2098')
})

test('after a reload at the bottom, the count is among every stored prompt, not only the drawn ones', async ($, on) => {
  const session = storedSession(on, rows('p1', 'r1', 'p2', 'r2', 'p3', 'r3', 'p4', 'r4', 'p5', 'r5', 'p6', 'r6', 'p7', 'r7', 'p8', 'r8'))
  await load($, session)
  await drawAll($, ['p6', 'r6'])
  await drawReply($, 'r7', { first: 20, last: 40, of: 41 })
  await drawPrompt($, 'p8', { onScreen: { first: 0, last: 0, of: 1 } })
  await drawReply($, 'r8', { first: 0, last: 2, of: 3 })
  await drawPrompt($, 'p7')
  await settle(session)
  expect(await bandCount($)).toBe('8/8')
})

test('while the transcript is still being read, no count shows', async ($, on) => {
  const session = storedSession(on, rows('p1', 'r1', 'p2', 'r2'), { readMs: 1000 })
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await storeAll($, session, rows('p3'))
  await drawPrompt($, 'p3', { onScreen: TOP_SHOWN })
  await settle(session)
  expect(await bandCount($)).toBeUndefined()

  await session.clock.advance(1000)
  expect(await bandCount($)).toBe('3/3')
})

test('a tool call row is placed by its call id', async ($, on) => {
  const session = storedSession(on, [row('p1'), { ...row('r1'), toolUseIds: ['toolu_1'] }])
  await load($, session)
  await drawPrompt($, 'p1')
  await drawTool($, 'toolu_1', TOP_SHOWN)
  await settle(session)
  expect(await bandCount($)).toBe('1/1')
})

test('after /clear, the count starts over with the new conversation', async ($, on) => {
  const session = storedSession(on)
  await storeAll($, session, rows('p1', 'r1', 'p2', 'r2'))
  await drawAll($, ['p1', 'r1', 'p2', 'r2'])
  await settle(session)
  await clear($, session)
  expect(await bandCount($)).toBeUndefined()

  await storeAll($, session, rows('p3', 'r3'))
  await drawPrompt($, 'p3', { onScreen: TOP_SHOWN })
  await drawReply($, 'r3')
  await settle(session)
  expect(await bandCount($)).toBe('1/1')
})

test('after /resume, the count is the resumed conversation’s', async ($, on) => {
  const session = storedSession(on)
  await storeAll($, session, rows('p1', 'r1'))
  await drawAll($, ['p1', 'r1'])
  await settle(session)
  await resume($, session, rows('p7', 'r7', 'p8', 'r8'))

  await drawPrompt($, 'p8', { onScreen: TOP_SHOWN })
  await drawReply($, 'r8')
  await drawPrompt($, 'p7')
  await settle(session)
  expect(await bandCount($)).toBe('2/2')
})

/** What `grep -n -o` prints of a transcript line: its parent link, its id, and a person's origin for a `p…` row. */
const linkedLine = (line: number, id: string, parent: string | null) =>
  [`${line}:"parentUuid":${parent === null ? 'null' : `"${parent}"`}`, `${line}:"uuid":"${id}"`, ...(isPromptId(id) ? [`${line}:"origin":{"kind":"human"`] : [])].join('\n')

const idsOfFields = (...lines: string[]) => rowsOfTranscriptFields(lines.join('\n')).map(({ ids }) => ids[0])

test('a transcript read leaves out the rows a rewind went back past', () => {
  const fields = [
    linkedLine(1, 'p1', null),
    linkedLine(2, 'r1', 'p1'),
    linkedLine(3, 'p2', 'r1'),
    linkedLine(4, 'r2', 'p2'),
    linkedLine(5, 'p2-edited', 'r1'),
    linkedLine(6, 'r2-edited', 'p2-edited'),
  ]
  expect(idsOfFields(...fields)).toEqual(['p1', 'r1', 'p2-edited', 'r2-edited'])
})

test('a transcript read leaves out the rows before the last compaction', () => {
  const fields = [linkedLine(1, 'p1', null), linkedLine(2, 'r1', 'p1'), linkedLine(3, 'boundary', null), linkedLine(4, 'p2', 'boundary'), linkedLine(5, 'r2', 'p2')]
  expect(idsOfFields(...fields)).toEqual(['boundary', 'p2', 'r2'])
})

test('a row recorded again under a new id is placed, its tool calls keeping their first place', () => {
  const order = TranscriptOrder.of([
    { ids: ['p1'], isPrompt: true },
    { ids: ['r1', 'toolu_1'], isPrompt: false },
    { ids: ['r1-again', 'toolu_1'], isPrompt: false },
    { ids: ['r1'], isPrompt: false },
  ])
  expect(order.placeOf(['r1-again'])).toBe(2)
  expect(order.placeOf(['toolu_1'])).toBe(1)
  expect(order.placeOf(['r1'])).toBe(1)
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

/**
 * The view of a transcript holding `storedIds` in order (prompts named
 * `p…`), the drawn entries placed among them.
 */
function storedView(storedIds: readonly string[], drawn: readonly DrawnEntry[], lastJumped?: string): PromptView {
  const placed = drawn.map(entry => ({ place: storedIds.indexOf(entry.requestId), entry }))
  const prompts = storedIds.flatMap((id, place) => (isPromptId(id) ? [{ place, id }] : []))
  return { placed, prompts, lastJumped }
}

/** The view where every stored row is drawn. */
const drawnView = (entries: readonly DrawnEntry[], lastJumped?: string) =>
  storedView(
    entries.map(entry => entry.requestId),
    entries,
    lastJumped,
  )

const idOf = (target: { id: string } | undefined) => target?.id

test('a step back from the newest prompt, its top out of view, lands on its own top', () => {
  expect(idOf(jumpTarget(drawnView([prompt('p1'), prompt('p2', shownFrom(3))]), -1))).toBe('p2')
})

test('a step back from a prompt whose top shows lands on the one before', () => {
  expect(idOf(jumpTarget(drawnView([prompt('p1'), prompt('p2', TOP)]), -1))).toBe('p1')
})

test('a step on counts from the topmost prompt on screen', () => {
  expect(idOf(jumpTarget(drawnView([prompt('p1'), prompt('p2', TOP), prompt('p3', TOP), prompt('p4')]), 1))).toBe('p3')
})

test('with no row on screen, a step counts from the prompt last jumped to', () => {
  const prompts = [prompt('p1'), prompt('p2'), prompt('p3')]
  expect(idOf(jumpTarget(drawnView(prompts, 'p1'), 1))).toBe('p2')
  expect(idOf(jumpTarget(drawnView(prompts, 'p2'), -1))).toBe('p2')
})

test('with no row on screen and no jump yet, a step back lands on the newest prompt', () => {
  expect(idOf(jumpTarget(drawnView([prompt('p1'), prompt('p2')]), -1))).toBe('p2')
})

test('there is nothing before the first prompt or after the last', () => {
  expect(jumpTarget(drawnView([prompt('p1', TOP), prompt('p2')]), -1)).toBeUndefined()
  expect(jumpTarget(drawnView([prompt('p1'), prompt('p2', TOP)]), 1)).toBeUndefined()
  expect(jumpTarget(drawnView([]), 1)).toBeUndefined()
})

test('the anchor is the topmost prompt on screen, noting whether its top shows', () => {
  expect(anchorOf(drawnView([prompt('p1'), prompt('p2', TOP), prompt('p3', TOP), reply('r3')]))).toEqual({ index: 1, isTopShown: true })
  expect(anchorOf(drawnView([prompt('p1'), prompt('p2', shownFrom(4))], 'p1'))).toEqual({ index: 1, isTopShown: false })
})

test('with no row on screen, the anchor is the prompt last jumped to, else the newest', () => {
  const prompts = [prompt('p1'), prompt('p2'), prompt('p3')]
  expect(anchorOf(drawnView(prompts, 'p1'))).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf(drawnView(prompts))).toEqual({ index: 2, isTopShown: false })
  expect(anchorOf(drawnView([]))).toBeUndefined()
})

test('the prompt last jumped to stays the anchor when an older prompt becomes known', () => {
  expect(anchorOf(drawnView([prompt('p2'), prompt('p3')], 'p2'))).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf(drawnView([prompt('p1'), prompt('p2'), prompt('p3')], 'p2'))).toEqual({ index: 1, isTopShown: false })
})

test('the count reads the anchor and the prompts known', () => {
  expect(positionText(drawnView([prompt('p1'), prompt('p2', TOP), prompt('p3')]))).toBe('2/3')
  expect(positionText(drawnView([]))).toBe('')
})

test('the count is among every stored prompt, drawn or not', () => {
  const stored = ['p1', 'r1', 'p2', 'r2', 'p3', 'r3', 'p4', 'r4', 'p5', 'r5', 'p6', 'r6', 'p7', 'r7', 'p8', 'r8']
  const view = storedView(stored, [prompt('p6'), reply('r6'), prompt('p7', TOP), reply('r7', shownFrom(0, { isBottomShown: false })), prompt('p8')])
  expect(positionText(view)).toBe('7/8')
  expect(idOf(jumpTarget(view, -1))).toBe('p6')
})

test('with only a reply on screen, the anchor is the prompt that owns it', () => {
  const view = drawnView([prompt('p1'), reply('r1'), prompt('p2'), reply('r2', shownFrom(7)), prompt('p3'), reply('r3')], 'p3')
  expect(anchorOf(view)).toEqual({ index: 1, isTopShown: false })
  expect(positionText(view)).toBe('2/3')
})

test('a step back from a reply lands on the top of the prompt that owns it', () => {
  const view = drawnView([prompt('p1'), reply('r1'), prompt('p2'), reply('r2', shownFrom(7)), prompt('p3')], 'p3')
  expect(idOf(jumpTarget(view, -1))).toBe('p2')
  expect(idOf(jumpTarget(view, 1))).toBe('p3')
})

test('a reply on screen whose prompt is not drawn counts under that prompt', () => {
  const view = storedView(['p5', 'r5', 'p6', 'r6'], [reply('r5', TOP), prompt('p6'), reply('r6')])
  expect(positionText(view)).toBe('1/2')
  expect(idOf(jumpTarget(view, -1))).toBe('p5')
  expect(idOf(jumpTarget(view, 1))).toBe('p6')
})

// A jump moves the view past a tall reply in one step; the reply was at no
// edge of the viewport, so its last report still has its middle on screen.
test('a row the view jumped past, still reported on screen, does not hold the anchor', () => {
  const tallReplyBefore = reply('r5', shownFrom(0, { isBottomShown: false, reportedAt: 1 }))
  const nextPrompt = prompt('p6', shownFrom(0, { reportedAt: 2 }))
  const nextReply = reply('r6', shownFrom(0, { isBottomShown: false, reportedAt: 3 }))
  const view = drawnView([prompt('p5'), tallReplyBefore, nextPrompt, nextReply], 'p5')
  expect(entriesOnScreen(view.placed).map(({ entry }) => entry.requestId)).toEqual(['p6', 'r6'])
  expect(anchorOf(view)).toEqual({ index: 1, isTopShown: true })
  expect(positionText(view)).toBe('2/2')
  expect(jumpTarget(view, 1)).toBeUndefined()
  expect(idOf(jumpTarget(view, -1))).toBe('p5')
})

test('a row reported off screen between two shown rows leaves out the older report', () => {
  const upper = prompt('p1', shownFrom(0, { reportedAt: 1 }))
  const lower = prompt('p3', shownFrom(0, { reportedAt: 5 }))
  expect(anchorOf(drawnView([upper, reply('r1'), lower]))).toEqual({ index: 1, isTopShown: true })
})

test('the topmost row on screen decides, a reply above a prompt included', () => {
  expect(anchorOf(drawnView([prompt('p1'), reply('r1', shownFrom(30)), prompt('p2', TOP), reply('r2')]))).toEqual({ index: 0, isTopShown: false })
})

// --- At the end of the transcript ---------------------------------------

const STORED_EIGHT = ['p1', 'r1', 'p2', 'r2', 'p3', 'r3', 'p4', 'r4', 'p5', 'r5', 'p6', 'r6', 'p7', 'r7', 'p8', 'r8']

test('at the transcript’s end with the last prompt on screen, the view is on the last prompt', () => {
  const atBottom = storedView(STORED_EIGHT, [prompt('p7'), reply('r7', shownFrom(20, { reportedAt: 1 })), prompt('p8', shownFrom(0, { reportedAt: 2 })), reply('r8', shownFrom(0, { reportedAt: 3 }))])
  expect(isLastPromptAtEnd(atBottom)).toBe(true)
  expect(anchorOf(atBottom)).toEqual({ index: 7, isTopShown: true })
  expect(positionText(atBottom)).toBe('8/8')
  expect(jumpTarget(atBottom, 1)).toBeUndefined()
  expect(idOf(jumpTarget(atBottom, -1))).toBe('p7')
})

test('at the transcript’s end with the last prompt’s first line above the view, a step back goes to that line first', () => {
  const tallPrompt = storedView(STORED_EIGHT, [reply('r7'), prompt('p8', shownFrom(4)), reply('r8', TOP)])
  expect(anchorOf(tallPrompt)).toEqual({ index: 7, isTopShown: false })
  expect(idOf(jumpTarget(tallPrompt, -1))).toBe('p8')
})

test('with the last prompt’s reply running past the screen, the view is not at the end', () => {
  const replyRunsOn = storedView(STORED_EIGHT, [reply('r7', TOP), prompt('p8', TOP), reply('r8', shownFrom(0, { isBottomShown: false }))])
  expect(isLastPromptAtEnd(replyRunsOn)).toBe(false)
  expect(positionText(replyRunsOn)).toBe('7/8')
})

// The kit scrolls no transcript, so a jump it tries fails with a toast, where a step with nowhere to go says so.
test('a step on from a reply taller than the screen tries the next stored prompt, not drawn yet', async ($, on) => {
  const session = storedSession(on, rows('p5', 'r5', 'p6', 'r6'))
  const toasts = recordToasts(on)
  await load($, session)
  await drawPrompt($, 'p5')
  await drawReply($, 'r5', { first: 0, last: 30, of: 145 })
  await settle(session)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
})

test('a step on at the last prompt, the transcript’s end in view, says there is no later prompt', async ($, on) => {
  const session = storedSession(on, rows('p1', 'r1', 'p2', 'r2'))
  const toasts = recordToasts(on)
  await load($, session)
  await drawReply($, 'r1', { first: 5, last: 9, of: 10 })
  await drawPrompt($, 'p2', { onScreen: TOP_SHOWN })
  await drawReply($, 'r2', { first: 0, last: 3, of: 4 })
  await settle(session)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts).toEqual(['No later prompt'])
})