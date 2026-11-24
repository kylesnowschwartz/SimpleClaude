import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer, ToolCallResult } from 'claude-code'
import type { DrawerScope, DrawerView, HeldCall, HeldCallStatus } from '../types'
import { rowsOf } from './band-rows'
import { cells, cleanLine, cleanText, fit } from './drawer-text'
import { newestPromptId, readTurnOn, type PromptTrail, type TurnOn } from './prompt-jump'

/** The one tool whose calls the drawer holds. */
export const DRAWER_TOOL = 'Bash'
const TOOL_LABEL = 'bash'
const COMMAND_NAME = 'tool-drawer'

/** The most calls kept; past it the oldest goes. */
export const MAX_HELD_CALLS = 200
/** The most output lines a call keeps: its last ones. */
export const MAX_KEPT_LINES = 200
/** The most cells a kept line or a command keeps. */
export const MAX_LINE_CHARS = 400
export const MAX_COMMAND_CHARS = 2000
/** The most output lines an expanded card shows: the last ones. */
export const SHOWN_LINES = 30
const TICK_MS = 1000
/** The theme colour of a running call's dot. */
const RUNNING_COLOR = 'warning'
/** The cells between the drawer's border and its text on each side. */
const FRAME_PADDING = 1
const ELLIPSIS = '…'

// Change a tag when its value's fields change: it declines what an earlier version stored.
const HELD_CALLS = atom({ plugin: 'sc-mods', key: 'heldCalls' } as const, [], { shape: 'held-calls-2' })
export const NEW_VIEW: DrawerView = { isOn: true, isOpen: false, isSetByHand: false, scope: 'turn', expanded: [], collapsed: [] }
const DRAWER_VIEW = atom({ plugin: 'sc-mods', key: 'drawerView' } as const, NEW_VIEW, { shape: 'drawer-view-2' })
/** The time a running card's elapsed seconds count to, moved on each second while a call runs. */
const DRAWER_CLOCK = atom({ plugin: 'sc-mods', key: 'drawerClock' } as const, 0)
/** The rows the other plugins' band rows took when the band last settled. */
const OTHER_BAND_ROWS = atom({ plugin: 'sc-mods', key: 'otherBandRows' } as const, 0)

// --- Pure helpers ---------------------------------------------------------

/**
 * What a call kept of its output: its last MAX_KEPT_LINES lines, each
 * cleaned as the terminal shows it and cut to MAX_LINE_CHARS cells, and how
 * many lines it printed.
 */
export function keptOutput(text: string): { output: string[]; outputLineCount: number } {
  const trimmed = text.replace(/\n+$/, '')
  if (trimmed === '') return { output: [], outputLineCount: 0 }
  const lines = trimmed.split('\n')
  return { output: lines.slice(-MAX_KEPT_LINES).map(line => fit(cleanLine(line), MAX_LINE_CHARS)), outputLineCount: lines.length }
}

const joinStreams = (stdout: string, stderr: string) => [stdout.replace(/\n+$/, ''), stderr.replace(/\n+$/, '')].filter(part => part !== '').join('\n')

// How Claude Code words a tool call the person stopped with Esc.
const INTERRUPTED_TEXT = /interrupted by user/i

/** What the drawer knows of a call besides its result: whether it was put to the permission dialog, and whether it was seen running after. */
export type CallPath = { wasAsked: boolean; wasSeenRunning: boolean }

/**
 * How the call ended and the text it printed: stdout then stderr, or the
 * error the result carries. A refusal is declined, and so is an error of a
 * call put to the dialog and never seen running, which is how a declined
 * dialog reports; an error that says the person stopped it, or a result
 * marked interrupted, is interrupted.
 */
export function endingOf(ran: ToolCallResult, path: CallPath = { wasAsked: false, wasSeenRunning: false }): { status: HeldCallStatus; text: string } {
  if (ran.deny !== undefined) return { status: 'declined', text: ran.deny }
  if (ran.isError) {
    const text = ran.text ?? ''
    if (INTERRUPTED_TEXT.test(text)) return { status: 'interrupted', text }
    return { status: path.wasAsked && !path.wasSeenRunning ? 'declined' : 'error', text }
  }
  const result = ran.result as { stdout?: unknown; stderr?: unknown; interrupted?: unknown } | undefined
  const stdout = typeof result?.stdout === 'string' ? result.stdout : ''
  const stderr = typeof result?.stderr === 'string' ? result.stderr : ''
  return { status: result?.interrupted === true ? 'interrupted' : 'done', text: joinStreams(stdout, stderr) }
}

/** A new running call, as the drawer keeps it. */
export function startedCall(id: string, command: string, promptId: string | undefined, startedAt: number): HeldCall {
  return { id, promptId: promptId ?? '', command: fit(cleanText(command), MAX_COMMAND_CHARS), status: 'running', startedAt, durationMs: 0, output: [], outputLineCount: 0 }
}

/** The calls with one more, the oldest dropped past MAX_HELD_CALLS. */
export const withCall = (calls: readonly HeldCall[], call: HeldCall): HeldCall[] => [...calls.filter(one => one.id !== call.id), call].slice(-MAX_HELD_CALLS)

/** The call ended: its status, duration and output. */
export function endedCall(call: HeldCall, ending: { status: HeldCallStatus; text: string }, endedAt: number): HeldCall {
  return { ...call, status: ending.status, durationMs: Math.max(0, endedAt - call.startedAt), ...keptOutput(ending.text) }
}

/** Whether a call starting under `promptId` is the first of its prompt: no call kept so far ran under it. */
export const isFirstOfTurn = (calls: readonly HeldCall[], promptId: string | undefined) =>
  promptId !== undefined && !calls.some(call => call.promptId === promptId)

/** The calls the drawer lists, oldest first: those of the prompt the arrows are on, or all. */
export function callsInScope(calls: readonly HeldCall[], scope: DrawerScope, turn: TurnOn | undefined): HeldCall[] {
  if (scope === 'all') return [...calls]
  return turn === undefined ? [] : calls.filter(call => call.promptId === turn.promptId)
}

/** `Tool Usage (2 done · 1 failed · 1 declined · 1 running · bash)`, each count shown only when above 0. */
export function summaryText(calls: readonly HeldCall[]): string {
  const count = (status: HeldCallStatus) => calls.filter(call => call.status === status).length
  const parts = [
    [count('done'), 'done'],
    [count('error'), 'failed'],
    [count('declined'), 'declined'],
    [count('interrupted'), 'interrupted'],
    [count('running'), 'running'],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, word]) => `${n} ${word}`)
  return `Tool Usage (${[...parts, TOOL_LABEL].join(' · ')})`
}

/** The newest running call's first line and its seconds so far, `npm test 12s`; undefined while none runs. */
export function runningText(calls: readonly HeldCall[], now: number): string | undefined {
  const call = calls.findLast(one => one.status === 'running')
  if (call === undefined) return undefined
  return `${call.command.split('\n')[0] ?? ''} ${secondsSince(call.startedAt, now)}`
}

const secondsSince = (startedAt: number, now: number) => `${Math.max(0, Math.floor((now - startedAt) / 1000))}s`

/**
 * The bar's two texts cut to `width` cells together with the scope button
 * (`[ Turn 3/8 ]`), the `●` and the gaps: the summary first, then the running
 * command in what is left, dropped when nothing is.
 */
export function barTexts(summary: string, running: string | undefined, scope: string, width: number): { summary: string; running: string | undefined } {
  const scopeCells = cells(scope) + 4 + 1
  const dotCells = running === undefined ? 0 : 2
  const fittedSummary = fit(summary, width - scopeCells - dotCells)
  if (running === undefined) return { summary: fittedSummary, running }
  const left = width - scopeCells - dotCells - cells(fittedSummary) - 1
  return { summary: fittedSummary, running: left >= 4 ? fit(running, left) : undefined }
}

/** `Turn 3/8` for the prompt the arrows are on, or `All`. */
export const scopeText = (scope: DrawerScope, turn: TurnOn | undefined) =>
  scope === 'all' || turn === undefined ? 'All' : `Turn ${turn.number}/${turn.count}`

/** `0.4s` under ten seconds, `12s` under a minute, `1m05s` past it. */
export function durationText(ms: number): string {
  if (ms < 10_000) return `${(ms / 1000).toFixed(1)}s`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m${String(seconds % 60).padStart(2, '0')}s`
}

const STATUS_MARK: Record<HeldCallStatus, string> = { running: ELLIPSIS, done: '✓', error: '✗', declined: '⊘', interrupted: '■' }

/** How a card's mark is drawn: a failure in the error colour, a declined or interrupted call dim, the rest as the line. */
export const markStyle = (status: HeldCallStatus): { color?: string; dimColor?: boolean } =>
  status === 'error' ? { color: 'error' } : status === 'declined' || status === 'interrupted' ? { dimColor: true } : {}

/** A card's line: `▸ ✓ bash 0.4s  <first line of the command>`, cut to `width`; a running call shows its seconds so far. */
export function cardText(call: HeldCall, isExpanded: boolean, now: number, width: number): string {
  const elapsed = call.status === 'running' ? secondsSince(call.startedAt, now) : durationText(call.durationMs)
  const firstLine = call.command.split('\n')[0] ?? ''
  return fit(`${isExpanded ? '▾' : '▸'} ${STATUS_MARK[call.status]} ${TOOL_LABEL} ${elapsed}  ${firstLine}`, width)
}

/**
 * An expanded card's body: `┃ $ <command>`, a dim note of the lines left out,
 * then the last `shownLines` output lines (at most SHOWN_LINES), each
 * `┃ `-prefixed and cut to `width`.
 */
export function cardBody(call: HeldCall, width: number, shownLines = SHOWN_LINES): { command: string; earlierNote: string | undefined; lines: string[] } {
  const count = Math.max(0, Math.min(shownLines, SHOWN_LINES))
  const lines = count === 0 ? [] : call.output.slice(-count)
  const earlier = call.outputLineCount - lines.length
  return {
    command: fit(`┃ $ ${call.command.replace(/\n/g, ' ')}`, width),
    earlierNote: earlier > 0 ? fit(`┃ ${ELLIPSIS} ${earlier} earlier line${earlier === 1 ? '' : 's'}`, width) : undefined,
    lines: lines.map(line => fit(`┃ ${line}`, width)),
  }
}

/** Rows of this plugin's band row under the drawer: the prompt arrows. */
export const ARROWS_ROWS = 1

/** The rows the open drawer may take: the band's room less the arrows and the other plugins' rows. */
export const drawerRoom = (maxRows: number, otherRows: number) => maxRows - ARROWS_ROWS - otherRows

/** The rows the band rows of other plugins take, by plugin name. */
export function otherRowsOf(rows: ReadonlyArray<{ plugin: string; tree: unknown }>, ownPlugin: string): number {
  return rows.filter(row => row.plugin !== ownPlugin).reduce((sum, row) => sum + rowsOf(row.tree), 0)
}

/** One card the open drawer shows, and how many output lines its body shows; undefined for no body. */
export type CardRoom = { call: HeldCall; bodyLines: number | undefined }

/** What the open drawer shows in the rows it has: the cards, and how many older calls the dim note counts. */
export type DrawerLayout = { cards: CardRoom[]; earlierCalls: number }

/** The most output lines a body shows in `rows`, with its command row and its note when lines are left out; undefined when not even the command fits. */
function bodyLinesIn(call: HeldCall, rows: number): number | undefined {
  for (let lines = Math.min(SHOWN_LINES, call.output.length); lines >= 0; lines -= 1) {
    const noteRows = call.outputLineCount > lines ? 1 : 0
    if (1 + lines + noteRows <= rows) return lines
  }
  return undefined
}

/** The rows the open drawer's rounded border takes: its top and bottom lines. */
export const FRAME_ROWS = 2

/**
 * Fits the open drawer into `rows` rows, its frame and bar included. The room
 * goes to the frame and the bar, then a row per card (the newest when not all
 * fit, under a dim `… N earlier calls` row), then the expanded cards' bodies,
 * the newest first. Without room for the frame, the bar and one card, the bar
 * shows alone, unframed.
 */
export function drawerLayout(calls: readonly HeldCall[], expanded: readonly string[], rows: number): DrawerLayout {
  const cardRows = rows - FRAME_ROWS - 1
  if (cardRows < 1 || calls.length === 0) return { cards: [], earlierCalls: 0 }

  const fitsAll = calls.length <= cardRows
  // With one row for cards and more calls than that, the newest card shows without the note.
  const shownCount = fitsAll ? calls.length : Math.max(1, cardRows - 1)
  const shown = calls.slice(-shownCount)
  const earlierCalls = calls.length - shown.length
  let left = cardRows - shown.length - (earlierCalls > 0 && cardRows > 1 ? 1 : 0)

  const bodyLines = new Map<string, number>()
  for (const call of [...shown].reverse()) {
    if (!expanded.includes(call.id)) continue
    const lines = bodyLinesIn(call, left)
    if (lines === undefined) continue
    bodyLines.set(call.id, lines)
    left -= 1 + lines + (call.outputLineCount > lines ? 1 : 0)
  }
  return { cards: shown.map(call => ({ call, bodyLines: bodyLines.get(call.id) })), earlierCalls: earlierCalls > 0 && cardRows > 1 ? earlierCalls : 0 }
}

/** `… 3 earlier calls`, cut to `width`. */
export const earlierCallsText = (count: number, width: number) => fit(`${ELLIPSIS} ${count} earlier call${count === 1 ? '' : 's'}`, width)

/** Whether the drawer holds the call in place of its rows: it is on and keeps the call. */
export const isHeld = (view: DrawerView, calls: readonly HeldCall[], id: string | undefined) =>
  view.isOn && id !== undefined && calls.some(call => call.id === id)

/** The view after `/tool-drawer <args>`, and the line it answers; an unknown argument leaves the view as it is. */
export function switched(view: DrawerView, args: string): { view: DrawerView; text: string } {
  const word = args.trim().toLowerCase()
  if (word === 'on') return { view: { ...view, isOn: true }, text: 'Tool drawer on: shell commands show above the prompt.' }
  if (word === 'off') return { view: { ...view, isOn: false }, text: 'Tool drawer off: shell commands show in the conversation.' }
  const state = view.isOn ? 'on' : 'off'
  const usage = word === '' ? '' : ` Unknown option "${args.trim()}".`
  return { view, text: `Tool drawer is ${state}.${usage} Use /${COMMAND_NAME} on or /${COMMAND_NAME} off.` }
}

// --- Hooks ----------------------------------------------------------------

/** The second-by-second tick while a call runs, so running cards count up. */
let ticker: Timer | undefined

const tickNow = async ($: EngineInterface) => {
  const now = await $.clock.now()
  await update($, DRAWER_CLOCK, () => now)
}

function startTicking($: EngineInterface) {
  ticker ??= $.clock.every(TICK_MS, () => void tickNow($))
}

function stopTicking() {
  ticker?.cancel()
  ticker = undefined
}

async function record($: EngineInterface, trail: PromptTrail, id: string, command: string, run: () => Promise<ToolCallResult>) {
  const startedAt = await $.clock.now()
  const promptId = newestPromptId(trail)
  const call = startedCall(id, command, promptId, startedAt)
  let isFirst = false
  await update($, HELD_CALLS, calls => {
    isFirst = isFirstOfTurn(calls, promptId)
    return withCall(calls, call)
  })
  if (isFirst) await update($, DRAWER_VIEW, view => (view.isSetByHand ? view : { ...view, isOpen: true }))
  await update($, DRAWER_CLOCK, () => startedAt)
  startTicking($)

  const end = async (ending: { status: HeldCallStatus; text: string }) => {
    const endedAt = await $.clock.now()
    const calls = await update($, HELD_CALLS, list => list.map(one => (one.id === id ? endedCall(one, ending, endedAt) : one)))
    if (!calls.some(one => one.status === 'running')) stopTicking()
    if (ending.status === 'error') await update($, DRAWER_VIEW, view => openedOnFailure(view, id))
    askedCalls.delete(id)
    callsSeenRunning.delete(id)
  }
  try {
    const ran = await run()
    await end(endingOf(ran, { wasAsked: askedCalls.has(id), wasSeenRunning: callsSeenRunning.has(id) }))
    return ran
  } catch (error) {
    // A call cut short by an abort settles by throwing.
    await end({ status: 'interrupted', text: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/** The calls put to the permission dialog, and those drawn running since: a call asked and never seen running that errs was declined. */
const askedCalls = new Set<string>()
const callsSeenRunning = new Set<string>()

/** The view with a failed call's card open, unless the person closed that card. */
export const openedOnFailure = (view: DrawerView, id: string): DrawerView =>
  view.collapsed.includes(id) || view.expanded.includes(id) ? view : { ...view, expanded: [...view.expanded, id] }

/**
 * Marks a held call the row says an abort ended, once: a failed or still
 * running call is interrupted. A write is refused while drawing, so it goes
 * on the clock.
 */
function markInterrupted($: EngineInterface, id: string, calls: readonly HeldCall[]) {
  const call = calls.find(one => one.id === id)
  if (call === undefined || (call.status !== 'running' && call.status !== 'error')) return
  $.clock.after(0, () => void update($, HELD_CALLS, list => list.map(one => (one.id === id && (one.status === 'running' || one.status === 'error') ? { ...one, status: 'interrupted' } : one))))
}

/** Whether the drawer holds the call now, read while drawing so a call's start or end draws the row again. */
async function holds($: EngineInterface, id: string | undefined): Promise<boolean> {
  return isHeld(await read($, DRAWER_VIEW), await read($, HELD_CALLS), id)
}

const press = ($: EngineInterface, change: (view: DrawerView) => DrawerView) => update($, DRAWER_VIEW, change)

/** The view with the card opened, or closed by hand. */
export function toggleExpanded(view: DrawerView, id: string): DrawerView {
  if (view.expanded.includes(id)) return { ...view, expanded: view.expanded.filter(one => one !== id), collapsed: [...view.collapsed, id] }
  return { ...view, expanded: [...view.expanded, id], collapsed: view.collapsed.filter(one => one !== id) }
}

/**
 * The tool drawer: the main conversation's shell commands leave the
 * transcript and show in a drawer above the prompt arrows, one card a call,
 * listed for the prompt the arrows are on or for all prompts. A row leaves
 * the transcript only for a call the drawer keeps, and only while it is on;
 * calls from before the plugin loaded keep their rows. `/tool-drawer off`
 * gives every row back.
 *
 * Register it after `registerPromptJump`, with the same trail, so it draws
 * above the arrows; `startToolDrawer` runs once the session has started.
 */
export function registerToolDrawer(on: On, trail: PromptTrail) {
  // `/clear` and `/resume` go on in this process with another conversation.
  on('session.end', { reason: ['clear', 'resume'] }, async ($, e, next) => {
    stopTicking()
    await update($, HELD_CALLS, () => [])
    await update($, DRAWER_VIEW, view => ({ ...NEW_VIEW, isOn: view.isOn }))
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.tool !== DRAWER_TOOL || e.agentId !== undefined) return next(e)
    return record($, trail, e.tool_use_id, e.command, () => next(e))
  })

  on('command.run', { command: COMMAND_NAME }, async ($, e) => {
    let text = ''
    await update($, DRAWER_VIEW, view => {
      const after = switched(view, e.args)
      text = after.text
      return after.view
    })
    return { text }
  })

  // A call put to a decider: the dialog, or the auto-mode classifier.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision === 'ask' && e.tool === DRAWER_TOOL && e.tool_use_id !== undefined) askedCalls.add(e.tool_use_id)
    return verdict
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== DRAWER_TOOL) return next(e)
    if (e.props.isRunning) callsSeenRunning.add(e.props.tool_use_id)
    if (!(await holds($, e.props.tool_use_id))) return next(e)
    if (e.props.isInterrupted) markInterrupted($, e.props.tool_use_id, await read($, HELD_CALLS))
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.tool !== DRAWER_TOOL || !(await holds($, e.props.tool_use_id))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => {
    // The run-in-background pill shows only under a running call.
    callsSeenRunning.add(e.props.tool_use_id)
    if (!(await holds($, e.props.tool_use_id))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  on('ui.render', { component: 'ToolGroup' }, async ($, e, next) => {
    const { calls } = e.props
    if (calls.length === 0) return next(e)
    const [view, held] = [await read($, DRAWER_VIEW), await read($, HELD_CALLS)]
    if (!calls.every(call => call.tool === DRAWER_TOOL && isHeld(view, held, call.tool_use_id))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  // The band stacks one row per plugin in `maxRows` together, so the drawer
  // learns what the others take once the band settles. A write is refused
  // while drawing, so it goes on the clock, and only when the count changed.
  on('ui.render', { component: 'AbovePromptList' }, async ($, e, next) => {
    const measured = otherRowsOf(e.props.rows, $.plugin.name)
    if (measured !== (await read($, OTHER_BAND_ROWS))) $.clock.after(0, () => void update($, OTHER_BAND_ROWS, () => measured))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)
    const view = await read($, DRAWER_VIEW)
    if (!view.isOn) return next(e)

    const turn = await readTurnOn($, trail)
    const shown = callsInScope(await read($, HELD_CALLS), view.scope, turn)
    if (shown.length === 0) return next(e)

    const now = await read($, DRAWER_CLOCK)
    const beneath = await next(e)
    const isRunning = shown.some(call => call.status === 'running')
    const scope = scopeText(view.scope, turn)
    const layout = view.isOpen ? drawerLayout(shown, view.expanded, drawerRoom(e.props.maxRows, await read($, OTHER_BAND_ROWS))) : { cards: [], earlierCalls: 0 }
    const isFramed = layout.cards.length > 0
    // Inside the frame, the border and its padding take two cells a side.
    const width = isFramed ? e.props.bodyColumns - 2 - 2 * FRAME_PADDING : e.props.bodyColumns
    const bar = barTexts(`${view.isOpen ? '▾' : '▸'} ${summaryText(shown)}`, runningText(shown, now), scope, width)
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {beneath}
        <Box
          flexDirection="column"
          {...(isFramed ? { borderStyle: 'round', paddingX: FRAME_PADDING, ...(isRunning ? { borderColor: RUNNING_COLOR } : { borderDimColor: true }) } : {})}
        >
          <Box flexDirection="row" columnGap={1}>
            <Button
              key="tool-drawer:toggle"
              plain
              label={bar.summary}
              onPress={() => press($, current => ({ ...current, isOpen: !current.isOpen, isSetByHand: true }))}
            />
            {isRunning ? <Text color={RUNNING_COLOR}>●</Text> : null}
            {bar.running === undefined ? null : <Text>{bar.running}</Text>}
            <Button
              key="tool-drawer:scope"
              dimColor
              label={scope}
              onPress={() => press($, current => ({ ...current, scope: current.scope === 'all' ? 'turn' : 'all' }))}
            />
          </Box>
          {layout.earlierCalls > 0 ? <Text dimColor>{earlierCallsText(layout.earlierCalls, width)}</Text> : null}
          {layout.cards.map(({ call, bodyLines }) => {
            const isExpanded = view.expanded.includes(call.id)
            const body = bodyLines === undefined ? undefined : cardBody(call, width, bodyLines)
            const label = cardText(call, isExpanded, now, width)
            return (
              <Box key={`tool-drawer:call:${call.id}`} flexDirection="column">
                <Button
                  key={`tool-drawer:card:${call.id}`}
                  plain
                  dimColor={call.status === 'done'}
                  label={label}
                  onPress={() => press($, current => toggleExpanded(current, call.id))}
                >
                  {label.slice(0, 2)}
                  <Text {...markStyle(call.status)}>{label.slice(2, 3)}</Text>
                  {label.slice(3)}
                </Button>
                {body === undefined ? null : (
                  <Box flexDirection="column">
                    <Text>{body.command}</Text>
                    {body.earlierNote === undefined ? null : <Text dimColor>{body.earlierNote}</Text>}
                    {body.lines.map(line => (
                      <Text>{line}</Text>
                    ))}
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
      </Box>
    )
  })
}

/** Adds `/tool-drawer`, once the session has started. */
export async function startToolDrawer($: EngineInterface) {
  try {
    await $.command.register({ name: COMMAND_NAME, description: 'Show shell commands in a drawer above the prompt: on, off, or no argument for its state' })
  } catch (error) {
    // The drawer works without its command; it stays on.
    $.ui.log(`sc-mods: could not add /${COMMAND_NAME}: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  }
}
