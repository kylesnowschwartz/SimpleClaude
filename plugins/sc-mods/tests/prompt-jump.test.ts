import type { On, PromptOrigin, SessionMessage } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import {
  anchorOf,
  findMessages,
  jumpTarget,
  newTrail,
  noteRow,
  positionText,
  transcriptRows,
  unseenEdge,
  type MessageMatch,
  type PromptTrail,
  type TranscriptRow,
} from '../hooks/prompt-jump'
import { drawsEngineDefaults, recordToasts } from './support'

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
// Past the plugin's wait before it reads the session's messages.
const READ_DELAY_MS = 200

type OnScreen = { first: number; last: number; of: number } | null
const TOP_SHOWN: OnScreen = { first: 0, last: 1, of: 2 }

/** The words of row `id`: prompts are named `p…`, replies `r…`. */
const wordsOf = (id: string) => (id.startsWith('p') ? `prompt ${id}` : `reply ${id}`)

const user = (id: string): SessionMessage => ({ role: 'user', text: wordsOf(id), toolUses: [] })
const assistant = (id: string): SessionMessage => ({ role: 'assistant', text: wordsOf(id), toolUses: [] })
const transcript = (...ids: string[]) => ids.map(id => (id.startsWith('p') ? user(id) : assistant(id)))

/** Stands for the session's stored messages. */
function storedMessages(on: On, messages: SessionMessage[]) {
  on('session.messages', async () => ({ value: messages }))
}

type PromptDraw = { origin?: PromptOrigin; onScreen?: OnScreen; isExpanded?: boolean; text?: string }

const renderPrompt = ($: Engine, requestId: string, { origin = COMPOSER, onScreen = null, isExpanded = true, text }: PromptDraw = {}) =>
  $.ui.render({
    surface: 'terminal',
    component: 'UserMessage',
    requestId,
    props: { text: text ?? wordsOf(requestId), origin, isExpanded, onScreen },
  })

const renderReply = ($: Engine, requestId: string, onScreen: OnScreen = null) =>
  $.ui.render({
    surface: 'terminal',
    component: 'AssistantMessage',
    requestId,
    props: { text: wordsOf(requestId), isFirstOfReply: true, onScreen },
  })

const renderRows = async ($: Engine, ids: string[]) => {
  for (const id of ids) await (id.startsWith('p') ? renderPrompt($, id) : renderReply($, id))
}

const row = (requestId: string, firstRowShown: number | null): TranscriptRow => ({ requestId, isPrompt: true, firstRowShown })
const reply = (requestId: string, firstRowShown: number | null): TranscriptRow => ({ requestId, isPrompt: false, firstRowShown })

const matchOf = (r: TranscriptRow, text = wordsOf(r.requestId)): MessageMatch => ({ kind: r.isPrompt ? 'prompt' : 'reply', text })
const draw = (trail: PromptTrail, ...rows: TranscriptRow[]) => rows.forEach(r => noteRow(trail, r.requestId, r, matchOf(r)))
const order = (trail: PromptTrail) => transcriptRows(trail).map(r => r.requestId)

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

test('the in-flight prompt, rows the person did not type, and queued prompts are not counted', async ($, on) => {
  drawsEngineDefaults(on)
  const clock = mock.clock(on)
  storedMessages(on, transcript('p1', 'r1'))
  const toasts = recordToasts(on)
  await renderRows($, ['p1', 'r1'])
  await renderPrompt($, 'placeholder', { text: 'prompt p2' })
  await renderPrompt($, 'notice', { origin: { kind: 'task-notification' } as PromptOrigin })
  await renderPrompt($, 'queued-a', { isExpanded: false, onScreen: TOP_SHOWN, text: 'prompt p3' })
  await renderPrompt($, 'queued-b', { isExpanded: true, onScreen: TOP_SHOWN, text: 'prompt p3' })
  await clock.advance(READ_DELAY_MS)
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('1/1')
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts).toEqual(['No later prompt'])
})

test('the band counts the prompt the view is on among the prompts found, dim between the arrows', async ($, on) => {
  drawsEngineDefaults(on)
  const clock = mock.clock(on)
  storedMessages(on, transcript('p1', 'r1', 'p2', 'r2'))
  await renderRows($, ['p1', 'r1', 'p2', 'r2'])
  await clock.advance(READ_DELAY_MS)
  const band = await mountBand($)
  const leaves = (await band.findAll({})).filter(element => element.type !== 'Box')
  expect(leaves.map(element => element.type)).toEqual(['Button', 'Text', 'Button'])
  expect((await band.find(POSITION))?.text).toBe('2/2')
  expect((await band.find(POSITION))?.props).toMatchObject({ dimColor: true })
})

test('the count follows a reply scrolling into view, with no change to the band', async ($, on) => {
  drawsEngineDefaults(on)
  const clock = mock.clock(on)
  storedMessages(on, transcript('p1', 'r1', 'p2', 'r2'))
  await renderRows($, ['p1', 'r1', 'p2', 'r2'])
  await clock.advance(READ_DELAY_MS)
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('2/2')

  await renderReply($, 'r1', { first: 10, last: 40, of: 80 })
  expect((await band.find(POSITION))?.text).toBe('1/2')
})

// Claude Code draws the rows near the view after a reload, and an older row
// only once the view scrolls up to it, so it is drawn after newer rows.
test('an older prompt drawn after a reload, above the rows on screen, counts first', async ($, on) => {
  drawsEngineDefaults(on)
  const clock = mock.clock(on)
  storedMessages(on, transcript('p1', 'r1', 'p2', 'r2'))
  await renderRows($, ['r1', 'p2', 'r2'])
  await clock.advance(READ_DELAY_MS)
  await renderPrompt($, 'p1', { onScreen: TOP_SHOWN })
  await renderReply($, 'r1', { first: 0, last: 40, of: 80 })
  await clock.advance(READ_DELAY_MS)
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('1/2')
})

// The kit has no transcript to scroll, so its scroll fails the way a surface without one does.
test('a scroll that does not move the transcript toasts why', async ($, on) => {
  drawsEngineDefaults(on)
  const clock = mock.clock(on)
  storedMessages(on, transcript('p1', 'p2'))
  const toasts = recordToasts(on)
  await renderRows($, ['p1', 'p2'])
  await clock.advance(READ_DELAY_MS)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
})

test('rows are put in transcript order whatever order they were drawn in', () => {
  const trail = newTrail()
  draw(trail, reply('r2', null), row('p2', null), reply('r1', 0), row('p1', 0))
  findMessages(trail, transcript('p1', 'r1', 'p2', 'r2'))
  expect(order(trail)).toEqual(['p1', 'r1', 'p2', 'r2'])
})

test('a row with no stored message is dropped, and looked for again when drawn again', () => {
  const trail = newTrail()
  draw(trail, row('p1', null), row('p2', 0))
  findMessages(trail, transcript('p1'))
  expect(order(trail)).toEqual(['p1'])
  draw(trail, row('p2', 0))
  findMessages(trail, transcript('p1', 'p2'))
  expect(order(trail)).toEqual(['p1', 'p2'])
})

test('the same words sent twice are told apart by the rows drawn around them', () => {
  const trail = newTrail()
  const yes = (id: string) => noteRow(trail, id, row(id, null), { kind: 'prompt', text: 'yes' })
  yes('first-yes')
  draw(trail, reply('r1', null))
  yes('second-yes')
  draw(trail, reply('r2', null))
  const sentTwice = [{ ...user('p0'), text: 'yes' }, assistant('r1'), { ...user('p0'), text: 'yes' }, assistant('r2')]
  findMessages(trail, sentTwice)
  expect(order(trail)).toEqual(['first-yes', 'r1', 'second-yes', 'r2'])
})

test('a tool call row is found by its tool use id', () => {
  const trail = newTrail()
  draw(trail, row('p1', null))
  noteRow(trail, 'tool-1', reply('tool-1', 0), { kind: 'tools', toolUseIds: ['toolu_1'] })
  const toolCall = { role: 'assistant', text: '', toolUses: [{ tool_use_id: 'toolu_1' }] } as unknown as SessionMessage
  findMessages(trail, [user('p1'), toolCall])
  expect(order(trail)).toEqual(['p1', 'tool-1'])
  expect(positionText(transcriptRows(trail), -1)).toBe('1/1')
})

test('past the drawn rows, a step moves the edge row so the turns beyond it get drawn', () => {
  const trail = newTrail()
  draw(trail, row('p3', 0), reply('r3', null))
  findMessages(trail, transcript('p1', 'r1', 'p2', 'r2', 'p3', 'r3', 'p4', 'r4'))
  expect(unseenEdge(trail, -1)).toBe('p3')
  expect(unseenEdge(trail, 1)).toBe('r3')
})

test('at the ends of the session, there is nothing past the drawn rows', () => {
  const trail = newTrail()
  draw(trail, row('p1', 0), reply('r1', null), row('p2', null), reply('r2', null))
  findMessages(trail, transcript('p1', 'r1', 'p2', 'r2'))
  expect(unseenEdge(trail, -1)).toBeUndefined()
  expect(unseenEdge(trail, 1)).toBeUndefined()
})

test('a reply drawn at the top edge has its prompt above it to draw', () => {
  const trail = newTrail()
  draw(trail, reply('r1', 0), row('p2', null))
  findMessages(trail, transcript('p1', 'r1', 'p2'))
  expect(unseenEdge(trail, -1)).toBe('r1')
})

test('a step back from the newest prompt, its top out of view, lands on its own top', () => {
  expect(jumpTarget([row('p1', null), row('p2', 3)], -1, -1)).toBe(1)
})

test('a step back from a prompt whose top shows lands on the one before', () => {
  expect(jumpTarget([row('p1', null), row('p2', 0)], -1, -1)).toBe(0)
})

test('a step on counts from the topmost prompt on screen', () => {
  expect(jumpTarget([row('p1', null), row('p2', 0), row('p3', 0), row('p4', null)], -1, 1)).toBe(2)
})

test('with no row on screen, a step counts from the prompt last jumped to', () => {
  const prompts = [row('p1', null), row('p2', null), row('p3', null)]
  expect(jumpTarget(prompts, 0, 1)).toBe(1)
  expect(jumpTarget(prompts, 1, -1)).toBe(1)
})

test('with no row on screen and no jump yet, a step back lands on the newest prompt', () => {
  expect(jumpTarget([row('p1', null), row('p2', null)], -1, -1)).toBe(1)
})

test('there is nothing before the first prompt or after the last', () => {
  expect(jumpTarget([row('p1', 0), row('p2', null)], -1, -1)).toBeUndefined()
  expect(jumpTarget([row('p1', null), row('p2', 0)], -1, 1)).toBeUndefined()
  expect(jumpTarget([], -1, 1)).toBeUndefined()
})

test('the anchor is the topmost prompt on screen, noting whether its top shows', () => {
  expect(anchorOf([row('p1', null), row('p2', 0), row('p3', 0)], -1)).toEqual({ index: 1, isTopShown: true })
  expect(anchorOf([row('p1', null), row('p2', 4)], 0)).toEqual({ index: 1, isTopShown: false })
})

test('with no row on screen, the anchor is the prompt last jumped to, else the newest', () => {
  const prompts = [row('p1', null), row('p2', null), row('p3', null)]
  expect(anchorOf(prompts, 0)).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf(prompts, -1)).toEqual({ index: 2, isTopShown: false })
  expect(anchorOf([], -1)).toBeUndefined()
})

test('the count reads the anchor and the prompts known', () => {
  expect(positionText([row('p1', null), row('p2', 0), row('p3', null)], -1)).toBe('2/3')
  expect(positionText([], -1)).toBe('')
})

test('with only a reply on screen, the anchor is the prompt that owns it', () => {
  const rows = [row('p1', null), reply('r1', null), row('p2', null), reply('r2', 7), row('p3', null), reply('r3', null)]
  expect(anchorOf(rows, 2)).toEqual({ index: 1, isTopShown: false })
  expect(positionText(rows, 2)).toBe('2/3')
})

test('a step back from a reply lands on the top of the prompt that owns it', () => {
  const rows = [row('p1', null), reply('r1', null), row('p2', null), reply('r2', 7), row('p3', null)]
  expect(jumpTarget(rows, 2, -1)).toBe(1)
  expect(jumpTarget(rows, 2, 1)).toBe(2)
})

test('a reply on screen above every known prompt puts the view before the first of them', () => {
  const rows = [reply('r5', 0), row('p6', null), reply('r6', null)]
  expect(anchorOf(rows, 0)).toEqual({ index: -1, isTopShown: false })
  expect(jumpTarget(rows, 0, -1)).toBeUndefined()
  expect(jumpTarget(rows, 0, 1)).toBe(0)
  expect(positionText(rows, 0)).toBe('')
})

// A jump moves the view past a tall reply in one step; the reply was at no
// edge of the viewport, so its last report still has its middle on screen.
test('a row the view jumped past, still reported on screen, does not hold the anchor', () => {
  const tallReplyBefore: TranscriptRow = { requestId: 'r5', isPrompt: false, firstRowShown: 0, isBottomShown: false, reportedAt: 1 }
  const nextPrompt: TranscriptRow = { requestId: 'p6', isPrompt: true, firstRowShown: 0, isBottomShown: true, reportedAt: 2 }
  const nextReply: TranscriptRow = { requestId: 'r6', isPrompt: false, firstRowShown: 0, isBottomShown: false, reportedAt: 3 }
  const rows = [row('p5', null), tallReplyBefore, nextPrompt, nextReply]
  expect(anchorOf(rows, 0)).toEqual({ index: 1, isTopShown: true })
  expect(positionText(rows, 0)).toBe('2/2')
  expect(jumpTarget(rows, 0, 1)).toBeUndefined()
  expect(jumpTarget(rows, 0, -1)).toBe(0)
})

test('a row reported off screen between two shown rows leaves out the older report', () => {
  const upper: TranscriptRow = { requestId: 'p1', isPrompt: true, firstRowShown: 0, isBottomShown: true, reportedAt: 1 }
  const lower: TranscriptRow = { requestId: 'p3', isPrompt: true, firstRowShown: 0, isBottomShown: true, reportedAt: 5 }
  expect(anchorOf([upper, reply('r1', null), lower], -1)).toEqual({ index: 1, isTopShown: true })
})

test('the topmost row on screen decides, a reply above a prompt included', () => {
  const rows = [row('p1', null), reply('r1', 30), row('p2', 0)]
  expect(anchorOf(rows, -1)).toEqual({ index: 0, isTopShown: false })
})
