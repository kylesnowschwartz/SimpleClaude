import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer, ToolCallResult } from 'claude-code'
import type { DrawerScope, DrawerView, HeldCall, HeldCallStatus } from '../types'
import { cleanLine, cleanText, fit } from './drawer-text'
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
const ELLIPSIS = '…'

// Change a tag when its value's fields change: it declines what an earlier version stored.
const HELD_CALLS = atom({ plugin: 'sc-mods', key: 'heldCalls' } as const, [], { shape: 'held-calls-1' })
export const NEW_VIEW: DrawerView = { isOn: true, isOpen: false, isSetByHand: false, scope: 'turn', expanded: [] }
const DRAWER_VIEW = atom({ plugin: 'sc-mods', key: 'drawerView' } as const, NEW_VIEW, { shape: 'drawer-view-1' })
/** The time a running card's elapsed seconds count to, moved on each second while a call runs. */
const DRAWER_CLOCK = atom({ plugin: 'sc-mods', key: 'drawerClock' } as const, 0)

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

/** How the call ended and the text it printed: stdout then stderr, or the error the result carries. */
export function endingOf(ran: ToolCallResult): { status: HeldCallStatus; text: string } {
  if (ran.deny !== undefined) return { status: 'error', text: ran.deny }
  if (ran.isError) return { status: 'error', text: ran.text ?? '' }
  const result = ran.result as { stdout?: unknown; stderr?: unknown } | undefined
  const stdout = typeof result?.stdout === 'string' ? result.stdout : ''
  const stderr = typeof result?.stderr === 'string' ? result.stderr : ''
  return { status: 'done', text: joinStreams(stdout, stderr) }
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

/** `Tool Usage (2 done · 1 failed · 1 running · bash)`, each count shown only when above 0. */
export function summaryText(calls: readonly HeldCall[]): string {
  const count = (status: HeldCallStatus) => calls.filter(call => call.status === status).length
  const parts = [
    [count('done'), 'done'],
    [count('error'), 'failed'],
    [count('running'), 'running'],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, word]) => `${n} ${word}`)
  return `Tool Usage (${[...parts, TOOL_LABEL].join(' · ')})`
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

const STATUS_MARK: Record<HeldCallStatus, string> = { running: ELLIPSIS, done: '✓', error: '✗' }

/** A card's line: `▸ ✓ bash 0.4s  <first line of the command>`, cut to `width`; a running call shows its seconds so far. */
export function cardText(call: HeldCall, isExpanded: boolean, now: number, width: number): string {
  const elapsed = call.status === 'running' ? `${Math.max(0, Math.floor((now - call.startedAt) / 1000))}s` : durationText(call.durationMs)
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

/**
 * Rows the band keeps clear under the drawer: the prompt arrows' row, and one
 * more for a row another plugin draws beneath, which cannot be measured.
 */
export const ROWS_BENEATH_DRAWER = 2

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

/**
 * Fits the open drawer into `rows` rows, the bar's included. The room goes to
 * the bar, then a row per card (the newest when not all fit, under a dim
 * `… N earlier calls` row), then the expanded cards' bodies, the newest first.
 * Under two rows the bar shows alone.
 */
export function drawerLayout(calls: readonly HeldCall[], expanded: readonly string[], rows: number): DrawerLayout {
  const cardRows = rows - 1
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
  }
  try {
    const ran = await run()
    await end(endingOf(ran))
    return ran
  } catch (error) {
    await end({ status: 'error', text: error instanceof Error ? error.message : String(error) })
    throw error
  }
}

/** Whether the drawer holds the call now, read while drawing so a call's start or end draws the row again. */
async function holds($: EngineInterface, id: string | undefined): Promise<boolean> {
  return isHeld(await read($, DRAWER_VIEW), await read($, HELD_CALLS), id)
}

const press = ($: EngineInterface, change: (view: DrawerView) => DrawerView) => update($, DRAWER_VIEW, change)

const toggleExpanded = (view: DrawerView, id: string): DrawerView => ({
  ...view,
  expanded: view.expanded.includes(id) ? view.expanded.filter(one => one !== id) : [...view.expanded, id],
})

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

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== DRAWER_TOOL || !(await holds($, e.props.tool_use_id))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  on('ui.render', { component: 'ToolResult' }, async ($, e, next) => {
    if (e.props.tool !== DRAWER_TOOL || !(await holds($, e.props.tool_use_id))) return next(e)
    const { Box } = $.ui.resolve(e)
    return <Box />
  })

  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => {
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

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)
    const view = await read($, DRAWER_VIEW)
    if (!view.isOn) return next(e)

    const turn = await readTurnOn($, trail)
    const shown = callsInScope(await read($, HELD_CALLS), view.scope, turn)
    if (shown.length === 0) return next(e)

    const now = await read($, DRAWER_CLOCK)
    const beneath = await next(e)
    const width = e.props.bodyColumns
    const isRunning = shown.some(call => call.status === 'running')
    const scope = scopeText(view.scope, turn)
    // The bar's other parts: the dot, the scope button's brackets and the gaps.
    const layout = view.isOpen ? drawerLayout(shown, view.expanded, e.props.maxRows - ROWS_BENEATH_DRAWER) : { cards: [], earlierCalls: 0 }
    const summaryWidth = width - scope.length - (isRunning ? 2 : 0) - 6
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {beneath}
        <Box flexDirection="row" columnGap={1}>
          <Button
            key="tool-drawer:toggle"
            plain
            label={fit(`${view.isOpen ? '▾' : '▸'} ${summaryText(shown)}`, summaryWidth)}
            onPress={() => press($, current => ({ ...current, isOpen: !current.isOpen, isSetByHand: true }))}
          />
          {isRunning ? <Text color="yellow">●</Text> : null}
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
          return (
            <Box key={`tool-drawer:call:${call.id}`} flexDirection="column">
              <Button
                key={`tool-drawer:card:${call.id}`}
                plain
                dimColor={call.status === 'done'}
                label={cardText(call, isExpanded, now, width)}
                onPress={() => press($, current => toggleExpanded(current, call.id))}
              />
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
