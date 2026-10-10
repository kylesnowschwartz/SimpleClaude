import type { On, PromptOrigin, RenderElement, SessionAppendDoor } from 'claude-code'
import type { Engine, MockClock } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import { jumpTarget, newTrail, notePrompt, noteStored, positionText, storedPromptIds, type PromptTrail } from '../hooks/prompt-jump'
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
// Long enough for the transcript read a load or a press starts.
const SETTLE_MS = 50

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

/** A transcript line as `grep -n -o` prints its fields: the person's prompt `id`, or a compaction's boundary. */
const promptLine = (line: number, id: string) => [`${line}:"type":"user"`, `${line}:"uuid":"${id}"`, `${line}:"origin":{"kind":"human"`].join('\n')
const boundaryLine = (line: number) => `${line}:"subtype":"compact_boundary"\n${line}:"uuid":"boundary-${line}"`

/** What the session's transcript file holds, by what `grep` prints of it; undefined for no file yet, UNREADABLE for one grep cannot read. */
type StoredFile = { fields: string | undefined; clock: MockClock }

const UNREADABLE = Symbol('unreadable').toString()

/** Stands for the session beneath the plugin: its id, its home, and the `find` and `grep` the read runs. */
function storedSession(on: On, fields: string | undefined): StoredFile {
  drawsEngineDefaults(on)
  const file: StoredFile = { fields, clock: mock.clock(on) }
  mock.env(on, { HOME })
  on('session.id', async () => ({ value: 'session' }))
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  on('session.end', async (_$, e) => ({ sessionId: e.sessionId }))
  on('process.run', async (_$, e) => {
    if (e.argv[0] === 'find') return { value: ok(file.fields === undefined ? '' : `${TRANSCRIPT}\n`) }
    const isReadable = e.argv.at(-1) === TRANSCRIPT && file.fields !== undefined && file.fields !== UNREADABLE
    return { value: isReadable ? ok(file.fields as string) : { ...ok(''), exitCode: 2, stderr: 'no such file' } }
  })
  return file
}

/** The plugin loading into the session, then the read it starts settling. */
async function load($: Engine, file: StoredFile) {
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await file.clock.advance(SETTLE_MS)
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

// --- The prompts the transcript file holds ------------------------------

test('on load, the prompts the transcript file holds are counted, before the ones stored since', async ($, on) => {
  const file = storedSession(on, [promptLine(1, 'p1'), promptLine(5, 'p2')].join('\n'))
  await load($, file)
  expect(await bandCount($)).toBe('2/2')

  await store($, 'p3')
  expect(await bandCount($)).toBe('3/3')
})

test('with no prompt known, every prompt the file holds is taken', () => {
  const trail = newTrail()
  noteStored(trail, ['p1', 'p2', 'p3'])
  expect(trail.prompts).toEqual(['p1', 'p2', 'p3'])
  expect(positionText(trail)).toBe('3/3')
})

test('the file’s prompts before the first one known go in front, and the arrows keep their prompt', () => {
  const trail = newTrail()
  notePrompt(trail, 'p3')
  notePrompt(trail, 'p4')
  trail.at = 0
  noteStored(trail, ['p1', 'p2', 'p3', 'p4'])
  expect(trail.prompts).toEqual(['p1', 'p2', 'p3', 'p4'])
  expect(trail.at).toBe(2)
  expect(positionText(trail)).toBe('3/4')
})

test('a file read after a compaction adds nothing before the prompts known since before it', () => {
  const trail = newTrail()
  const before = Array.from({ length: 13 }, (_, n) => `P${n + 1}`)
  const after = Array.from({ length: 9 }, (_, n) => `P${n + 14}`)
  for (const id of [...before, ...after]) notePrompt(trail, id)
  noteStored(trail, after)
  expect(trail.prompts).toEqual([...before, ...after])
  expect(jumpTarget(trail, -1)).toBe(20)
})

test('a file that does not hold the first prompt known adds nothing', () => {
  const trail = newTrail()
  notePrompt(trail, 'p9')
  noteStored(trail, ['p1', 'p2'])
  expect(trail.prompts).toEqual(['p9'])
})

test('the repro: prompts, a compaction, more prompts, then the first press reads the file', async ($, on) => {
  const file = storedSession(on, undefined)
  const toasts = recordToasts(on)
  await load($, file)
  const before = Array.from({ length: 13 }, (_, n) => `P${n + 1}`)
  const after = Array.from({ length: 9 }, (_, n) => `P${n + 14}`)
  await storeAll($, ...before, ...after)
  file.fields = [...before.map((id, n) => promptLine(n + 1, id)), boundaryLine(20), ...after.map((id, n) => promptLine(n + 21, id))].join('\n')
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  await file.clock.advance(SETTLE_MS)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
  expect((await band.find(POSITION))?.text).toBe('22/22')
})

test('a prompt stored before the read ends is counted once', async ($, on) => {
  const file = storedSession(on, [promptLine(1, 'p1'), promptLine(5, 'p2')].join('\n'))
  await $.session.start({ cwd: '/work', surface: 'terminal', isInteractive: true })
  await store($, 'p2')
  await file.clock.advance(SETTLE_MS)
  expect(await bandCount($)).toBe('2/2')
})

test('with no transcript file at load, the first press reads it', async ($, on) => {
  const file = storedSession(on, undefined)
  const toasts = recordToasts(on)
  await load($, file)
  await store($, 'p3')
  expect(await bandCount($)).toBe('1/1')

  file.fields = [promptLine(1, 'p1'), promptLine(5, 'p2'), promptLine(9, 'p3')].join('\n')
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  await file.clock.advance(SETTLE_MS)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
  expect((await band.find(POSITION))?.text).toBe('3/3')
})

test('a transcript file that cannot be read leaves the prompts stored since counted', async ($, on) => {
  const file = storedSession(on, UNREADABLE)
  await load($, file)
  await store($, 'p1')
  expect(await bandCount($)).toBe('1/1')
})

test('the prompts of a transcript file are those of the person since the last compaction', () => {
  const fields = [
    promptLine(1, 'p1'),
    `2:"type":"user"\n2:"uuid":"reminder"\n2:"origin":{"kind":"human"\n2:"isMeta":true`,
    `3:"type":"user"\n3:"uuid":"agent-row"\n3:"origin":{"kind":"human"\n3:"isSidechain":true`,
    `4:"type":"user"\n4:"uuid":"tool-result"`,
    boundaryLine(5),
    promptLine(6, 'p2'),
    promptLine(7, 'p3'),
  ].join('\n')
  expect(storedPromptIds(fields)).toEqual(['p2', 'p3'])
  expect(storedPromptIds('')).toEqual([])
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
