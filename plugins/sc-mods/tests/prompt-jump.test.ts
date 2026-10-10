import type { PromptOrigin, RenderElement, SessionAppendDoor } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import { jumpTarget, newTrail, notePrompt, positionText, type PromptTrail } from '../hooks/prompt-jump'
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

// --- The session beneath the plugin -------------------------------------

type Stored = { door?: SessionAppendDoor; origin?: PromptOrigin | { kind: 'model'; model: string }; isMeta?: true; agentId?: string }

/** The session storing a row while the plugin runs: by default one of the person's prompts. */
const store = ($: Engine, uuid: string, { door = 'prompt', origin = COMPOSER, isMeta, agentId }: Stored = {}) =>
  $.session.append({
    message: { type: 'user', role: 'user', content: [{ type: 'text', text: `prompt ${uuid}` }], ...(isMeta ? { isMeta } : {}) },
    door,
    origin,
    uuid,
    ...(agentId === undefined ? {} : { agentId }),
  })

async function storeAll($: Engine, ...uuids: string[]) {
  for (const uuid of uuids) await store($, uuid)
}

async function bandCount($: Engine) {
  return (await (await mountBand($)).find(POSITION))?.text
}

/** The trail after `count` prompts, the arrows on the one at `at`, else the newest. */
function trailOf(count: number, at?: number): PromptTrail {
  const trail = newTrail()
  for (let n = 1; n <= count; n += 1) notePrompt(trail, `p${n}`)
  trail.at = at
  return trail
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

// --- Counting the prompts stored ----------------------------------------

test('the band counts the prompts stored, dim between the arrows, the arrows on the newest', async ($, on) => {
  drawsEngineDefaults(on)
  await storeAll($, 'p1', 'p2')
  const band = await mountBand($)
  const leaves = (await band.findAll({})).filter(element => element.type !== 'Box')
  expect(leaves.map(element => element.type)).toEqual(['Button', 'Text', 'Button'])
  expect((await band.find(POSITION))?.text).toBe('2/2')
  expect((await band.find(POSITION))?.props).toMatchObject({ dimColor: true })
})

test('a prompt stored while the band shows draws the count again', async ($, on) => {
  drawsEngineDefaults(on)
  await storeAll($, 'p1')
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('1/1')
  await store($, 'p2')
  expect((await band.find(POSITION))?.text).toBe('2/2')
})

test('rows the person did not type are not counted', async ($, on) => {
  drawsEngineDefaults(on)
  await storeAll($, 'p1')
  await store($, 'reply', { door: 'response', origin: { kind: 'model', model: 'claude' } })
  await store($, 'reminder', { isMeta: true })
  await store($, 'notice', { origin: { kind: 'task-notification' } as PromptOrigin })
  await store($, 'command', { door: 'command' })
  expect(await bandCount($)).toBe('1/1')
})

test('a prompt sent through Remote Control is counted', async ($, on) => {
  drawsEngineDefaults(on)
  await store($, 'p1', { origin: { kind: 'bridge' } as PromptOrigin })
  expect(await bandCount($)).toBe('1/1')
})

test('a subagent’s prompt is not counted', async ($, on) => {
  drawsEngineDefaults(on)
  await storeAll($, 'p1')
  await store($, 'agent-prompt', { agentId: 'agent-1' })
  expect(await bandCount($)).toBe('1/1')
})

test('at the newest prompt, ▶ says there is no later prompt', async ($, on) => {
  drawsEngineDefaults(on)
  const toasts = recordToasts(on)
  await storeAll($, 'p1', 'p2')
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts).toEqual(['No later prompt'])
})

// The kit has no transcript to scroll, so its scroll fails the way a surface without one does.
test('a scroll that does not move the transcript toasts why and leaves the arrows where they were', async ($, on) => {
  drawsEngineDefaults(on)
  const toasts = recordToasts(on)
  await storeAll($, 'p1', 'p2')
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
  expect((await band.find(POSITION))?.text).toBe('2/2')
})

test('after /clear, the count starts over with the new conversation', async ($, on) => {
  drawsEngineDefaults(on)
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  await storeAll($, 'p1', 'p2')
  await $.session.end({ reason: 'clear', sessionId: 'session', resume: { id: 'session' } })
  expect(await bandCount($)).toBeUndefined()

  await store($, 'p3')
  expect(await bandCount($)).toBe('1/1')
})

test('after /resume, the count is of the prompts sent since', async ($, on) => {
  drawsEngineDefaults(on)
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  await storeAll($, 'p1')
  await $.session.end({ reason: 'resume', sessionId: 'session', resume: { id: 'resumed' } })
  expect(await bandCount($)).toBeUndefined()

  await storeAll($, 'p7', 'p8')
  expect(await bandCount($)).toBe('2/2')
})

// --- Stepping through the prompts ---------------------------------------

test('from the newest prompt, a step back lands on the one before it', () => {
  expect(jumpTarget(trailOf(8), -1)).toBe(6)
})

test('a step counts from the prompt last jumped to', () => {
  expect(jumpTarget(trailOf(8, 3), -1)).toBe(2)
  expect(jumpTarget(trailOf(8, 3), 1)).toBe(4)
})

test('there is nothing before the first prompt or after the last', () => {
  expect(jumpTarget(trailOf(8, 0), -1)).toBeUndefined()
  expect(jumpTarget(trailOf(8, 7), 1)).toBeUndefined()
  expect(jumpTarget(trailOf(8), 1)).toBeUndefined()
  expect(jumpTarget(trailOf(1), -1)).toBeUndefined()
  expect(jumpTarget(trailOf(0), -1)).toBeUndefined()
})

test('the count reads the prompt the arrows are on among the prompts stored', () => {
  expect(positionText(trailOf(8))).toBe('8/8')
  expect(positionText(trailOf(8, 2))).toBe('3/8')
  expect(positionText(trailOf(0))).toBe('')
})

test('a new prompt puts the arrows back on the newest', () => {
  const trail = trailOf(8, 2)
  notePrompt(trail, 'p9')
  expect(positionText(trail)).toBe('9/9')
  expect(jumpTarget(trail, -1)).toBe(7)
})
