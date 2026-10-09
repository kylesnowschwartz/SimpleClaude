export type RunResult = { exitCode: number; stdout: string; stderr: string }

/** Runs merman-cli with these arguments and the diagram source on stdin. */
export type Runner = (args: string[], stdin: string) => Promise<RunResult>

const RENDER = ['render', '-q', '-f', 'unicode', '--ascii-trim-trailing-spaces']
const COMPACT = ['--ascii-layout-profile', 'compact']
const AUTO = ['--ascii-layout-profile', 'auto']
const MIRROR_ACTORS = ['--sequence-mirror-actors']
const OVERFLOW = /exceeds requested width/
const HORIZONTAL_HEADER = /^(\s*(?:flowchart|graph)\s+)(LR|RL)\b/m

type Attempt = { source: string; flags: string[] }

const diagramType = (source: string) => source.trim().split(/\s/)[0] ?? ''

const wrapLabels = (columns: number) => [...COMPACT, '--ascii-flowchart-node-label-wrap-width', String(columns)]

function flowchartAttempts(source: string): Attempt[] {
  // The auto profile draws the canonical layout and switches to compact only
  // when canonical is too wide, because compact merges the borders of
  // side-by-side subgraphs. The label-wrap steps run only once a diagram is
  // already too wide, so they stay compact.
  const layouts = [AUTO, wrapLabels(12), wrapLabels(6)]
  const sources = [source]
  if (HORIZONTAL_HEADER.test(source)) sources.push(source.replace(HORIZONTAL_HEADER, '$1TD'))
  return sources.flatMap(s => layouts.map(flags => ({ source: s, flags })))
}

/** The layouts to try for one diagram, in the order tried. */
function attemptsFor(source: string): Attempt[] {
  switch (diagramType(source)) {
    case 'flowchart':
    case 'graph':
      return flowchartAttempts(source)
    case 'sequenceDiagram':
      return [
        { source, flags: MIRROR_ACTORS },
        { source, flags: [...MIRROR_ACTORS, '--ascii-layout-profile', 'auto'] },
      ]
    default:
      // merman rejects the compact and auto layout profiles for state diagrams.
      return [{ source, flags: [] }]
  }
}

const trimEnd = (text: string) => text.replace(/[ \t]+$/gm, '').replace(/\n+$/, '')

/**
 * Draws one mermaid diagram as Unicode text no wider than `width` columns,
 * trying each layout in turn until one fits. Undefined when none fits or
 * merman refuses the source.
 */
export async function drawDiagram(run: Runner, source: string, width: number): Promise<string | undefined> {
  const bound = ['--ascii-max-width', String(width), '--ascii-overflow', 'error', '-o', '-', '-']
  for (const { source: attemptSource, flags } of attemptsFor(source)) {
    const result = await run([...RENDER, ...flags, ...bound], attemptSource)
    if (result.exitCode === 0) return trimEnd(result.stdout)
    if (!OVERFLOW.test(result.stderr)) return undefined
  }
  return undefined
}
