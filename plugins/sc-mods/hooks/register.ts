import type { EngineInterface, Register } from 'claude-code'
import { drawDiagram, type Runner } from './merman'

// Only closed fences match, so a fence still streaming in is left as source.
const CLOSED_FENCE = /^```mermaid[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm

// The reply's indent plus a margin column on each side.
const GUTTER = 4
const WIDTH_WITHOUT_VIEWPORT = 100
const RUN_TIMEOUT_MS = 5000
const NOTICE_TIMEOUT_MS = 15000

// A dev checkout loads the plugin from the repository's plugins/ folder;
// an install loads it from Claude Code's plugin cache.
const DEV_CHECKOUT_ROOT = /\/plugins\/sc-mods\/?$/

/** Each diagram's drawing, keyed by width and source; undefined keeps the source. */
const drawings = new Map<string, Promise<string | undefined>>()

let isMermanRunnable: Promise<boolean> | undefined

const textBlock = (drawing: string) => '```text\n' + drawing + '\n```'

function missingMermanNotice(pluginRoot: string): string {
  const remedy = DEV_CHECKOUT_ROOT.test(pluginRoot)
    ? 'run scripts/fetch-merman.sh in the SimpleClaude checkout'
    : 'reinstall the sc-mods plugin, or set MERMAN_PATH to a merman-cli'
  return `sc-mods: merman-cli could not run, so mermaid diagrams stay as source. To fix it, ${remedy}.`
}

async function checkMerman($: EngineInterface, bin: string): Promise<boolean> {
  try {
    const { exitCode } = await $.process.run([bin, '--version'], { timeoutMs: RUN_TIMEOUT_MS })
    if (exitCode === 0) return true
  } catch {
    // The launcher or binary could not start; the notice below covers it.
  }
  $.ui.toast(missingMermanNotice($.plugin.root), { timeoutMs: NOTICE_TIMEOUT_MS })
  return false
}

export const register: Register = (on, options) => {
  const configuredPath = typeof options.MERMAN_PATH === 'string' ? options.MERMAN_PATH.trim() : ''

  on('ui.render', { component: 'AssistantMessage' }, async ($, e, next) => {
    const text = e.props.text
    const sources = [...text.matchAll(CLOSED_FENCE)].map(match => match[1] ?? '')
    if (sources.length === 0) return next(e)

    const bin = configuredPath || `${$.plugin.root}/bin/merman-cli`
    isMermanRunnable ??= checkMerman($, bin)
    if (!(await isMermanRunnable)) return next(e)

    const width = e.viewport ? e.viewport.columns - GUTTER : WIDTH_WITHOUT_VIEWPORT
    const run: Runner = (args, stdin) => $.process.run([bin, ...args], { stdin, timeoutMs: RUN_TIMEOUT_MS })
    const keyOf = (source: string) => `${width}\0${source}`

    for (const source of sources) {
      const key = keyOf(source)
      if (!drawings.has(key)) drawings.set(key, drawDiagram(run, source, width).catch(() => undefined))
    }
    const drawn = new Map<string, string | undefined>()
    for (const source of sources) drawn.set(source, await drawings.get(keyOf(source)))

    const rewritten = text.replace(CLOSED_FENCE, (fence, source: string) => {
      const drawing = drawn.get(source)
      return drawing === undefined ? fence : textBlock(drawing)
    })
    return next({ ...e, props: { ...e.props, text: rewritten } })
  })
}
