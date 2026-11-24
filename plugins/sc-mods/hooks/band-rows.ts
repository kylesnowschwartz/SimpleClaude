// How many terminal rows a drawn tree takes, read from the tree alone.

/** A drawn element as a hook sees it: a type, its props, and its children. */
type Drawn = { type?: unknown; props?: Record<string, unknown> | null; children?: unknown }

const asNumber = (value: unknown): number => (typeof value === 'number' && value > 0 ? value : 0)

/** The rows a Box's padding, margin and border add above and below what it holds. */
function boxEdges(props: Record<string, unknown>): number {
  const side = (all: string, axis: string, top: string, bottom: string) =>
    asNumber(props[top] ?? props[axis] ?? props[all]) + asNumber(props[bottom] ?? props[axis] ?? props[all])
  const border = typeof props.borderStyle === 'string' ? 2 : 0
  return border + side('padding', 'paddingY', 'paddingTop', 'paddingBottom') + side('margin', 'marginY', 'marginTop', 'marginBottom')
}

const childrenOf = (element: Drawn): unknown[] => (Array.isArray(element.children) ? element.children.flat(Infinity) : element.children === undefined ? [] : [element.children])

/** The lines a Text's string children hold. */
function textLines(element: Drawn): number {
  const text = childrenOf(element)
    .map(child => (typeof child === 'string' || typeof child === 'number' ? String(child) : ''))
    .join('')
  return Math.max(1, text.split('\n').length)
}

/**
 * The rows a Code drawn with `wrap: 'truncate-end'` takes: one a source line,
 * less, under `format: 'diff'`, the hunk headers, which draw no row.
 */
function codeRows(props: Record<string, unknown>): number {
  if (typeof props.source !== 'string') return 1
  const lines = props.source.split('\n')
  return props.format === 'diff' ? lines.filter(line => !line.startsWith('@@ ')).length : lines.length
}

/**
 * The rows a drawn tree takes: a column Box sums its children and the gaps
 * between them, a row Box (the default direction) takes the tallest, each
 * plus its padding, margin and border; a fixed height wins; a Text counts its
 * lines; a Code counts its drawn lines; a hidden Box takes none; anything else counts as one row.
 */
export function rowsOf(tree: unknown): number {
  if (tree === null || tree === undefined || tree === false) return 0
  if (typeof tree === 'string' || typeof tree === 'number') return 1
  if (Array.isArray(tree)) return tree.reduce((sum: number, child) => sum + rowsOf(child), 0)
  if (typeof tree !== 'object') return 1

  const element = tree as Drawn
  const props = element.props ?? {}
  if (element.type === 'Text') return textLines(element)
  if (element.type === 'Code') return codeRows(props)
  if (element.type !== 'Box') return 1
  if (props.display === 'none') return 0

  const sizes = childrenOf(element).map(rowsOf)
  const direction = typeof props.flexDirection === 'string' ? props.flexDirection : 'row'
  const gap = asNumber(props.rowGap ?? props.gap) * Math.max(0, sizes.filter(size => size > 0).length - 1)
  const inner = direction.startsWith('column') ? sizes.reduce((sum, size) => sum + size, 0) + gap : Math.max(0, ...sizes)
  const fixed = asNumber(props.height)
  return (fixed > 0 ? fixed : inner + boxEdges(props))
}
