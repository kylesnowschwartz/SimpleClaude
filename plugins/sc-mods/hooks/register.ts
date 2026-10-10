import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'
import { displayWidth } from './display-width'
import { findMermaidFences, replaceFences, type FenceReplacement, type MermaidFence } from './fences'
import { drawDiagram, type Runner } from './merman'
import { noteMessageDrawn, noteTurnEnded, noteTurnStarted, turnThatWrote } from './turns'

// The reply's indent plus a margin column on each side.
const GUTTER = 4
const WIDTH_WITHOUT_VIEWPORT = 100
const RUN_TIMEOUT_MS = 5000
// A new binary's first launch can wait on the OS scanning it.
const CHECK_TIMEOUT_MS = 15000
const NOTICE_TIMEOUT_MS = 15000

const DRAWING_PLACEHOLDER = '*Drawing Mermaid diagram…*'

// A dev checkout loads the plugin from the repository's plugins/ folder;
// an install loads it from Claude Code's plugin cache.
const DEV_CHECKOUT_ROOT = /\/plugins\/sc-mods\/?$/

// How Claude Code words a $.process.run rejection for a command that
// outlived its timeoutMs; any other rejection is a failure to run.
const TIMED_OUT = /still running after/

// Enough for every diagram of a long session, each at a few widths.
const MAX_DRAWINGS = 200

/**
 * Each diagram's drawing, keyed by width and source; undefined keeps the
 * source. Only settled outcomes stay: a draw that rejected is dropped so a
 * later render tries it again. Past MAX_DRAWINGS the oldest is dropped.
 */
const drawings = new Map<string, Promise<string | undefined>>()

/**
 * The ids of the main-loop turns that have started and not yet completed,
 * kept in the session's state so a drawing that read it is drawn again when
 * a turn ends. Only a reply a running turn is writing reads it.
 */
const runningTurns = atom({ plugin: 'sc-mods', key: 'runningTurns' } as const, [])

/** Whether merman-cli runs; `timed-out` is not an answer and is asked again. */
type MermanCheck = 'runnable' | 'missing' | 'timed-out'

let mermanCheck: Promise<MermanCheck> | undefined

const textBlock = (drawing: string) => '```text\n' + drawing + '\n```'

function missingMermanNotice(pluginRoot: string): string {
  const remedy = DEV_CHECKOUT_ROOT.test(pluginRoot)
    ? 'run scripts/fetch-merman.sh in the SimpleClaude checkout'
    : 'reinstall the sc-mods plugin, or set MERMAN_PATH to a merman-cli'
  return `sc-mods: merman-cli could not run, so mermaid diagrams stay as source. To fix it, ${remedy}.`
}

async function checkMerman($: EngineInterface, bin: string): Promise<MermanCheck> {
  try {
    const { exitCode } = await $.process.run([bin, '--version'], { timeoutMs: CHECK_TIMEOUT_MS })
    if (exitCode === 0) return 'runnable'
  } catch (error) {
    if (error instanceof Error && TIMED_OUT.test(error.message)) return 'timed-out'
  }
  $.ui.toast(missingMermanNotice($.plugin.root), { timeoutMs: NOTICE_TIMEOUT_MS })
  return 'missing'
}

function remember(key: string, drawing: Promise<string | undefined>) {
  drawings.set(key, drawing)
  if (drawings.size <= MAX_DRAWINGS) return

  // A Map iterates in insertion order, so its first key is the oldest.
  const [oldestKey] = drawings.keys()
  if (oldestKey !== undefined) drawings.delete(oldestKey)
}

function drawingFor(run: Runner, source: string, width: number): Promise<string | undefined> {
  const key = `${width}\0${source}`
  let drawing = drawings.get(key)
  if (drawing === undefined) {
    const attempt = drawDiagram(run, source, width)
    attempt.catch(() => {
      if (drawings.get(key) === attempt) drawings.delete(key)
    })
    remember(key, attempt)
    drawing = attempt
  }
  return drawing.catch(() => undefined)
}

/** `columns` is the reply's width; a fence in a list or quote has less. */
type Replacing = { run: Runner; columns: number; isTurnRunning: boolean }

const widthFor = (fence: MermaidFence, columns: number) => columns - displayWidth(fence.linePrefix)

/**
 * What a fence shows in place of its source: its drawing once closed, a
 * placeholder while it streams in. Undefined keeps the source: merman
 * refused it, or it never closed and no turn is still writing it.
 */
async function replacementText(fence: MermaidFence, { run, columns, isTurnRunning }: Replacing): Promise<string | undefined> {
  if (!fence.isClosed) return isTurnRunning ? DRAWING_PLACEHOLDER : undefined

  const drawing = await drawingFor(run, fence.source, widthFor(fence, columns))
  return drawing === undefined ? undefined : textBlock(drawing)
}

async function replacementsFor(fences: MermaidFence[], replacing: Replacing): Promise<FenceReplacement[]> {
  const texts = await Promise.all(fences.map(fence => replacementText(fence, replacing)))
  return fences.flatMap((fence, index) => {
    const text = texts[index]
    return text === undefined ? [] : [{ fence, text }]
  })
}

/** Whether the turn running when this message was first drawn still runs. */
async function isTurnWriting($: EngineInterface, messageId: string): Promise<boolean> {
  const turnId = turnThatWrote(messageId)
  if (turnId === undefined) return false

  const turns = await read($, runningTurns)
  return turns.includes(turnId)
}

export const register: Register = (on, options) => {
  const configuredPath = typeof options.MERMAN_PATH === 'string' ? options.MERMAN_PATH.trim() : ''

  on('turn.start', async ($, e, next) => {
    noteTurnStarted(e.turnId)
    await update($, runningTurns, turns => [...turns, e.turnId])
    return next(e)
  })

  // Every main-loop turn ends in turn.complete, an interrupted one with reason
  // 'aborted'. A subagent's run raises no turn.start, so its completion matches
  // no turn. A turn already running when the mod loads raised its turn.start
  // before this hook existed, so its reply counts as written by no turn.
  on('turn.complete', async ($, e, next) => {
    noteTurnEnded(e.turnId)
    await update($, runningTurns, turns => turns.filter(turnId => turnId !== e.turnId))
    return next(e)
  })

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    noteMessageDrawn(e.requestId)
    const fences = findMermaidFences(e.props.text)
    if (fences.length === 0) return next(e)

    const bin = configuredPath || `${$.plugin.root}/bin/merman-cli`
    const pendingCheck = (mermanCheck ??= checkMerman($, bin))
    const check = await pendingCheck
    if (check === 'timed-out' && mermanCheck === pendingCheck) mermanCheck = undefined
    if (check !== 'runnable') return next(e)

    const columns = e.viewport ? e.viewport.columns - GUTTER : WIDTH_WITHOUT_VIEWPORT
    const run: Runner = (args, stdin) => $.process.run([bin, ...args], { stdin, timeoutMs: RUN_TIMEOUT_MS })
    const hasUnclosedFence = fences.some(fence => !fence.isClosed)
    const isTurnRunning = hasUnclosedFence && (await isTurnWriting($, e.requestId))
    const replacements = await replacementsFor(fences, { run, columns, isTurnRunning })
    if (replacements.length === 0) return next(e)

    const text = replaceFences(e.props.text, replacements)
    return next({ ...e, props: { ...e.props, text } })
  })
}
