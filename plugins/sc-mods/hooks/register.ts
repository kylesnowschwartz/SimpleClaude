import type { EngineInterface, Register } from 'claude-code'
import { drawDiagram, type Runner } from './merman'

// Only closed fences match, so a fence still streaming in is left as source.
const CLOSED_FENCE = /^```mermaid[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm

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

/**
 * Each diagram's drawing, keyed by width and source; undefined keeps the
 * source. Only settled outcomes stay: a draw that rejected is dropped so a
 * later render tries it again.
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

function drawingFor(run: Runner, source: string, width: number): Promise<string | undefined> {
  const key = `${width}\0${source}`
  let drawing = drawings.get(key)
  if (drawing === undefined) {
    const attempt = drawDiagram(run, source, width)
    attempt.catch(() => {
      if (drawings.get(key) === attempt) drawings.delete(key)
    })
    drawings.set(key, attempt)
    drawing = attempt
  }
  return drawing.catch(() => undefined)
}

export const register: Register = (on, options) => {
  const configuredPath = typeof options.MERMAN_PATH === 'string' ? options.MERMAN_PATH.trim() : ''

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text
    const sources = [...text.matchAll(CLOSED_FENCE)].map(match => match[1] ?? '')
    if (sources.length === 0) return next(e)

    const bin = configuredPath || `${$.plugin.root}/bin/merman-cli`
    const pendingCheck = (mermanCheck ??= checkMerman($, bin))
    const check = await pendingCheck
    if (check === 'timed-out' && mermanCheck === pendingCheck) mermanCheck = undefined
    if (check !== 'runnable') return next(e)

    const width = e.viewport ? e.viewport.columns - GUTTER : WIDTH_WITHOUT_VIEWPORT
    const run: Runner = (args, stdin) => $.process.run([bin, ...args], { stdin, timeoutMs: RUN_TIMEOUT_MS })
    const pending = sources.map(source => drawingFor(run, source, width))
    const drawn = new Map<string, string | undefined>()
    for (const [index, source] of sources.entries()) drawn.set(source, await pending[index])

    const rewritten = text.replace(CLOSED_FENCE, (fence, source: string) => {
      const drawing = drawn.get(source)
      return drawing === undefined ? fence : textBlock(drawing)
    })
    return next({ ...e, props: { ...e.props, text: rewritten } })
  })
}
