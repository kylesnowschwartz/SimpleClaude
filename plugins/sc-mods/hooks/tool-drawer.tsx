import { atom, read, update } from 'claude-code'
import type { ElementConstructor, EngineInterface, On, TextHoverProps, TextProps, RenderSurface, Timer, ToolCallResult } from 'claude-code'
import type { DrawerScope, DrawerView, HeldCall, HeldCallStatus } from '../types'
import { rowsOf } from './band-rows'
import { cells, cleanLine, cleanText, fit, headOf } from './drawer-text'
import { outputLanguage, type OutputLanguage } from './output-language'
import { fitTokens, isDimRole, SHELL_ROLE_COLOR, shellTokens, tokenCells, type ShellToken } from './shell-colors'
import { ARROW_CELLS, newestPromptId, promptArrows, readStoredPrompts, readTurnOn, type PromptTrail, type TurnOn } from './prompt-jump'

/** The one tool whose calls the drawer holds. */
export const DRAWER_TOOL = 'Bash'
const TOOL_LABEL = 'bash'
/** The Nerd Font wrench (nf-md-wrench_outline, U+F0BE0) a card shows for the shell tool; one cell wide. */
export const TOOL_ICON = '\u{F0BE0}'
const COMMAND_NAME = 'tool-drawer'
/** The `$.store` key that keeps `/tool-drawer on|off` across sessions. */
const SWITCH_KEY = 'toolDrawerOn'

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
/** The theme colours of a command's program name and of a failed call's error text. */
const ACCENT_COLOR = 'suggestion'
const ERROR_COLOR = 'error'
/** The theme colour of an open card's `┃` bar. */
const BAR_COLOR = 'success'
/** The one colour every part of a card's row takes under the pointer, so the row lights as one block. */
const HOVER_COLOR = 'text'
const COPY_LABEL = '⧉ copy'
/** The cells of the bottom border before the turn arrows drawn over it: the corner and one line. */
const ARROWS_INDENT = 2
/** The cells between the drawer's border and its text on each side. */
const FRAME_PADDING = 1
const ELLIPSIS = '…'

// Change a tag when its value's fields change: it declines what an earlier version stored.
const HELD_CALLS = atom({ plugin: 'sc-mods', key: 'heldCalls' } as const, [], { shape: 'held-calls-4' })
export const NEW_VIEW: DrawerView = { isOn: true, isOpen: false, isSetByHand: false, scope: 'turn', expanded: [] }
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

/**
 * How the call ended and the text it printed: stdout then stderr, or the
 * error the result carries. `hasRun` says the call was allowed and started:
 * an error or refusal of a call that never started was declined (at the
 * permission dialog, by the auto-mode classifier, or by a hook). An error that
 * says the person stopped it, or a result marked interrupted, is interrupted.
 * A result that names a background task moved there and runs on.
 */
export function endingOf(ran: ToolCallResult, hasRun = true): CallEnding {
  if (ran.deny !== undefined) return { status: hasRun ? 'error' : 'declined', text: ran.deny }
  if (ran.isError) {
    const text = ran.text ?? ''
    if (INTERRUPTED_TEXT.test(text)) return { status: 'interrupted', text }
    return { status: hasRun ? 'error' : 'declined', text }
  }
  const result = ran.result as { stdout?: unknown; stderr?: unknown; interrupted?: unknown; backgroundTaskId?: unknown } | undefined
  const stdout = typeof result?.stdout === 'string' ? result.stdout : ''
  const stderr = typeof result?.stderr === 'string' ? result.stderr : ''
  const text = joinStreams(stdout, stderr)
  if (typeof result?.backgroundTaskId === 'string' && result.backgroundTaskId !== '') return { status: 'background', text, backgroundTaskId: result.backgroundTaskId }
  return { status: result?.interrupted === true ? 'interrupted' : 'done', text }
}

/** How a call ended, the text it printed, and the background task it moved to, if it did. */
export type CallEnding = { status: HeldCallStatus; text: string; backgroundTaskId?: string }

/** A new running call, as the drawer keeps it. */
export function startedCall(id: string, command: string, promptId: string | undefined, startedAt: number): HeldCall {
  return { id, promptId: promptId ?? '', command: fit(cleanText(command), MAX_COMMAND_CHARS), status: 'running', startedAt, durationMs: 0, output: [], outputLineCount: 0, backgroundTaskId: '' }
}

/** The calls with one more, the oldest dropped past MAX_HELD_CALLS. */
export const withCall = (calls: readonly HeldCall[], call: HeldCall): HeldCall[] => [...calls.filter(one => one.id !== call.id), call].slice(-MAX_HELD_CALLS)

/** The call ended: its status, duration and output. */
export function endedCall(call: HeldCall, ending: CallEnding, endedAt: number): HeldCall {
  return { ...call, status: ending.status, durationMs: Math.max(0, endedAt - call.startedAt), ...keptOutput(ending.text), backgroundTaskId: ending.backgroundTaskId ?? '' }
}

/** Whether a call starting under `promptId` is the first of its prompt: no call kept so far ran under it. */
export const isFirstOfTurn = (calls: readonly HeldCall[], promptId: string | undefined) =>
  promptId !== undefined && !calls.some(call => call.promptId === promptId)

/** The calls the drawer lists, oldest first: those of the prompt the arrows are on, or all. */
export function callsInScope(calls: readonly HeldCall[], scope: DrawerScope, turn: TurnOn | undefined): HeldCall[] {
  if (scope === 'all') return [...calls]
  return turn === undefined ? [] : calls.filter(call => call.promptId === turn.promptId)
}

/**
 * The turn whose commands the drawer lists under scope `turn`: the one the
 * arrows are on, except while they rest at the end of the conversation on a
 * prompt with no command yet, where it is the latest earlier prompt with a
 * command. So the drawer stays in place between a prompt and its first
 * command. `prompts` is the trail's prompt ids in the order sent.
 */
export function listedTurn(calls: readonly HeldCall[], turn: TurnOn | undefined, prompts: readonly string[], isAtRest: boolean): TurnOn | undefined {
  if (!isAtRest || turn === undefined) return turn
  const hasCalls = (promptId: string | undefined) => calls.some(call => call.promptId === promptId)
  if (hasCalls(turn.promptId)) return turn
  for (let index = turn.number - 2; index >= 0; index -= 1) {
    const promptId = prompts[index]
    if (promptId !== undefined && hasCalls(promptId)) return { promptId, number: index + 1, count: turn.count }
  }
  return turn
}

/** `Tool Usage (2 done · 1 failed · 1 declined · 1 running · bash)`, each count shown only when above 0. */
export function summaryText(calls: readonly HeldCall[]): string {
  const count = (status: HeldCallStatus) => calls.filter(call => call.status === status).length
  const parts = [
    [count('done'), 'done'],
    [count('error'), 'failed'],
    [count('declined'), 'declined'],
    [count('interrupted'), 'interrupted'],
    [count('background'), 'in background'],
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

/** The cells the turn arrows take around the scope button: `[ ◀ ] [ Turn 3/8 ] [ ▶ ]`. */
export const arrowsCells = (scope: string) => ARROW_CELLS + 1 + cells(scope) + 4 + 1 + ARROW_CELLS

/**
 * The bar's texts cut to `width` cells together with `endCells` cells at its
 * end (the turn arrows and the gap before them, or none), the `●` and the
 * gaps: the summary first, then the running command, then `note`, each in
 * what is left and dropped when under 4 cells.
 */
export function barTexts(
  summary: string,
  running: string | undefined,
  endCells: number,
  width: number,
  note?: string,
): { summary: string; running: string | undefined; note: string | undefined } {
  const scopeCells = endCells
  const dotCells = running === undefined ? 0 : 2
  const fittedSummary = fit(summary, width - scopeCells - dotCells)
  let left = width - scopeCells - dotCells - cells(fittedSummary)
  const take = (text: string | undefined) => {
    if (text === undefined || left - 1 < 4) return undefined
    const fitted = fit(text, left - 1)
    left -= cells(fitted) + 1
    return fitted
  }
  const fittedRunning = take(running)
  return { summary: fittedSummary, running: fittedRunning, note: take(note) }
}

/** The bar's note while the drawer is open and the band has no room for one card. */
export const NO_ROOM_NOTE = 'no room for cards'

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

const STATUS_MARK: Record<HeldCallStatus, string> = { running: ELLIPSIS, done: '✓', error: '✗', declined: '⊘', interrupted: '■', background: '↗' }

/** How a card's mark is drawn: a failure in the error colour, a declined or interrupted call dim, the rest as the line. */
export const markStyle = (status: HeldCallStatus): { color?: string; dimColor?: boolean } =>
  status === 'error' ? { color: ERROR_COLOR } : status === 'declined' || status === 'interrupted' || status === 'background' ? { dimColor: true } : {}

/** A card's line in its drawn parts: the caret and a space, the status mark, the icon and time, and the command's coloured first line. */
export type CardParts = { caret: string; mark: string; head: string; command: ShellToken[] }

/** A card's time: its seconds so far while running, its duration once ended, empty when unknown or in the background. */
export function elapsedText(call: HeldCall, now: number): string {
  // A call in the background runs on, so it shows no time that reads as finished.
  if (call.status === 'running') return secondsSince(call.startedAt, now)
  return call.durationMs < 0 || call.status === 'background' ? '' : durationText(call.durationMs)
}

/** The cells the widest time of the cards takes, so every card's command starts at one column. */
export const elapsedCells = (calls: readonly HeldCall[], now: number) => Math.max(0, ...calls.map(call => cells(elapsedText(call, now))))

/**
 * A card's line, `▸ ✓ 󰯠  0.4s  <first line of the command>`, in parts cut to
 * `width` cells together. The time is padded to `timeCells` cells, so cards
 * with and without a time start their commands at one column. Two spaces
 * follow the icon: a terminal may draw a Nerd Font icon over the cell after it.
 */
export function cardParts(call: HeldCall, isExpanded: boolean, now: number, width: number, timeCells = 0): CardParts {
  const elapsed = elapsedText(call, now)
  const time = elapsed + ' '.repeat(Math.max(0, timeCells - cells(elapsed)))
  const caret = `${isExpanded ? '▾' : '▸'} `
  const mark = STATUS_MARK[call.status]
  const head = time === '' ? ` ${TOOL_ICON}  ` : ` ${TOOL_ICON}  ${time}  `
  const prefix = caret + mark + head
  const command = shellTokens(call.command.split('\n')[0] ?? '')
  if (cells(prefix) + tokenCells(command) <= width) return { caret, mark, head, command }
  if (cells(prefix) < width) return { caret, mark, head, command: fitTokens(command, width - cells(prefix)) }
  const cut = fit(prefix, width)
  return { caret: cut.slice(0, caret.length), mark: cut.slice(caret.length, caret.length + mark.length), head: cut.slice(caret.length + mark.length), command: [] }
}

/** A card's line as plain text: its parts joined. */
export function cardText(call: HeldCall, isExpanded: boolean, now: number, width: number, timeCells = 0): string {
  const parts = cardParts(call, isExpanded, now, width, timeCells)
  return parts.caret + parts.mark + parts.head + parts.command.map(token => token.text).join('')
}

/** The most rows an open card's command takes; past them a dim note counts the rest. */
export const COMMAND_ROWS = 8
/** The cells the open card's `┃` bar and the gap after it take. */
export const BAR_CELLS = 2
/** The cells before each command row: `$ ` on the first, two spaces under it. */
const PROMPT_CELLS = 2
/** The width the body layout assumes when none is given: each source line one row. */
const UNBOUNDED = 100_000

/** The line split into rows of at most `width` cells; an empty line is one empty row. */
export function wrapCells(line: string, width: number): string[] {
  if (width <= 0) return [line]
  const rows: string[] = []
  let rest = line
  do {
    const head = headOf(rest, width)
    // A character wider than the row still moves on.
    const taken = head === '' ? [...rest][0] ?? '' : head
    rows.push(taken)
    rest = rest.slice(taken.length)
  } while (rest !== '')
  return rows
}

/** An open card's command as its rows show it: each line wrapped to `width` cells, at most COMMAND_ROWS, and how many rows are left out. */
export function commandBlock(command: string, width: number): { rows: string[]; moreRows: number } {
  const all = command.split('\n').flatMap(line => wrapCells(line, width - PROMPT_CELLS))
  return { rows: all.slice(0, COMMAND_ROWS), moreRows: Math.max(0, all.length - COMMAND_ROWS) }
}

/** `… 3 more lines`: the command rows a body leaves out. */
const moreLinesText = (count: number) => `${ELLIPSIS} ${count} more line${count === 1 ? '' : 's'}`

/** What an open card's body draws beside its `┃` bar, each row cut to the content width. */
export type CardBody = {
  /** The command's rows, wrapped, under the `$ ` prompt. */
  commandRows: string[]
  /** The dim note of the command rows left out. */
  commandNote: string | undefined
  backgroundNote: string | undefined
  earlierNote: string | undefined
  /** The output's shown lines, each one row. */
  lines: string[]
}

/** The rows a body takes: its command rows and notes and its shown output lines. */
export const bodyRows = (body: CardBody) =>
  body.commandRows.length + (body.commandNote === undefined ? 0 : 1) + (body.backgroundNote === undefined ? 0 : 1) + (body.earlierNote === undefined ? 0 : 1) + body.lines.length

/**
 * An expanded card's body beside its bar, in `width` cells counting the bar:
 * the command wrapped over up to COMMAND_ROWS rows with a dim note of the
 * rest, the background note, a dim note of the output lines left out, then
 * the last `shownLines` output lines (at most SHOWN_LINES), each cut to one row.
 */
export function cardBody(call: HeldCall, width: number, shownLines = SHOWN_LINES): CardBody {
  const content = width - BAR_CELLS
  const count = Math.max(0, Math.min(shownLines, SHOWN_LINES))
  const lines = count === 0 ? [] : call.output.slice(-count)
  const earlier = call.outputLineCount - lines.length
  const command = commandBlock(call.command, content)
  return {
    commandRows: command.rows,
    commandNote: command.moreRows > 0 ? fit(moreLinesText(command.moreRows), content) : undefined,
    backgroundNote: call.status === 'background' ? fit(backgroundNoteText(call.backgroundTaskId), content) : undefined,
    earlierNote: earlier > 0 ? fit(`${ELLIPSIS} ${earlier} earlier line${earlier === 1 ? '' : 's'}`, content) : undefined,
    lines: lines.map(line => headOf(line, content)),
  }
}

/** What an open card of a call in the background says of it. */
export const backgroundNoteText = (taskId: string) => `Runs in the background as task ${taskId}; its output arrives in the conversation.`


/** The rows the open drawer may take: the band's room less the other plugins' rows. The turn arrows sit in the drawer's own rows. */
export const drawerRoom = (maxRows: number, otherRows: number) => maxRows - otherRows

/** The rows the band rows of other plugins take, by plugin name. */
export function otherRowsOf(rows: ReadonlyArray<{ plugin: string; tree: unknown }>, ownPlugin: string): number {
  return rows.filter(row => row.plugin !== ownPlugin).reduce((sum, row) => sum + rowsOf(row.tree), 0)
}

/** One card the open drawer shows, and how many output lines its body shows; undefined for no body. */
export type CardRoom = { call: HeldCall; bodyLines: number | undefined }

/** What the open drawer shows in the rows it has: the cards, and how many older calls the dim note counts. */
export type DrawerLayout = { cards: CardRoom[]; earlierCalls: number }

/** The most output lines a body shows in `rows`, with its command rows and its notes; undefined when not even the command fits. */
function bodyLinesIn(call: HeldCall, rows: number, width: number): number | undefined {
  const command = commandBlock(call.command, width - BAR_CELLS)
  const fixedRows = command.rows.length + (command.moreRows > 0 ? 1 : 0) + (call.status === 'background' ? 1 : 0)
  for (let lines = Math.min(SHOWN_LINES, call.output.length); lines >= 0; lines -= 1) {
    if (fixedRows + lines + (call.outputLineCount > lines ? 1 : 0) <= rows) return lines
  }
  return undefined
}

/** The rows the open drawer's rounded border takes: its top and bottom lines. */
export const FRAME_ROWS = 2

/**
 * Fits the open drawer into `rows` rows, its frame and bar included. The room
 * goes to the frame and the bar, then to the open cards' rows and bodies, the
 * most recently opened first (the last of `expanded`), then a row per other
 * card, the newest first, under a dim `… N earlier calls` row when not all
 * fit. An open card without room for its body's command row shows closed.
 * Without room for the frame, the bar and one card, the bar shows alone,
 * unframed.
 */
export function drawerLayout(calls: readonly HeldCall[], expanded: readonly string[], rows: number, width = UNBOUNDED): DrawerLayout {
  const cardRows = rows - FRAME_ROWS - 1
  if (cardRows < 1 || calls.length === 0) return { cards: [], earlierCalls: 0 }

  const bodyLines = new Map<string, number>()
  let used = 0
  for (const id of [...expanded].reverse()) {
    const call = calls.find(one => one.id === id)
    if (call === undefined) continue
    // A row stays for the note while other cards are left to list.
    const noteRow = calls.length - bodyLines.size - 1 > 0 ? 1 : 0
    const lines = bodyLinesIn(call, cardRows - used - 1 - noteRow, width)
    if (lines === undefined) continue
    bodyLines.set(call.id, lines)
    used += 1 + bodyRows(cardBody(call, width, lines))
  }

  const others = calls.filter(call => !bodyLines.has(call.id))
  const left = cardRows - used
  // With one row for cards, no open card, and more calls than that, the newest card shows without the note.
  const othersShown = others.length <= left ? others.length : bodyLines.size === 0 && left === 1 ? 1 : Math.max(0, left - 1)
  const shownOthers = new Set(others.slice(others.length - othersShown).map(call => call.id))
  const shown = calls.filter(call => bodyLines.has(call.id) || shownOthers.has(call.id))
  const earlierCalls = calls.length - shown.length
  const hasNoteRow = earlierCalls > 0 && left - othersShown >= 1
  return { cards: shown.map(call => ({ call, bodyLines: bodyLines.get(call.id) })), earlierCalls: hasNoteRow ? earlierCalls : 0 }
}

/** `… 3 earlier calls`, cut to `width`. */
export const earlierCallsText = (count: number, width: number) => fit(`${ELLIPSIS} ${count} earlier call${count === 1 ? '' : 's'}`, width)

/** What a card's copy button puts on the clipboard: `$ <command>`, then the output it kept. */
export const copyText = (call: HeldCall): string => [`$ ${call.command}`, ...call.output].join('\n')

/** A past message as the conversation read gives it: its role and row id, and an assistant message's tool calls with their outcomes. */
type PastMessage = { role: string; uuid?: string; toolUses: ReadonlyArray<{ tool_use_id: string; tool: string; input: Record<string, unknown>; result?: unknown; text?: string; isError?: true }> }

/**
 * The finished shell commands of the main conversation read back, oldest
 * first, each under the person's prompt it followed (one of `promptIds`, or
 * none before the first). A call still in flight, or already in `held`, is
 * left out. Their timing is not stored, so `durationMs` is -1.
 */
export function restoredCalls(messages: readonly PastMessage[], promptIds: ReadonlySet<string>, held: ReadonlySet<string>): HeldCall[] {
  const calls: HeldCall[] = []
  let promptId: string | undefined
  for (const message of messages) {
    if (message.role === 'user' && message.uuid !== undefined && promptIds.has(message.uuid)) promptId = message.uuid
    for (const use of message.toolUses) {
      if (use.tool !== DRAWER_TOOL || use.text === undefined || held.has(use.tool_use_id)) continue
      const command = typeof use.input.command === 'string' ? use.input.command : ''
      const ran = (use.isError ? { isError: true, result: undefined, text: use.text } : { result: use.result }) as ToolCallResult
      calls.push(endedCall(startedCall(use.tool_use_id, command, promptId, 0), endingOf(ran), 0))
    }
  }
  return calls.map(call => ({ ...call, durationMs: -1 }))
}

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

/** Moves the running cards' clock on; a tick that finds no call under way stops the ticker. */
async function tickNow($: EngineInterface) {
  if (callsUnderWay.size === 0) {
    stopTicking()
    return
  }
  try {
    const now = await $.clock.now()
    await update($, DRAWER_CLOCK, () => now)
  } catch (error) {
    stopTicking()
    logQuietly($, 'move the clock on', error)
  }
}

function startTicking($: EngineInterface) {
  ticker ??= $.clock.every(TICK_MS, () => void tickNow($))
}

function stopTicking() {
  ticker?.cancel()
  ticker = undefined
}

/** Logs a failure of the drawer's own bookkeeping to the debug log; the log itself never throws into a hook. */
function logQuietly($: EngineInterface, what: string, error: unknown) {
  try {
    $.ui.log(`sc-mods: tool drawer could not ${what}: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  } catch {
    // Nothing is left to tell.
  }
}

/** Keeps a call that starts: it joins the drawer, which opens at a new prompt's first call, and the clock ticks while it runs. */
async function noteStart($: EngineInterface, trail: PromptTrail, id: string, command: string) {
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
}

/**
 * The conversation the process is on, counted up at each `/clear` and
 * `/resume`: a call that ends after its conversation ended keeps nothing.
 */
let conversation = 0

/** Keeps how a call ended; nothing when its conversation has ended. */
async function noteEnd($: EngineInterface, id: string, ending: CallEnding, startedIn: number) {
  if (startedIn !== conversation) return
  const endedAt = await $.clock.now()
  await update($, HELD_CALLS, list => list.map(one => (one.id === id ? endedCall(one, ending, endedAt) : one)))
}

/** The view with only the held calls' ids in `expanded`. */
export function prunedView(view: DrawerView, calls: readonly HeldCall[]): DrawerView {
  const held = new Set(calls.map(call => call.id))
  return { ...view, expanded: view.expanded.filter(id => held.has(id)) }
}

/**
 * Runs the call with the drawer's bookkeeping around it. The command's own
 * promise alone decides what the hook returns or throws: bookkeeping before
 * the run and after it is guarded apart, a failure there only logged, and
 * `run` is called exactly once.
 */
async function record($: EngineInterface, trail: PromptTrail, id: string, command: string, run: () => Promise<ToolCallResult>) {
  const underWay = { hasRun: false }
  const startedIn = conversation
  callsUnderWay.set(id, underWay)
  try {
    await noteStart($, trail, id, command)
  } catch (error) {
    logQuietly($, 'keep a starting command', error)
  }

  let ran: ToolCallResult
  try {
    ran = await run()
  } catch (error) {
    // A call cut short by an abort settles by throwing.
    callsUnderWay.delete(id)
    try {
      await noteEnd($, id, { status: 'interrupted', text: error instanceof Error ? error.message : String(error) }, startedIn)
    } catch (bookkeeping) {
      logQuietly($, 'keep an interrupted command', bookkeeping)
    } finally {
      if (callsUnderWay.size === 0) stopTicking()
    }
    throw error
  }

  callsUnderWay.delete(id)
  try {
    await noteEnd($, id, endingOf(ran, underWay.hasRun), startedIn)
  } catch (error) {
    logQuietly($, 'keep a finished command', error)
  } finally {
    if (callsUnderWay.size === 0) stopTicking()
  }
  return ran
}

/**
 * The calls under way that the drawer holds, by id: whether each has been
 * allowed and started (`tool.run` fires for it). Added when a call starts,
 * removed when it ends, emptied when the conversation ends.
 */
const callsUnderWay = new Map<string, { hasRun: boolean }>()

/**
 * Marks a held call the row says an abort ended, once: a failed or still
 * running call is interrupted. A write is refused while drawing, so it goes
 * on the clock.
 */
function markInterrupted($: EngineInterface, id: string, calls: readonly HeldCall[]) {
  const call = calls.find(one => one.id === id)
  if (call === undefined || (call.status !== 'running' && call.status !== 'error')) return
  try {
    $.clock.after(0, () =>
      void update($, HELD_CALLS, list => list.map(one => (one.id === id && (one.status === 'running' || one.status === 'error') ? { ...one, status: 'interrupted' } : one))).catch(error =>
        logQuietly($, 'mark an interrupted command', error),
      ),
    )
  } catch (error) {
    logQuietly($, 'mark an interrupted command', error)
  }
}

/** Whether the drawer holds the call now, read while drawing so a call's start or end draws the row again. */
async function holds($: EngineInterface, id: string | undefined): Promise<boolean> {
  return isHeld(await read($, DRAWER_VIEW), await read($, HELD_CALLS), id)
}

async function copyCall($: EngineInterface, call: HeldCall, surface: RenderSurface) {
  const result = await $.ui.copy({ text: copyText(call), surface })
  $.ui.toast(result.isCopied ? 'Copied the command and its output' : `Copy failed: ${result.reason}`)
}

const press = ($: EngineInterface, change: (view: DrawerView) => DrawerView) => update($, DRAWER_VIEW, change)

/** Opens or closes a card by hand, dropping the ids of calls no longer held. */
async function toggleCard($: EngineInterface, id: string) {
  const calls = await read($, HELD_CALLS)
  await update($, DRAWER_VIEW, view => prunedView(toggleExpanded(view, id), calls))
}

/** The view with the card opened, or closed by hand. */
export function toggleExpanded(view: DrawerView, id: string): DrawerView {
  if (view.expanded.includes(id)) return { ...view, expanded: view.expanded.filter(one => one !== id) }
  return { ...view, expanded: [...view.expanded, id] }
}

/**
 * The tool drawer: the main conversation's shell commands leave the
 * transcript and show in a drawer above the prompt, one card a call,
 * listed for the prompt the arrows are on or for all prompts. A row leaves
 * the transcript only for a call the drawer keeps, and only while it is on;
 * calls from before the plugin loaded keep their rows. `/tool-drawer off`
 * gives every row back.
 *
 * While it draws, the drawer holds the turn arrows around its scope button:
 * in its bottom border when framed, at the end of its bar when not, so the
 * arrows' own row is not drawn. Register it after `registerPromptJump`, with
 * the same trail, so it draws beneath the arrows' hook; `startToolDrawer`
 * runs once the session has started.
 */
export function registerToolDrawer(on: On, trail: PromptTrail) {
  // `/clear` and `/resume` go on in this process with another conversation.
  on('session.end', { reason: ['clear', 'resume'] }, async ($, e, next) => {
    stopTicking()
    callsUnderWay.clear()
    conversation += 1
    try {
      await update($, HELD_CALLS, () => [])
      await update($, DRAWER_VIEW, view => ({ ...NEW_VIEW, isOn: view.isOn }))
    } catch (error) {
      logQuietly($, 'forget the ended conversation', error)
    }
    return next(e)
  })

  on('tool.call', { tool: DRAWER_TOOL }, async ($, e, next) => {
    if (e.tool !== DRAWER_TOOL || e.agentId !== undefined) return next(e)
    return record($, trail, e.tool_use_id, e.command, () => next(e))
  })

  on('command.run', { command: COMMAND_NAME }, async ($, e) => {
    let text = ''
    const view = await update($, DRAWER_VIEW, current => {
      const after = switched(current, e.args)
      text = after.text
      return after.view
    })
    await $.store.set(SWITCH_KEY, view.isOn)
    return { text }
  })

  // Fires only for a call that was allowed and is about to run, never for a refusal.
  on('tool.run', { tool: DRAWER_TOOL }, async ($, e, next) => {
    const underWay = callsUnderWay.get(e.tool_use_id)
    if (underWay !== undefined) underWay.hasRun = true
    return next(e)
  })

  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.tool !== DRAWER_TOOL || !(await holds($, e.props.tool_use_id))) return next(e)
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
    try {
      const measured = otherRowsOf(e.props.rows, $.plugin.name)
      if (measured !== (await read($, OTHER_BAND_ROWS))) $.clock.after(0, () => void update($, OTHER_BAND_ROWS, () => measured).catch(error => logQuietly($, 'keep the band rows', error)))
    } catch (error) {
      logQuietly($, 'measure the band', error)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)
    const view = await read($, DRAWER_VIEW)
    if (!view.isOn) return next(e)

    const held = await read($, HELD_CALLS)
    const turn = listedTurn(held, await readTurnOn($, trail), trail.prompts, trail.at === undefined)
    const shown = callsInScope(held, view.scope, turn)
    if (shown.length === 0) return next(e)

    const now = await read($, DRAWER_CLOCK)
    const beneath = await next(e)
    const isRunning = shown.some(call => call.status === 'running')
    const scope = scopeText(view.scope, turn)
    // Inside the frame, the border and its padding take two cells a side.
    const framedWidth = e.props.bodyColumns - 2 - 2 * FRAME_PADDING
    const layout = view.isOpen ? drawerLayout(shown, view.expanded, drawerRoom(e.props.maxRows, await read($, OTHER_BAND_ROWS)), framedWidth) : { cards: [], earlierCalls: 0 }
    const isFramed = layout.cards.length > 0
    const timeCells = elapsedCells(layout.cards.map(card => card.call), now)
    const width = isFramed ? framedWidth : e.props.bodyColumns
    const bar = barTexts(`${view.isOpen ? '▾' : '▸'} ${summaryText(shown)}`, runningText(shown, now), isFramed ? 0 : arrowsCells(scope) + 1, width, view.isOpen && !isFramed ? NO_ROOM_NOTE : undefined)
    const { Box, Button, Code, Text } = $.ui.resolve(e)
    const arrows = (
      <Box flexDirection="row" columnGap={1} {...(isFramed ? { position: 'absolute' as const, bottom: 0, left: ARROWS_INDENT } : {})}>
        {promptArrows(
          $,
          Button,
          trail,
          <Button
            key="tool-drawer:scope"
            dimColor
            label={scope}
            onPress={() => press($, current => ({ ...current, scope: current.scope === 'all' ? 'turn' : 'all' }))}
          />,
        )}
      </Box>
    )
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
            {bar.note === undefined ? null : <Text dimColor>{bar.note}</Text>}
            {isFramed ? null : arrows}
          </Box>
          {layout.earlierCalls > 0 ? <Text dimColor>{earlierCallsText(layout.earlierCalls, width)}</Text> : null}
          {layout.cards.map(({ call, bodyLines }) => {
            // A card shows open only with its body drawn.
            const body = bodyLines === undefined ? undefined : cardBody(call, width, bodyLines)
            const quiet = { scope: `tool-drawer:row:${call.id}`, color: HOVER_COLOR }
            // An open card's copy button sits on its row, after a gap.
            const parts = cardParts(call, body !== undefined, now, body === undefined ? width : width - cells(COPY_LABEL) - 1, timeCells)
            const label = parts.caret + parts.mark + parts.head + parts.command.map(token => token.text).join('')
            const collapse = () => toggleCard($, call.id)
            return (
              <Box key={`tool-drawer:call:${call.id}`} flexDirection="column">
                <Box flexDirection="row" columnGap={1}>
                  <Button
                    key={`tool-drawer:card:${call.id}`}
                    plain
                    dimColor={call.status === 'done'}
                    label={label}
                    onPress={collapse}
                    hover={quiet}
                  >
                    {parts.caret}
                    <Text {...markStyle(call.status)} hover={quiet}>{parts.mark}</Text>
                    {parts.head}
                    {tokenSpans(Text, parts.command, quiet)}
                  </Button>
                  {body === undefined ? null : (
                    <Button key={`tool-drawer:copy:${call.id}`} plain dimColor label={COPY_LABEL} onPress={press => copyCall($, call, press.surface)} />
                  )}
                </Box>
                {body === undefined ? null : (
                  <Box flexDirection="row" columnGap={1}>
                    <Box flexDirection="column">
                      {Array.from({ length: bodyRows(body) }, (_, index) => (
                        <Button key={`tool-drawer:bar:${call.id}:${index}`} plain label="┃" onPress={collapse} hover={quiet}>
                          <Text color={BAR_COLOR} hover={quiet}>┃</Text>
                        </Button>
                      ))}
                    </Box>
                    <Box flexDirection="column">
                      <Box flexDirection="row">
                        <Text color={ACCENT_COLOR}>{['$ ', ...body.commandRows.slice(1).map(() => '  ')].join('\n')}</Text>
                        <Code source={body.commandRows.join('\n')} language="bash" wrap="truncate-end" />
                      </Box>
                      {body.commandNote === undefined ? null : <Text dimColor>{body.commandNote}</Text>}
                      {body.backgroundNote === undefined ? null : <Text dimColor>{body.backgroundNote}</Text>}
                      {body.earlierNote === undefined ? null : <Text dimColor>{body.earlierNote}</Text>}
                      {outputBlocks(body.lines, outputLanguage(call.command, call.output, call.status === 'error')).map((block, index) =>
                        'lines' in block ? (
                          <Text key={`tool-drawer:output:${call.id}:${index}`} wrap="truncate-end" {...(call.status === 'error' ? { color: ERROR_COLOR } : {})}>
                            {block.lines.join('\n')}
                          </Text>
                        ) : (
                          <Code key={`tool-drawer:output:${call.id}:${index}`} source={block.source} wrap="truncate-end" {...block.language} />
                        ),
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )
          })}
        </Box>
        {/* Placed over the frame's bottom border, the band's last row; it takes no row of its own. */}
        {isFramed ? arrows : null}
      </Box>
    )
  })
}

/** One run of an open card's output, one row a shown line: plain lines, or a source the engine highlights. */
export type OutputBlock = { lines: string[] } | { source: string; language: OutputLanguage }

const HUNK_COUNTS = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/

/**
 * The shown output lines in the runs they draw in, one row a line. A diff
 * draws each hunk header as a plain row, then the hunk's lines as a diff
 * whose header counts the lines shown (the engine draws no row for a hunk
 * header); every other line is plain. Any other language draws all lines.
 */
export function outputBlocks(lines: readonly string[], language: OutputLanguage | undefined): OutputBlock[] {
  if (lines.length === 0) return []
  if (language === undefined) return [{ lines: [...lines] }]
  if (!('format' in language)) return [{ source: lines.join('\n'), language }]
  const blocks: OutputBlock[] = []
  const plain = (line: string) => {
    const last = blocks.at(-1)
    if (last !== undefined && 'lines' in last) last.lines.push(line)
    else blocks.push({ lines: [line] })
  }
  for (let index = 0; index < lines.length; ) {
    const line = lines[index] ?? ''
    const counts = HUNK_COUNTS.exec(line)
    index += 1
    if (counts === null) {
      plain(line)
      continue
    }
    let oldLeft = Number(counts[2] ?? '1')
    let newLeft = Number(counts[4] ?? '1')
    const body: string[] = []
    // `\ No newline at end of file` draws no row in a diff, so it follows the hunk as a plain row.
    const markers: string[] = []
    while (index < lines.length && (oldLeft > 0 || newLeft > 0 || (lines[index] ?? '').startsWith('\\'))) {
      const next = lines[index] ?? ''
      const mark = next[0] ?? ' '
      if (mark === '\\') {
        markers.push(next)
        index += 1
        continue
      }
      if (mark !== ' ' && mark !== '-' && mark !== '+' && next !== '') break
      if (mark !== '+') oldLeft -= 1
      if (mark !== '-') newLeft -= 1
      body.push(next === '' ? ' ' : next)
      index += 1
    }
    plain(line)
    if (body.length > 0) {
      const oldCount = body.filter(one => !one.startsWith('+')).length
      const newCount = body.filter(one => !one.startsWith('-')).length
      const header = `@@ -${counts[1]},${oldCount} +${counts[3]},${newCount} @@${counts[5] ?? ''}`
      blocks.push({ source: [header, ...body].join('\n'), language })
    }
    markers.forEach(plain)
  }
  return blocks
}

/** A command's parts as coloured Text spans, each taking `hover`'s one colour while its row is under the pointer. */
function tokenSpans(Text: ElementConstructor<TextProps>, tokens: readonly ShellToken[], hover: TextHoverProps) {
  return tokens.map(token => {
    const color = SHELL_ROLE_COLOR[token.role]
    if (color !== undefined) return <Text color={color} hover={hover}>{token.text}</Text>
    if (isDimRole(token.role)) return <Text dimColor hover={hover}>{token.text}</Text>
    return token.text
  })
}

/** The most rows of the conversation read back for its past shell commands. */
const RESTORE_READ_ROWS = 4096

/**
 * Takes in the finished shell commands the conversation already holds (a
 * resumed conversation, a plugin reload), grouped under their prompts, so
 * their rows leave the transcript too.
 */
async function restore($: EngineInterface, trail: PromptTrail) {
  await readStoredPrompts($, trail)
  const messages = await $.session.messages({ last: RESTORE_READ_ROWS })
  if ('deny' in messages) return
  const promptIds = new Set(trail.prompts)
  await update($, HELD_CALLS, calls => {
    const past = restoredCalls(messages as readonly PastMessage[], promptIds, new Set(calls.map(call => call.id)))
    return past.length === 0 ? calls : [...past, ...calls].slice(-MAX_HELD_CALLS)
  })
}

/** Adds `/tool-drawer`, turns the drawer on or off as `/tool-drawer` last left it, and takes in the conversation's past shell commands, once the session has started. */
export async function startToolDrawer($: EngineInterface, trail: PromptTrail) {
  // Past commands wait on the transcript file's read, so the session starts without them.
  void restore($, trail).catch(error => {
    // Past commands keep their rows in the conversation.
    $.ui.log(`sc-mods: could not read past shell commands: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  })
  try {
    const isOn = await $.store.get(SWITCH_KEY)
    if (typeof isOn === 'boolean') await update($, DRAWER_VIEW, view => ({ ...view, isOn }))
    await $.command.register({ name: COMMAND_NAME, description: 'Show shell commands in a drawer above the prompt: on, off, or no argument for its state' })
  } catch (error) {
    // The drawer works without its command or its kept switch; it stays as it is.
    $.ui.log(`sc-mods: could not start /${COMMAND_NAME}: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
  }
}
