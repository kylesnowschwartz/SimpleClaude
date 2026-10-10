import type { PromptOrigin } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import { anchorOf, jumpTarget, positionText, type PromptRow } from '../hooks/prompt-jump'
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

type OnScreen = { first: number; last: number; of: number } | null

const renderPrompt = ($: Engine, requestId: string, origin: PromptOrigin = COMPOSER, onScreen: OnScreen = null) =>
  $.ui.render({
    surface: 'terminal',
    component: 'UserMessage',
    requestId,
    props: { text: `prompt ${requestId}`, origin, isExpanded: false, onScreen },
  })

const POSITION = { type: 'Text' }

const row = (requestId: string, firstRowShown: number | null): PromptRow => ({ requestId, firstRowShown })

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

test('with no prompt drawn yet, ◀ says there is no earlier prompt', async ($, on) => {
  const toasts = recordToasts(on)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts).toEqual(['No earlier prompt'])
})

test('the in-flight prompt and rows the person did not type are not jump targets', async ($, on) => {
  drawsEngineDefaults(on)
  const toasts = recordToasts(on)
  await renderPrompt($, 'placeholder')
  await renderPrompt($, 'notice', { kind: 'task-notification' } as PromptOrigin)
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:next' })
  expect(toasts).toEqual(['No later prompt'])
})

// The kit has no transcript to scroll, so its scroll fails the way a surface without one does.
test('a scroll that does not move the transcript toasts why', async ($, on) => {
  drawsEngineDefaults(on)
  const toasts = recordToasts(on)
  await renderPrompt($, 'p1')
  await renderPrompt($, 'p2')
  const band = await mountBand($)
  await band.press({ key: 'prompt-jump:previous' })
  expect(toasts.length).toBe(1)
  expect(toasts[0]).toMatch(/^Can't jump to that prompt: \S/)
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

test('with no prompt on screen, a step counts from the prompt last jumped to', () => {
  const prompts = [row('p1', null), row('p2', null), row('p3', null)]
  expect(jumpTarget(prompts, 0, 1)).toBe(1)
  expect(jumpTarget(prompts, 1, -1)).toBe(1)
})

test('with no prompt on screen and no jump yet, a step back lands on the newest prompt', () => {
  expect(jumpTarget([row('p1', null), row('p2', null)], -1, -1)).toBe(1)
})

test('there is nothing before the first prompt or after the last', () => {
  expect(jumpTarget([row('p1', 0), row('p2', null)], -1, -1)).toBeUndefined()
  expect(jumpTarget([row('p1', null), row('p2', 0)], -1, 1)).toBeUndefined()
  expect(jumpTarget([], -1, 1)).toBeUndefined()
})

test('with no prompt known, the band shows no count between the arrows', async $ => {
  const band = await mountBand($)
  expect(await band.find(POSITION)).toBeUndefined()
})

test('the band counts the prompt the view is on among the prompts known', async ($, on) => {
  drawsEngineDefaults(on)
  await renderPrompt($, 'p1')
  await renderPrompt($, 'p2')
  const band = await mountBand($)
  const leaves = (await band.findAll({})).filter(element => element.type !== 'Box')
  expect(leaves.map(element => element.type)).toEqual(['Button', 'Text', 'Button'])
  expect((await band.find(POSITION))?.text).toBe('2/2')
  expect((await band.find(POSITION))?.props).toMatchObject({ dimColor: true })
})

test('the count follows a prompt row scrolling into view, with no change to the band', async ($, on) => {
  drawsEngineDefaults(on)
  await renderPrompt($, 'p1')
  await renderPrompt($, 'p2')
  await renderPrompt($, 'p3')
  const band = await mountBand($)
  expect((await band.find(POSITION))?.text).toBe('3/3')

  await renderPrompt($, 'p2', COMPOSER, { first: 0, last: 12, of: 20 })
  expect((await band.find(POSITION))?.text).toBe('2/3')
})

test('the anchor is the topmost prompt on screen, noting whether its top shows', () => {
  expect(anchorOf([row('p1', null), row('p2', 0), row('p3', 0)], -1)).toEqual({ index: 1, isTopShown: true })
  expect(anchorOf([row('p1', null), row('p2', 4)], 0)).toEqual({ index: 1, isTopShown: false })
})

test('with no prompt on screen, the anchor is the prompt last jumped to, else the newest', () => {
  const prompts = [row('p1', null), row('p2', null), row('p3', null)]
  expect(anchorOf(prompts, 0)).toEqual({ index: 0, isTopShown: false })
  expect(anchorOf(prompts, -1)).toEqual({ index: 2, isTopShown: false })
  expect(anchorOf([], -1)).toBeUndefined()
})

test('the count reads the anchor and the prompts known', () => {
  expect(positionText([row('p1', null), row('p2', 0), row('p3', null)], -1)).toBe('2/3')
  expect(positionText([], -1)).toBe('')
})
