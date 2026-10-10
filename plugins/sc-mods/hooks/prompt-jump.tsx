import type { EngineInterface, On, PromptOrigin } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * A prompt row by its requestId, with the first of its rows the viewport
 * shows: 0 when its top is in view, null while it is off screen, undefined
 * where the surface does not say.
 */
export type PromptRow = { requestId: string; firstRowShown: number | null | undefined }

/** The prompt the view is on, by index, and whether its top row is in view. */
export type Anchor = { index: number; isTopShown: boolean }

// The prompt being sent draws under this id until it is stored, and
// nothing can be scrolled to under it.
const IN_FLIGHT = 'placeholder'

const isPersonsPrompt = (origin: PromptOrigin) => origin.kind === 'composer' || origin.kind === 'bridge'

const isShown = (row: PromptRow) => row.firstRowShown !== null && row.firstRowShown !== undefined

/**
 * The prompt the view is on: the topmost prompt on screen. With none on
 * screen the view is inside a long turn, so it is the prompt last jumped
 * to, else the newest. Undefined while no prompt is known.
 */
export function anchorOf(prompts: readonly PromptRow[], lastJumped: number): Anchor | undefined {
  if (prompts.length === 0) return undefined

  const topmostShown = prompts.findIndex(isShown)
  if (topmostShown >= 0) return { index: topmostShown, isTopShown: prompts[topmostShown]?.firstRowShown === 0 }
  return { index: lastJumped >= 0 ? lastJumped : prompts.length - 1, isTopShown: false }
}

/**
 * The index of the prompt a step from the anchor lands on, or undefined
 * past either end. A step back from a prompt whose top is out of view lands
 * on that prompt's own top first.
 */
export function jumpTarget(prompts: readonly PromptRow[], lastJumped: number, step: Step): number | undefined {
  const anchor = anchorOf(prompts, lastJumped)
  if (anchor === undefined) return undefined

  const target = step === -1 && !anchor.isTopShown ? anchor.index : anchor.index + step
  return target >= 0 && target < prompts.length ? target : undefined
}

/** `2/5` while the view is on the second of five known prompts; empty with none known. */
export function positionText(prompts: readonly PromptRow[], lastJumped: number): string {
  const anchor = anchorOf(prompts, lastJumped)
  return anchor === undefined ? '' : `${anchor.index + 1}/${prompts.length}`
}

/** The prompts seen so far, in transcript order, the one last jumped to, and the count the band was asked to show. */
type PromptTrail = {
  // A Map keeps the order prompts were first drawn, which is transcript order.
  firstRowShown: Map<string, number | null | undefined>
  lastJumped: number
  requestedPosition: string
}

const promptRows = (trail: PromptTrail): PromptRow[] =>
  [...trail.firstRowShown].map(([requestId, shown]) => ({ requestId, firstRowShown: shown }))

const currentPosition = (trail: PromptTrail) => positionText(promptRows(trail), trail.lastJumped)

/**
 * Redraws the band when its count changed. A prompt row scrolling does not
 * change the band's props, so the band would keep its old count. Asking only
 * on a change keeps the redraw this causes from asking again.
 */
function redrawBandIfMoved($: EngineInterface, trail: PromptTrail) {
  const position = currentPosition(trail)
  if (position === trail.requestedPosition) return

  trail.requestedPosition = position
  $.ui.invalidate('ui.render')
}

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  const prompts = promptRows(trail)
  const target = jumpTarget(prompts, trail.lastJumped, step)
  const row = target === undefined ? undefined : prompts[target]
  if (target === undefined || row === undefined) {
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, row.requestId)
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
 * place among the prompts between them. Prompt ids are learned as their
 * rows render.
 */
export function registerPromptJump(on: On) {
  const trail: PromptTrail = { firstRowShown: new Map(), lastJumped: -1, requestedPosition: '' }

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.requestId !== IN_FLIGHT && isPersonsPrompt(e.props.origin)) {
      const shown = e.props.onScreen
      // A redraw that does not report the viewport keeps what was last known.
      if (shown !== undefined || !trail.firstRowShown.has(e.requestId)) {
        trail.firstRowShown.set(e.requestId, shown && shown.first)
        redrawBandIfMoved($, trail)
      }
    }
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
