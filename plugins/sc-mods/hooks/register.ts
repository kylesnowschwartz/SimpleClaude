import type { EngineInterface, Register } from 'claude-code'
import { findMermaidFences, replaceFences, type FenceReplacement, type MermaidFence } from './fences'
import { drawDiagram, type Runner } from './merman'
import { registerPromptJump } from './prompt-jump'

// The reply's indent plus a margin column on each side.
const GUTTER = 4
const WIDTH_WITHOUT_VIEWPORT = 100
const RUN_TIMEOUT_MS = 5000
// A new binary's first launch can wait on the OS scanning it.
const CHECK_TIMEOUT_MS = 15000
const NOTICE_TIMEOUT_MS = 15000

// A dev checkout loads the plugin from the repository's plugins/ folder;
// an install loads it from Claude Code's plugin cache.
const DEV_CHECKOUT_ROOT = /\/plugins\/sc-mods\/?$/

// How Claude Code words a $.process.run rejection for a command that
// outlived its timeoutMs; any other rejection is a failure to run.
const TIMED_OUT = /still running after/

// Enough for every diagram of a long session, each at a few widths.
const MAX_DRAWINGS = 200

/**
 * Each diagram's drawing, finished or under way, keyed by width and source;
 * undefined keeps the source. A draw that rejects is removed so a later
 * render tries it again. Past MAX_DRAWINGS the least recently used goes.
 */
const drawings = new Map<string, Promise<string | undefined>>()

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

/** A cached drawing, moved to the newest end so it is the last to go. */
function recall(key: string): Promise<string | undefined> | undefined {
  const drawing = drawings.get(key)
  if (drawing === undefined) return undefined

  drawings.delete(key)
  drawings.set(key, drawing)
  return drawing
}

function remember(key: string, drawing: Promise<string | undefined>) {
  drawings.set(key, drawing)
  if (drawings.size <= MAX_DRAWINGS) return

  // A Map iterates in insertion order, so its first key is the least recently used.
  const [leastRecentKey] = drawings.keys()
  if (leastRecentKey !== undefined) drawings.delete(leastRecentKey)
}

function startDrawing(run: Runner, source: string, width: number, key: string): Promise<string | undefined> {
  const attempt = drawDiagram(run, source, width)
  attempt.catch(() => {
    if (drawings.get(key) === attempt) drawings.delete(key)
  })
  remember(key, attempt)
  return attempt
}

function drawingFor(run: Runner, source: string, width: number): Promise<string | undefined> {
  const key = `${width}\0${source}`
  const drawing = recall(key) ?? startDrawing(run, source, width, key)
  return drawing.catch(() => undefined)
}

type DrawConditions = { run: Runner; replyColumns: number }

// A list or quote prefix is ASCII, one cell a character.
const widthFor = (fence: MermaidFence, replyColumns: number) => replyColumns - fence.linePrefix.length

/**
 * A text block of the fence's drawing. Undefined keeps the source: the
 * fence has not closed, or merman refused it.
 */
async function replacementText(fence: MermaidFence, { run, replyColumns }: DrawConditions): Promise<string | undefined> {
  if (!fence.isClosed) return undefined

  const drawing = await drawingFor(run, fence.source, widthFor(fence, replyColumns))
  return drawing === undefined ? undefined : textBlock(drawing)
}

type PossibleReplacement = { fence: MermaidFence; text: string | undefined }

const replacesSource = (candidate: PossibleReplacement): candidate is FenceReplacement => candidate.text !== undefined

async function replacementsFor(fences: MermaidFence[], conditions: DrawConditions): Promise<FenceReplacement[]> {
  const candidates = await Promise.all(
    fences.map(async fence => ({ fence, text: await replacementText(fence, conditions) })),
  )
  return candidates.filter(replacesSource)
}

export const register: Register = (on, options) => {
  registerPromptJump(on)

  const configuredPath = typeof options.MERMAN_PATH === 'string' ? options.MERMAN_PATH.trim() : ''

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const fences = findMermaidFences(e.props.text)
    if (fences.length === 0) return next(e)

    const bin = configuredPath || `${$.plugin.root}/bin/merman-cli`
    const pendingCheck = (mermanCheck ??= checkMerman($, bin))
    const check = await pendingCheck
    if (check === 'timed-out' && mermanCheck === pendingCheck) mermanCheck = undefined
    if (check !== 'runnable') return next(e)

    const replyColumns = e.viewport ? e.viewport.columns - GUTTER : WIDTH_WITHOUT_VIEWPORT
    const run: Runner = (args, stdin) => $.process.run([bin, ...args], { stdin, timeoutMs: RUN_TIMEOUT_MS })
    const replacements = await replacementsFor(fences, { run, replyColumns })
    if (replacements.length === 0) return next(e)

    const text = replaceFences(e.props.text, replacements)
    return next({ ...e, props: { ...e.props, text } })
  })
}
