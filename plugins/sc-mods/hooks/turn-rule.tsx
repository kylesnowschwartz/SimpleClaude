import type { On } from 'claude-code'
import { promptNumber, readTurnOn, type PromptTrail } from './prompt-jump'

// The prompt row's indent plus a margin column on each side.
const GUTTER = 4
const WIDTH_WITHOUT_VIEWPORT = 100
const DASH = '╌'
// Dashes after the label, so it sits near the right end.
const TAIL_DASHES = 2

/** A dashed rule `width` cells wide with ` Turn 3 ` near its right end; the label alone where it does not fit. */
export function turnRuleText(turn: number, width: number): string {
  const label = ` Turn ${turn} `
  const leading = width - label.length - TAIL_DASHES
  if (leading < 1) return label.trim()
  return DASH.repeat(leading) + label + DASH.repeat(TAIL_DASHES)
}

/**
 * A dim dashed rule with the turn's number above each of the person's
 * prompts after the first, so the turns of a long conversation stand apart.
 * A turn is one of the prompts `trail` holds; every other user row
 * (a notification, a peer's message) is drawn as the engine draws it.
 */
export function registerTurnRule(on: On, trail: PromptTrail) {
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    // Read so the row draws again once the transcript file's prompts are known.
    await readTurnOn($, trail)
    const turn = promptNumber(trail, e.requestId)
    if (turn === undefined || turn === 1) return next(e)

    const width = e.viewport ? e.viewport.columns - GUTTER : WIDTH_WITHOUT_VIEWPORT
    const row = await next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        <Text dimColor>{turnRuleText(turn, width)}</Text>
        {row}
      </Box>
    )
  })
}
