import type { EngineInterface, On, OnScreen, PromptOrigin, UiScrollBlock } from 'claude-code'
import {
  appendedRow,
  findTranscriptCommand,
  rowsOfTranscriptRead,
  transcriptFieldsCommand,
  TranscriptOrder,
  type StoredRow,
} from './transcript-order'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/** Where a drawn entry is on screen: from its line `firstLine`, with or without its last line. */
export type OnScreenPlacement = { kind: 'onScreen'; firstLine: number; isBottomShown: boolean; reportedAt: number }

/**
 * Where a drawn entry's lines were last reported: never (the surface does
 * not say), off screen, or on screen. `reportedAt` orders the reports.
 */
export type Placement = { kind: 'unreported' } | { kind: 'offScreen' } | OnScreenPlacement

/**
 * A transcript entry the screen has drawn: one of the person's prompts, or
 * an entry of the turn that follows one (a block of reply text, a tool call).
 */
export type DrawnEntry = { requestId: string; isPrompt: boolean; placement: Placement }

/** The prompt the view is on, by index among the prompts, and whether its top line is in view. */
export type Anchor = { index: number; isTopShown: boolean }

/** The anchor index while the view is above the first known prompt. */
const BEFORE_FIRST = -1

const UNREPORTED: Placement = { kind: 'unreported' }
const OFF_SCREEN: Placement = { kind: 'offScreen' }

/** An entry on screen, with its index among the entries. */
type ShownEntry = { at: number; entry: DrawnEntry; placement: OnScreenPlacement }

const shownEntries = (entries: readonly DrawnEntry[]): ShownEntry[] =>
  entries.flatMap((entry, at) => (entry.placement.kind === 'onScreen' ? [{ at, entry, placement: entry.placement }] : []))

/** Each item with the one after it. */
function neighbours<T>(items: readonly T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = []
  items.forEach((item, at) => {
    const next = items[at + 1]
    if (next !== undefined) pairs.push([item, next])
  })
  return pairs
}

/**
 * Whether two entries shown one after the other can be on screen together:
 * the upper one's last line and the lower one's first in view, with no entry
 * between them reported off screen.
 */
const canShowTogether = ([upper, lower]: [ShownEntry, ShownEntry], entries: readonly DrawnEntry[]) =>
  upper.placement.isBottomShown &&
  lower.placement.firstLine === 0 &&
  entries.slice(upper.at + 1, lower.at).every(entry => entry.placement.kind !== 'offScreen')

const olderReport = ([upper, lower]: [ShownEntry, ShownEntry]) =>
  upper.placement.reportedAt < lower.placement.reportedAt ? upper : lower

/** The shown entries left once every report that clashes with a newer one is dropped. */
function consistentShown(shown: ShownEntry[], entries: readonly DrawnEntry[]): ShownEntry[] {
  const clash = neighbours(shown).find(pair => !canShowTogether(pair, entries))
  if (clash === undefined) return shown

  const stale = olderReport(clash)
  return consistentShown(
    shown.filter(candidate => candidate !== stale),
    entries,
  )
}

/**
 * The entries on screen, in transcript order. Claude Code reports where an
 * entry is when it is drawn and, on a scroll, for the entries at the
 * viewport's edges only, so an entry the view moved past in one step keeps
 * reporting where it was. The entries on screen are one unbroken run; where
 * two reports cannot both hold, the older one is out of date.
 */
export const entriesOnScreen = (entries: readonly DrawnEntry[]): DrawnEntry[] =>
  consistentShown(shownEntries(entries), entries).map(shown => shown.entry)

/** The prompts that can be jumped to, in transcript order. */
export const promptsOf = (entries: readonly DrawnEntry[]) => entries.filter(entry => entry.isPrompt)

/**
 * The prompt the view is on: the one that owns the topmost entry on screen,
 * itself or an entry of its turn, or BEFORE_FIRST above every known prompt.
 * With no entry on screen, it is the prompt last jumped to, else the newest.
 * Undefined while no prompt is known.
 */
export function anchorOf(entries: readonly DrawnEntry[], lastJumped: string | undefined): Anchor | undefined {
  const prompts = promptsOf(entries)
  if (prompts.length === 0) return undefined

  const [top] = entriesOnScreen(entries)
  if (top === undefined) {
    const jumped = prompts.findIndex(prompt => prompt.requestId === lastJumped)
    return { index: jumped >= 0 ? jumped : prompts.length - 1, isTopShown: false }
  }

  const promptsDown = promptsOf(entries.slice(0, entries.indexOf(top) + 1)).length
  const isTopShown = top.isPrompt && top.placement.kind === 'onScreen' && top.placement.firstLine === 0
  return { index: promptsDown > 0 ? promptsDown - 1 : BEFORE_FIRST, isTopShown }
}

/**
 * The prompt a step from the anchor lands on, or undefined past either end.
 * A step back from inside a turn, or from a prompt whose top is out of view,
 * lands on that prompt's own top first.
 */
export function jumpTarget(entries: readonly DrawnEntry[], lastJumped: string | undefined, step: Step): DrawnEntry | undefined {
  const anchor = anchorOf(entries, lastJumped)
  if (anchor === undefined) return undefined

  const target = step === -1 && !anchor.isTopShown ? anchor.index : anchor.index + step
  return target === BEFORE_FIRST ? undefined : promptsOf(entries)[target]
}

/** `2/5` while the view is on the second of five known prompts; empty with none known, or above the first known. */
export function positionText(entries: readonly DrawnEntry[], lastJumped: string | undefined): string {
  const anchor = anchorOf(entries, lastJumped)
  if (anchor === undefined || anchor.index === BEFORE_FIRST) return ''
  return `${anchor.index + 1}/${promptsOf(entries).length}`
}

/** A drawn entry and the ids that find its stored row: its own, or for a group of tool calls each call's. */
type Drawn = { entry: DrawnEntry; ids: readonly string[] }

/** A drawn entry and its stored row's place in the transcript. */
export type PlacedEntry = { place: number; entry: DrawnEntry }

/**
 * What the band knows of the session:
 * - `order`: where each stored row of the conversation sits;
 * - `appended`: the rows stored since the plugin loaded, laid over a read of
 *   the transcript file that finishes after them;
 * - `drawn`: the entries drawn so far, by site and requestId;
 * - `reportClock`: counts the reports of where entries are, to order them;
 * - `lastJumped`: the requestId of the prompt last jumped to;
 * - `positionShown`: the count the band was last asked to show.
 */
export type PromptTrail = {
  order: TranscriptOrder
  appended: StoredRow[]
  drawn: Map<string, Drawn>
  reportClock: number
  lastJumped: string | undefined
  positionShown: string
}

export const newTrail = (): PromptTrail => ({
  order: new TranscriptOrder(),
  appended: [],
  drawn: new Map(),
  reportClock: 0,
  lastJumped: undefined,
  positionShown: '',
})

/** The drawn entries whose stored rows are known, in transcript order. */
export function placedEntries(trail: PromptTrail): PlacedEntry[] {
  const placed = [...trail.drawn.values()].flatMap(({ entry, ids }) => {
    const place = trail.order.placeOf(ids)
    return place === undefined ? [] : [{ place, entry }]
  })
  // Entries of one stored row keep the order they were first drawn in.
  return placed.sort((a, b) => a.place - b.place)
}

export const entriesInOrder = (trail: PromptTrail) => placedEntries(trail).map(placed => placed.entry)

const currentPosition = (trail: PromptTrail) => positionText(entriesInOrder(trail), trail.lastJumped)

function placementOf(onScreen: OnScreen | null | undefined, reportedAt: number): Placement {
  if (onScreen === undefined) return UNREPORTED
  if (onScreen === null) return OFF_SCREEN
  return { kind: 'onScreen', firstLine: onScreen.first, isBottomShown: onScreen.last >= onScreen.of - 1, reportedAt }
}

/** Records where a drawn entry is; a redraw that does not say keeps what was last reported. */
export function noteDrawn(trail: PromptTrail, key: string, drawn: Omit<DrawnEntry, 'placement'>, ids: readonly string[], onScreen: OnScreen | null | undefined) {
  if (onScreen === undefined && trail.drawn.has(key)) return

  trail.reportClock += 1
  trail.drawn.set(key, { entry: { ...drawn, placement: placementOf(onScreen, trail.reportClock) }, ids })
}

/** Places a row the conversation stores, and keeps it to lay over a transcript read under way. */
export function noteStored(trail: PromptTrail, row: StoredRow) {
  trail.appended.push(row)
  trail.order.add(row)
}

/** Places the rows a transcript file holds, then the rows stored since the plugin loaded. */
export function noteTranscript(trail: PromptTrail, rows: readonly StoredRow[]) {
  trail.order = TranscriptOrder.of([...rows, ...trail.appended])
}

/**
 * Redraws the band when its count changed. An entry scrolling does not
 * change the band's props, so the band would keep its old count. Asking only
 * on a change keeps the redraw this causes from asking again.
 */
function redrawBandIfMoved($: EngineInterface, trail: PromptTrail) {
  if (currentPosition(trail) === trail.positionShown) return
  $.ui.invalidate('ui.render')
}

/**
 * The drawn entry at the end of the transcript in the step's direction,
 * when a prompt the screen has not drawn lies past it.
 */
export function unseenEdge(placed: readonly PlacedEntry[], order: TranscriptOrder, step: Step): DrawnEntry | undefined {
  const edge = step === -1 ? placed[0] : placed.at(-1)
  if (edge === undefined) return undefined

  const hasPromptPast = step === -1 ? order.hasPromptBefore(edge.place) : order.hasPromptAfter(edge.place)
  return hasPromptPast ? edge.entry : undefined
}

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  const placed = placedEntries(trail)
  const target = jumpTarget(
    placed.map(({ entry }) => entry),
    trail.lastJumped,
    step,
  )
  if (target === undefined) {
    await revealPastEdge($, trail, placed, step)
    return
  }

  const refusal = await scrollRefusal($, target.requestId, 'start')
  if (refusal !== undefined) {
    $.ui.toast(`Can't jump to that prompt: ${refusal}`)
    return
  }
  trail.lastJumped = target.requestId
  redrawBandIfMoved($, trail)
}

/**
 * Claude Code draws only the entries near the view, so a prompt past the
 * drawn ones has nothing to jump to yet. Moving the edge entry to the far
 * side of the view draws the entries beyond it, and the next press reaches
 * their prompts.
 */
async function revealPastEdge($: EngineInterface, trail: PromptTrail, placed: readonly PlacedEntry[], step: Step) {
  const edge = unseenEdge(placed, trail.order, step)
  if (edge === undefined) {
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, edge.requestId, step === -1 ? 'end' : 'start')
  if (refusal !== undefined) $.ui.toast(`Can't jump to that prompt: ${refusal}`)
}

/** Why the transcript did not move to the entry, or undefined once it did. */
async function scrollRefusal($: EngineInterface, requestId: string, block: UiScrollBlock): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

const TRANSCRIPT_READ_TIMEOUT_MS = 10000

async function configDir($: EngineInterface): Promise<string | undefined> {
  const configured = await $.env.get('CLAUDE_CONFIG_DIR')
  if (configured !== undefined) return configured

  const home = await $.env.get('HOME')
  return home === undefined ? undefined : `${home}/.claude`
}

async function findTranscript($: EngineInterface): Promise<string | undefined> {
  const dir = await configDir($)
  if (dir === undefined) return undefined

  const found = await $.process.run(findTranscriptCommand(dir, await $.session.id()))
  return found.stdout.trim() || undefined
}

/** Reads the transcript file for the rows stored before the plugin loaded: a restart, a resume or a reload. */
async function readStoredRows($: EngineInterface, trail: PromptTrail) {
  try {
    const path = await findTranscript($)
    if (path === undefined) return

    const read = await $.process.run(transcriptFieldsCommand(path), { timeoutMs: TRANSCRIPT_READ_TIMEOUT_MS })
    noteTranscript(trail, rowsOfTranscriptRead(read))
    redrawBandIfMoved($, trail)
  } catch (error) {
    // The prompts stored before the plugin loaded go uncounted.
    $.ui.log(`sc-mods: could not read the transcript: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  }
}

const isPersonsPrompt = (origin: PromptOrigin) => origin.kind === 'composer' || origin.kind === 'bridge'

/**
 * The band's ◀ and ▶ buttons, hotkeys 1 and 2 in an empty prompt box, which
 * scroll the transcript to the previous or next prompt, with the view's
 * place among the prompts between them.
 *
 * Claude Code draws only the entries near the view, and draws them again
 * after a reload, so the order entries are drawn in is not transcript order.
 * Each drawn entry is placed by its stored row's place in the conversation:
 * rows stored while the plugin runs as they are stored, older ones from the
 * transcript file. The turn entries watched are reply text and tool calls,
 * single or folded: a tool-heavy turn can fill the screen with no reply
 * text. A tool's output is folded to a few lines under its call, so it is
 * not watched. The watchers pass every entry on unchanged.
 */
export function registerPromptJump(on: On) {
  const trail = newTrail()

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    void readStoredRows($, trail)
    return started
  })

  on('session.append', ($, e, next) => {
    const row = appendedRow(e)
    if (row !== undefined) noteStored(trail, row)
    return next(e)
  })

  on('ui.render', { component: 'UserMessage' }, ($, e, next) => {
    // A prompt drawn as one line is a queued one, drawn under a new id each redraw.
    if (isPersonsPrompt(e.props.origin) && e.props.isExpanded) {
      noteDrawn(trail, `prompt:${e.requestId}`, { requestId: e.requestId, isPrompt: true }, [e.requestId], e.props.onScreen)
      redrawBandIfMoved($, trail)
    }
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, ($, e, next) => {
    noteDrawn(trail, `reply:${e.requestId}`, { requestId: e.requestId, isPrompt: false }, [e.requestId], e.props.onScreen)
    redrawBandIfMoved($, trail)
    return next(e)
  })

  on('ui.render', { component: 'ToolUse' }, ($, e, next) => {
    noteDrawn(trail, `tool:${e.requestId}`, { requestId: e.requestId, isPrompt: false }, [e.props.tool_use_id], e.props.onScreen)
    redrawBandIfMoved($, trail)
    return next(e)
  })

  on('ui.render', { component: 'ToolGroup' }, ($, e, next) => {
    const toolUseIds = e.props.calls.flatMap(call => call.tool_use_id ?? [])
    noteDrawn(trail, `tools:${e.requestId}`, { requestId: e.requestId, isPrompt: false }, toolUseIds, e.props.onScreen)
    redrawBandIfMoved($, trail)
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, ($, e, next) => {
    // The prompts it knows are the main conversation's, not an agent's.
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)

    const position = currentPosition(trail)
    trail.positionShown = position
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
