import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, SessionAppendInput } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * The person's prompts the conversation has stored since the plugin loaded,
 * by their stored row ids, in the order sent, and `at`: the index of the
 * prompt the arrows last jumped to, or undefined while they rest on the
 * newest prompt, where every new prompt puts them.
 */
export type PromptTrail = { prompts: string[]; at: number | undefined }

export const newTrail = (): PromptTrail => ({ prompts: [], at: undefined })

/** Whether the person sent it: typed at the terminal, or through Remote Control. */
export const isPersonsPrompt = (origin: { kind: string }) => origin.kind === 'composer' || origin.kind === 'bridge'

/** The id of the person's prompt a `session.append` stores in the main conversation; undefined for any other row. */
export function promptIdOf(e: SessionAppendInput): string | undefined {
  const isPrompt = e.agentId === undefined && e.door === 'prompt' && isPersonsPrompt(e.origin) && e.message.isMeta !== true
  return isPrompt ? e.uuid : undefined
}

/** The index of the prompt the arrows are on: the one last jumped to, else the newest. */
const indexOn = ({ prompts, at }: PromptTrail) => at ?? prompts.length - 1

/** The index of the prompt a step from the one the arrows are on lands on, or undefined past either end. */
export function jumpTarget(trail: PromptTrail, step: Step): number | undefined {
  const target = indexOn(trail) + step
  return target >= 0 && target < trail.prompts.length ? target : undefined
}

/** `7/8` while the arrows are on the seventh of eight prompts; empty with none known. */
export const positionText = (trail: PromptTrail): string => (trail.prompts.length === 0 ? '' : `${indexOn(trail) + 1}/${trail.prompts.length}`)

/** Adds a prompt the conversation stored; the arrows rest on it. */
export function notePrompt(trail: PromptTrail, id: string) {
  trail.prompts.push(id)
  trail.at = undefined
}

/** Forgets the conversation that ended: `/clear` and `/resume` go on in this process with other prompts. */
function startOver(trail: PromptTrail) {
  trail.prompts = []
  trail.at = undefined
}

/**
 * The count the band shows. A jump does not change the band's props, so the
 * band reads the count from state, and a write draws the band again without
 * drawing the transcript's rows.
 */
const PROMPT_POSITION = atom({ plugin: 'sc-mods', key: 'promptPosition' } as const, '')

const publishPosition = ($: EngineInterface, trail: PromptTrail) => update($, PROMPT_POSITION, () => positionText(trail))

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  const target = jumpTarget(trail, step)
  if (target === undefined) {
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, trail.prompts[target] as string)
  if (refusal !== undefined) {
    $.ui.toast(`Can't jump to that prompt: ${refusal}`)
    return
  }
  trail.at = target
  await publishPosition($, trail)
}

/**
 * Why the transcript did not move to the row, or undefined once it did.
 * Claude Code scrolls to a row its transcript has drawn; the window stays
 * where it is when the row's top cannot reach the window's top (a prompt
 * near the end), and that answers as moved.
 */
async function scrollRefusal($: EngineInterface, requestId: string): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block: 'start' })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * The band's ◀ and ▶ buttons, which scroll the transcript to the previous or
 * next of the person's prompts, with the arrows' place among them between.
 * Hotkeys 1 and 2 press them while the band holds the keyboard.
 *
 * The prompts counted are those stored since the plugin loaded: the rows a
 * session held before then are not drawn, so there is nothing to scroll to.
 * The arrows step from the prompt last jumped to, so a press moves them on
 * even where the window could not move; the person's own scrolling does not
 * move them.
 */
export function registerPromptJump(on: On) {
  const trail = newTrail()

  on('session.end', ($, e, next) => {
    if (e.reason === 'clear' || e.reason === 'resume') {
      startOver(trail)
      void publishPosition($, trail)
    }
    return next(e)
  })

  on('session.append', ($, e, next) => {
    const id = promptIdOf(e)
    if (id !== undefined) {
      notePrompt(trail, id)
      void publishPosition($, trail)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // The prompts it knows are the main conversation's, not an agent's.
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)

    const position = await read($, PROMPT_POSITION)
    // The band is shared: what the plugins beneath draw stays, above the arrows.
    const beneath = await next(e)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {beneath}
        <Box flexDirection="row" columnGap={1}>
          <Button key="prompt-jump:previous" hotkey="1" label="◀" onPress={() => jump($, trail, -1)} />
          {position === '' ? null : <Text dimColor>{position}</Text>}
          <Button key="prompt-jump:next" hotkey="2" label="▶" onPress={() => jump($, trail, 1)} />
        </Box>
      </Box>
    )
  })
}
