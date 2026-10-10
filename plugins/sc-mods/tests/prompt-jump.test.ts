import type { PromptOrigin } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import { jumpTarget, type PromptRow } from '../hooks/prompt-jump'
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

const renderPrompt = ($: Engine, requestId: string, origin: PromptOrigin = COMPOSER) =>
  $.ui.render({
    surface: 'terminal',
    component: 'UserMessage',
    requestId,
    props: { text: `prompt ${requestId}`, origin, isExpanded: false, onScreen: null },
  })

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
