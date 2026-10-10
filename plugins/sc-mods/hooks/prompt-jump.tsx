import type { EngineInterface, On, PromptOrigin } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * A prompt row by its requestId, with the first of its rows the viewport
 * shows: 0 when its top is in view, null while it is off screen, undefined
 * where the surface does not say.
 */
export type PromptRow = { requestId: string; firstRowShown: number | null | undefined }

// The prompt being sent draws under this id until it is stored, and
// nothing can be scrolled to under it.
const IN_FLIGHT = 'placeholder'

const isPersonsPrompt = (origin: PromptOrigin) => origin.kind === 'composer' || origin.kind === 'bridge'

const isShown = (row: PromptRow) => row.firstRowShown !== null && row.firstRowShown !== undefined

/**
 * The index of the prompt a step lands on, or undefined past either end.
 *
 * The step counts from the topmost prompt on screen. With none on screen
 * the view is inside a long turn, so it counts from the prompt last jumped
 * to, else the newest. A step back from a prompt whose top is out of view
 * lands on that prompt's own top first.
 */
export function jumpTarget(prompts: readonly PromptRow[], lastJumped: number, step: Step): number | undefined {
  if (prompts.length === 0) return undefined

  const topmostShown = prompts.findIndex(isShown)
  const anchor = topmostShown >= 0 ? topmostShown : lastJumped >= 0 ? lastJumped : prompts.length - 1
  const isAnchorTopShown = topmostShown >= 0 && prompts[anchor]?.firstRowShown === 0

  const target = step === -1 && !isAnchorTopShown ? anchor : anchor + step
  return target >= 0 && target < prompts.length ? target : undefined
}

/** The prompts seen so far, in transcript order, and the one last jumped to. */
type PromptTrail = {
  // A Map keeps the order prompts were first drawn, which is transcript order.
  firstRowShown: Map<string, number | null | undefined>
  lastJumped: number
}

const promptRows = (trail: PromptTrail): PromptRow[] =>
  [...trail.firstRowShown].map(([requestId, shown]) => ({ requestId, firstRowShown: shown }))

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
 * scroll the transcript to the previous or next prompt. Prompt ids are
 * learned as their rows render.
 */
export function registerPromptJump(on: On) {
  const trail: PromptTrail = { firstRowShown: new Map(), lastJumped: -1 }

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    if (e.requestId !== IN_FLIGHT && isPersonsPrompt(e.props.origin)) {
      const shown = e.props.onScreen
      // A redraw that does not report the viewport keeps what was last known.
      if (shown !== undefined || !trail.firstRowShown.has(e.requestId)) {
        trail.firstRowShown.set(e.requestId, shown && shown.first)
      }
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    // The prompts it knows are the main conversation's, not an agent's.
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)

    const { Box, Button } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" columnGap={1}>
        <Button key="prompt-jump:previous" hotkey="1" label="◀" onPress={() => jump($, trail, -1)} />
        <Button key="prompt-jump:next" hotkey="2" label="▶" onPress={() => jump($, trail, 1)} />
      </Box>
    )
  })
}
