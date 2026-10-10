import type { EngineInterface, On, OnScreen, PromptOrigin } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * A transcript row by its requestId: one of the person's prompts, or a row
 * of the turn that follows one (reply text, a tool call). `firstRowShown`
 * is the first of its rows the viewport shows: 0 when its top is in view,
 * null while it is off screen, undefined where the surface does not say.
 */
export type TranscriptRow = { requestId: string; isPrompt: boolean; firstRowShown: number | null | undefined }

/** The prompt the view is on, by index among the prompts, and whether its top row is in view. */
export type Anchor = { index: number; isTopShown: boolean }

// The prompt being sent draws under this id until it is stored, and
// nothing can be scrolled to under it.
const IN_FLIGHT = 'placeholder'

const isPersonsPrompt = (origin: PromptOrigin) => origin.kind === 'composer' || origin.kind === 'bridge'

const isShown = (row: TranscriptRow) => row.firstRowShown !== null && row.firstRowShown !== undefined

const isJumpTarget = (row: TranscriptRow) => row.isPrompt && row.requestId !== IN_FLIGHT

/** The prompts that can be jumped to, in transcript order. */
export const promptsOf = (rows: readonly TranscriptRow[]) => rows.filter(isJumpTarget)

/** The prompt at or above the row at `at`, by index among the prompts; undefined above the first or under the in-flight prompt. */
function owningPrompt(rows: readonly TranscriptRow[], at: number): number | undefined {
  const above = rows.slice(0, at + 1)
  const owner = above.findLast(row => row.isPrompt)
  if (owner === undefined || !isJumpTarget(owner)) return undefined
  return above.filter(isJumpTarget).length - 1
}

/**
 * The prompt the view is on: the one that owns the topmost row on screen,
 * itself or a row of its turn. With no tracked row on screen, it is the
 * prompt last jumped to, else the newest. Undefined while no prompt is known.
 */
export function anchorOf(rows: readonly TranscriptRow[], lastJumped: number): Anchor | undefined {
  const promptCount = promptsOf(rows).length
  if (promptCount === 0) return undefined

  const topmost = rows.findIndex(isShown)
  const owner = topmost >= 0 ? owningPrompt(rows, topmost) : undefined
  if (owner !== undefined) {
    const row = rows[topmost]
    return { index: owner, isTopShown: row?.isPrompt === true && row.firstRowShown === 0 }
  }
  return { index: lastJumped >= 0 && lastJumped < promptCount ? lastJumped : promptCount - 1, isTopShown: false }
}

/**
 * The index among the prompts a step from the anchor lands on, or undefined
 * past either end. A step back from inside a turn, or from a prompt whose
 * top is out of view, lands on that prompt's own top first.
 */
export function jumpTarget(rows: readonly TranscriptRow[], lastJumped: number, step: Step): number | undefined {
  const anchor = anchorOf(rows, lastJumped)
  if (anchor === undefined) return undefined

  const target = step === -1 && !anchor.isTopShown ? anchor.index : anchor.index + step
  return target >= 0 && target < promptsOf(rows).length ? target : undefined
}

/** `2/5` while the view is on the second of five known prompts; empty with none known. */
export function positionText(rows: readonly TranscriptRow[], lastJumped: number): string {
  const anchor = anchorOf(rows, lastJumped)
  return anchor === undefined ? '' : `${anchor.index + 1}/${promptsOf(rows).length}`
}

/** The rows seen so far, the prompt last jumped to, and the count the band was asked to show. */
type PromptTrail = {
  // Keyed by site and requestId; a Map keeps the order rows were first drawn, which is transcript order.
  rows: Map<string, TranscriptRow>
  lastJumped: number
  requestedPosition: string
}

const IN_FLIGHT_KEY = `prompt:${IN_FLIGHT}`

const transcriptRows = (trail: PromptTrail) => [...trail.rows.values()]

const currentPosition = (trail: PromptTrail) => positionText(transcriptRows(trail), trail.lastJumped)

/**
 * Records a row's place on screen. A stored prompt takes the in-flight
 * prompt's place, so the turn rows drawn while it was being sent stay under it.
 */
function noteRow(trail: PromptTrail, key: string, row: TranscriptRow) {
  const known = trail.rows.get(key)
  // A redraw that does not report the viewport keeps what was last known.
  if (known !== undefined && row.firstRowShown === undefined) return

  if (known === undefined && row.isPrompt && row.requestId !== IN_FLIGHT && trail.rows.has(IN_FLIGHT_KEY)) {
    trail.rows = new Map([...trail.rows].map(([k, v]) => (k === IN_FLIGHT_KEY ? [key, row] : [k, v])))
    return
  }
  trail.rows.set(key, row)
}

function noteTurnRow($: EngineInterface, trail: PromptTrail, site: string, requestId: string, onScreen: OnScreen | null | undefined) {
  noteRow(trail, `${site}:${requestId}`, { requestId, isPrompt: false, firstRowShown: onScreen && onScreen.first })
  redrawBandIfMoved($, trail)
}

/**
 * Redraws the band when its count changed. A row scrolling does not change
 * the band's props, so the band would keep its old count. Asking only on a
 * change keeps the redraw this causes from asking again.
 */
function redrawBandIfMoved($: EngineInterface, trail: PromptTrail) {
  const position = currentPosition(trail)
  if (position === trail.requestedPosition) return

  trail.requestedPosition = position
  $.ui.invalidate('ui.render')
}

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  const rows = transcriptRows(trail)
  const target = jumpTarget(rows, trail.lastJumped, step)
  const prompt = target === undefined ? undefined : promptsOf(rows)[target]
  if (target === undefined || prompt === undefined) {
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, prompt.requestId)
  if (refusal !== undefined) {
    $.ui.toast(`Can't jump to that prompt: ${refusal}`)
    return
  }
  trail.lastJumped = target
  redrawBandIfMoved($, trail)
}

/** Why the transcript did not move to the row, or undefined once it did. */
async function scrollRefusal($: EngineInterface, requestId: string): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block: 'start' })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * The band's ◀ and ▶ buttons, hotkeys 1 and 2 in an empty prompt box, which
 * scroll the transcript to the previous or next prompt, with the view's
 * place among the prompts between them. Rows are learned as they render.
 *
 * The turn rows watched are reply text and tool calls, single or folded: a
 * tool-heavy turn can fill the screen with no reply text. A tool's output is
 * folded to a few lines under its call, so it is not watched. The watchers
 * pass every row on unchanged.
 */
export function registerPromptJump(on: On) {
  const trail: PromptTrail = { rows: new Map(), lastJumped: -1, requestedPosition: '' }

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (isPersonsPrompt(e.props.origin)) {
      const shown = e.props.onScreen
      noteRow(trail, `prompt:${e.requestId}`, { requestId: e.requestId, isPrompt: true, firstRowShown: shown && shown.first })
      redrawBandIfMoved($, trail)
    }
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    noteTurnRow($, trail, 'reply', e.requestId, e.props.onScreen)
    return next(e)
  })

  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    noteTurnRow($, trail, 'tool', e.requestId, e.props.onScreen)
    return next(e)
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    noteTurnRow($, trail, 'tools', e.requestId, e.props.onScreen)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    // The prompts it knows are the main conversation's, not an agent's.
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)

    const position = currentPosition(trail)
    trail.requestedPosition = position
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" columnGap={1}>
        <Button key="prompt-jump:previous" hotkey="1" label="◀" onPress={() => jump($, trail, -1)} />
        {position === '' ? null : <Text dimColor>{position}</Text>}
        <Button key="prompt-jump:next" hotkey="2" label="▶" onPress={() => jump($, trail, 1)} />
      </Box>
    )
  })
}
