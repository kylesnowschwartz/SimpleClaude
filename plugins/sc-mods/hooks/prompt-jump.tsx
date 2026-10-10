import type { EngineInterface, On, OnScreen, PromptOrigin, SessionMessage, UiScrollBlock } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * A transcript row by its requestId: one of the person's prompts, or a row
 * of the turn that follows one (reply text, a tool call). `firstRowShown`
 * is the first of its rows the viewport shows: 0 when its top is in view,
 * null while it is off screen, undefined where the surface does not say.
 * `isBottomShown` says whether its last row is in view, and `reportedAt`
 * orders the reports of where rows are.
 */
export type TranscriptRow = {
  requestId: string
  isPrompt: boolean
  firstRowShown: number | null | undefined
  isBottomShown?: boolean
  reportedAt?: number
}

/** The prompt the view is on, by index among the prompts, and whether its top row is in view. */
export type Anchor = { index: number; isTopShown: boolean }

/** The anchor index while the view is above the first known prompt. */
const BEFORE_FIRST = -1

const isShown = (row: TranscriptRow) => row.firstRowShown !== null && row.firstRowShown !== undefined

/**
 * Whether two rows shown one after the other in transcript order can be on
 * screen together: the upper one's bottom and the lower one's top in view,
 * with no row between them reported off screen.
 */
function canShowTogether(upper: TranscriptRow, lower: TranscriptRow, between: readonly TranscriptRow[]) {
  return upper.isBottomShown !== false && lower.firstRowShown === 0 && between.every(row => row.firstRowShown !== null)
}

/**
 * The rows on screen, in transcript order. Claude Code reports a row's
 * place when it is drawn and, on a scroll, for the rows at the viewport's
 * edges only, so a row the view moved past in one step keeps reporting
 * where it was. The rows on screen are one unbroken run; where two reports
 * cannot both hold, the older one is out of date and is left out.
 */
export function rowsOnScreen(rows: readonly TranscriptRow[]): TranscriptRow[] {
  let shown = rows.flatMap((row, at) => (isShown(row) ? [at] : []))
  for (;;) {
    const clash = shown.findIndex((at, i) => {
      const next = shown[i + 1]
      const [upper, lower] = [rows[at], next === undefined ? undefined : rows[next]]
      return upper !== undefined && lower !== undefined && !canShowTogether(upper, lower, rows.slice(at + 1, next))
    })
    if (clash < 0) return shown.flatMap(at => rows[at] ?? [])

    const [upperAt, lowerAt] = [shown[clash] ?? 0, shown[clash + 1] ?? 0]
    const isUpperOlder = (rows[upperAt]?.reportedAt ?? -1) < (rows[lowerAt]?.reportedAt ?? -1)
    const stale = isUpperOlder ? upperAt : lowerAt
    shown = shown.filter(at => at !== stale)
  }
}

/** The prompts that can be jumped to, in transcript order. */
export const promptsOf = (rows: readonly TranscriptRow[]) => rows.filter(row => row.isPrompt)

/** The prompt at or above the row at `at`, by index among the prompts; undefined above the first. */
function owningPrompt(rows: readonly TranscriptRow[], at: number): number | undefined {
  const promptsAbove = promptsOf(rows.slice(0, at + 1)).length
  return promptsAbove > 0 ? promptsAbove - 1 : undefined
}

/**
 * The prompt the view is on: the one that owns the topmost row on screen,
 * itself or a row of its turn. With no tracked row on screen, it is the
 * prompt last jumped to, else the newest. Undefined while no prompt is known.
 */
export function anchorOf(rows: readonly TranscriptRow[], lastJumped: number): Anchor | undefined {
  const promptCount = promptsOf(rows).length
  if (promptCount === 0) return undefined

  const topShown = rowsOnScreen(rows)[0]
  const topmost = topShown === undefined ? -1 : rows.indexOf(topShown)
  if (topmost >= 0) {
    const row = rows[topmost]
    // A row above every known prompt: the view is before the first of them.
    const owner = owningPrompt(rows, topmost) ?? BEFORE_FIRST
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

/** `2/5` while the view is on the second of five known prompts; empty with none known, or above the first known. */
export function positionText(rows: readonly TranscriptRow[], lastJumped: number): string {
  const anchor = anchorOf(rows, lastJumped)
  if (anchor === undefined || anchor.index === BEFORE_FIRST) return ''
  return `${anchor.index + 1}/${promptsOf(rows).length}`
}

/** What finds a drawn row's message in the session: a prompt's text, a reply block's text, or tool call ids. */
export type MessageMatch = { kind: 'prompt' | 'reply'; text: string } | { kind: 'tools'; toolUseIds: readonly string[] }

/** A drawn row and the message it was found in, by its index in the session's messages. */
export type SeenRow = { row: TranscriptRow; match: MessageMatch; message?: number }

/** The rows drawn so far by key in the order first drawn, the prompt last jumped to, and the count the band was asked to show. */
export type PromptTrail = {
  seen: Map<string, SeenRow>
  // The first and last of the session's replies, by message index.
  turnSpan: { first: number; last: number } | undefined
  isRefreshDue: boolean
  reports: number
  lastJumped: number
  requestedPosition: string
}

export const newTrail = (): PromptTrail => ({
  seen: new Map(),
  turnSpan: undefined,
  isRefreshDue: false,
  reports: 0,
  lastJumped: -1,
  requestedPosition: '',
})

/**
 * The rows found in the session, in transcript order. A row drawn but not
 * yet found is left out until it is.
 */
export function transcriptRows(trail: PromptTrail): TranscriptRow[] {
  const found = [...trail.seen.values()].filter((seen): seen is SeenRow & { message: number } => seen.message !== undefined)
  // Blocks of one message keep the order they were drawn in.
  return found.sort((a, b) => a.message - b.message).map(seen => seen.row)
}

const currentPosition = (trail: PromptTrail) => positionText(transcriptRows(trail), trail.lastJumped)

/** Records a drawn row's place on screen; a redraw that does not report the viewport keeps what was last known. */
export function noteRow(trail: PromptTrail, key: string, row: TranscriptRow, match: MessageMatch) {
  const known = trail.seen.get(key)
  const reported = row.firstRowShown === undefined ? row : { ...row, reportedAt: (trail.reports += 1) }
  if (known === undefined) trail.seen.set(key, { row: reported, match })
  else if (row.firstRowShown !== undefined) known.row = reported
}

const isMatchFor = (match: MessageMatch, message: SessionMessage) => {
  if (match.kind === 'tools') return message.toolUses.some(use => match.toolUseIds.includes(use.tool_use_id))
  if (match.kind === 'prompt') return message.role === 'user' && message.text.trim() === match.text.trim()
  return message.role === 'assistant' && match.text.trim() !== '' && message.text.includes(match.text.trim())
}

/**
 * Of several messages a row could be, the one that fits between the found
 * rows drawn before and after it; the newest when no found row is near.
 */
function between(candidates: number[], after: number | undefined, before: number | undefined): number | undefined {
  const fitting = candidates.filter(index => (after === undefined || index >= after) && (before === undefined || index <= before))
  const pool = fitting.length > 0 ? fitting : candidates
  return after !== undefined ? pool[0] : pool.at(-1)
}

/**
 * Finds each drawn row's message in the session's messages, which are in
 * transcript order. A prompt takes a message no other prompt holds. A row
 * one message fits is found first; where several fit (the same words sent
 * twice), the row takes the one between its found neighbours in the order
 * drawn. Rows with no message (a prompt still being sent or waiting in the
 * queue) are dropped, and looked for again if drawn again.
 */
export function findMessages(trail: PromptTrail, messages: readonly SessionMessage[]) {
  const replies = messages.flatMap((message, index) => (message.role === 'assistant' ? [index] : []))
  const [first, last] = [replies[0], replies.at(-1)]
  trail.turnSpan = first === undefined || last === undefined ? undefined : { first, last }

  const entries = [...trail.seen]
  const heldByPrompts = new Set(entries.flatMap(([, s]) => (s.match.kind === 'prompt' && s.message !== undefined ? [s.message] : [])))
  const candidatesOf = (seen: SeenRow) =>
    messages.flatMap((message, index) =>
      isMatchFor(seen.match, message) && !(seen.match.kind === 'prompt' && heldByPrompts.has(index)) ? [index] : [],
    )
  const settle = (seen: SeenRow, message: number) => {
    seen.message = message
    if (seen.match.kind === 'prompt') heldByPrompts.add(message)
  }

  const ambiguous: number[] = []
  entries.forEach(([key, seen], at) => {
    if (seen.message !== undefined) return
    const candidates = candidatesOf(seen)
    if (candidates.length === 0) trail.seen.delete(key)
    else if (candidates.length === 1 && candidates[0] !== undefined) settle(seen, candidates[0])
    else ambiguous.push(at)
  })

  const foundAt = (at: number) => entries[at]?.[1].message
  for (const at of ambiguous) {
    const seen = entries[at]?.[1]
    if (seen === undefined) continue
    const after = entries.slice(0, at).map(([, s]) => s.message).findLast(m => m !== undefined)
    const before = entries.slice(at + 1).map((_, offset) => foundAt(at + 1 + offset)).find(m => m !== undefined)
    const message = between(candidatesOf(seen), after, before)
    if (message !== undefined) settle(seen, message)
  }
}

const hasUnfound = (trail: PromptTrail) => [...trail.seen.values()].some(seen => seen.message === undefined)

// Folds the rows drawn in one redraw into one read of the session's messages.
const REFRESH_DELAY_MS = 100

async function refreshMessages($: EngineInterface, trail: PromptTrail) {
  trail.isRefreshDue = false
  findMessages(trail, await $.session.messages())
  redrawBandIfMoved($, trail)
}

/**
 * Asks for a redraw when the band's count changed, and for a read of the
 * session's messages while drawn rows are not yet found. A row scrolling
 * does not change the band's props, so the band would keep its old count.
 * Asking only on a change keeps the redraw this causes from asking again.
 */
function redrawBandIfMoved($: EngineInterface, trail: PromptTrail) {
  if (hasUnfound(trail) && !trail.isRefreshDue) {
    trail.isRefreshDue = true
    $.clock.after(REFRESH_DELAY_MS, () => void refreshMessages($, trail))
  }

  const position = currentPosition(trail)
  if (position === trail.requestedPosition) return

  trail.requestedPosition = position
  $.ui.invalidate('ui.render')
}

function noteDrawnRow($: EngineInterface, trail: PromptTrail, key: string, row: TranscriptRow, match: MessageMatch) {
  noteRow(trail, key, row, match)
  redrawBandIfMoved($, trail)
}

/** A row's report of where it is: its first row shown, and whether its last is. */
const placeOnScreen = (onScreen: OnScreen | null | undefined) => ({
  firstRowShown: onScreen && onScreen.first,
  isBottomShown: onScreen ? onScreen.last >= onScreen.of - 1 : undefined,
})

const turnRow = (requestId: string, onScreen: OnScreen | null | undefined): TranscriptRow => ({
  requestId,
  isPrompt: false,
  ...placeOnScreen(onScreen),
})

/**
 * The row at the found end of the transcript in the step's direction, when
 * the session holds turns past it that no drawn row has shown yet.
 */
export function unseenEdge(trail: PromptTrail, step: Step): string | undefined {
  const found = [...trail.seen.values()].flatMap(seen => (seen.message === undefined ? [] : [seen]))
  if (found.length === 0 || trail.turnSpan === undefined) return undefined

  const messages = found.map(seen => seen.message ?? 0)
  const edge = step === -1 ? Math.min(...messages) : Math.max(...messages)
  const edgeRow = found.find(seen => seen.message === edge)?.row
  // A reply at the top edge has its prompt above it.
  const hasTurnsPast = step === -1 ? trail.turnSpan.first < edge || edgeRow?.isPrompt === false : trail.turnSpan.last > edge
  return hasTurnsPast ? edgeRow?.requestId : undefined
}

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  const rows = transcriptRows(trail)
  const target = jumpTarget(rows, trail.lastJumped, step)
  const prompt = target === undefined ? undefined : promptsOf(rows)[target]
  if (target === undefined || prompt === undefined) {
    // Claude Code draws only the rows near the view, so turns past the drawn
    // ones have no row to jump to yet. Moving the edge row to the far side of
    // the view draws them, and the next press reaches their prompts.
    const edge = unseenEdge(trail, step)
    if (edge !== undefined) {
      const refusal = await scrollRefusal($, edge, step === -1 ? 'end' : 'start')
      if (refusal !== undefined) $.ui.toast(`Can't jump to that prompt: ${refusal}`)
      return
    }
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, prompt.requestId, 'start')
  if (refusal !== undefined) {
    $.ui.toast(`Can't jump to that prompt: ${refusal}`)
    return
  }
  trail.lastJumped = target
  redrawBandIfMoved($, trail)
}

/** Why the transcript did not move to the row, or undefined once it did. */
async function scrollRefusal($: EngineInterface, requestId: string, block: UiScrollBlock): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

// The prompt being sent draws under this id until it is stored.
const IN_FLIGHT = 'placeholder'

const isPersonsPrompt = (origin: PromptOrigin) => origin.kind === 'composer' || origin.kind === 'bridge'

/**
 * The band's ◀ and ▶ buttons, hotkeys 1 and 2 in an empty prompt box, which
 * scroll the transcript to the previous or next prompt, with the view's
 * place among the prompts between them.
 *
 * Claude Code draws only the rows near the view, and draws them again after
 * a reload, so the order rows are drawn in is not transcript order. Each row
 * is found in the session's messages, which are. The turn rows watched are
 * reply text and tool calls, single or folded: a tool-heavy turn can fill
 * the screen with no reply text. A tool's output is folded to a few lines
 * under its call, so it is not watched. The watchers pass every row on
 * unchanged.
 */
export function registerPromptJump(on: On) {
  const trail = newTrail()

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    // A prompt drawn as one line is a queued one, drawn under a new id each redraw.
    if (e.requestId !== IN_FLIGHT && isPersonsPrompt(e.props.origin) && e.props.isExpanded) {
      const shown = e.props.onScreen
      const row = { requestId: e.requestId, isPrompt: true, ...placeOnScreen(shown) }
      noteDrawnRow($, trail, `prompt:${e.requestId}`, row, { kind: 'prompt', text: e.props.text })
    }
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    // A summary stands for text the model wrote; the session holds that text, not the summary.
    if (!e.props.isSummary) {
      const match: MessageMatch = { kind: 'reply', text: e.props.text }
      noteDrawnRow($, trail, `reply:${e.requestId}`, turnRow(e.requestId, e.props.onScreen), match)
    }
    return next(e)
  })

  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    const match: MessageMatch = { kind: 'tools', toolUseIds: [e.props.tool_use_id] }
    noteDrawnRow($, trail, `tool:${e.requestId}`, turnRow(e.requestId, e.props.onScreen), match)
    return next(e)
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    const toolUseIds = e.props.calls.flatMap(call => (call.tool_use_id === undefined ? [] : [call.tool_use_id]))
    noteDrawnRow($, trail, `tools:${e.requestId}`, turnRow(e.requestId, e.props.onScreen), { kind: 'tools', toolUseIds })
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
