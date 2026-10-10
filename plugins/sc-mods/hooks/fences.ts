/**
 * A mermaid code block in a reply. A block inside a list item or a
 * blockquote carries that container's prefix on each of its lines.
 */
export type MermaidFence = {
  /** Where the block starts and ends in the reply, its fence lines included. */
  start: number
  end: number
  /** The diagram: the lines between the fence lines, without their prefix. */
  source: string
  /** False while the closing fence has not arrived. */
  isClosed: boolean
  /** What the opening line holds before its fence: indentation, `>` and list markers. */
  openingPrefix: string
  /** What each later line of the block starts with. */
  linePrefix: string
}

/** One block's new text, put in place of the block's lines. */
export type FenceReplacement = { fence: MermaidFence; text: string }

/** `isLast` marks the line a streaming reply is still writing. */
type Line = { text: string; start: number; end: number; isLast: boolean }

type FenceRun = { char: string; length: number; info: string }

/** A code block whose closing fence has not been read yet. */
type OpenFence = FenceRun & {
  isMermaid: boolean
  start: number
  end: number
  openingPrefix: string
  linePrefix: string
  bodyLines: string[]
}

const FENCE_CHARS = ['`', '~']
const MIN_FENCE_LENGTH = 3
const DIAGRAM_LANGUAGE = 'mermaid'
const COMMENT_OPEN = '<!--'
const COMMENT_CLOSE = '-->'
const QUOTE_MARKER = '>'

// The pieces a container prefix is made of, read left to right.
const INDENT = /^ +/
const QUOTE = /^> ?/
const LIST_MARKER = /^(?:[-*+]|\d{1,9}[.)]) /
const PREFIX_PIECES = [INDENT, QUOTE, LIST_MARKER]
const LIST_MARKER_ANYWHERE = /[-*+]|\d{1,9}[.)]/g

function splitLines(text: string): Line[] {
  const lines: Line[] = []
  let start = 0
  const lineTexts = text.split('\n')
  for (const [index, lineText] of lineTexts.entries()) {
    lines.push({ text: lineText, start, end: start + lineText.length, isLast: index === lineTexts.length - 1 })
    start += lineText.length + 1
  }
  return lines
}

/** The indentation, quote marker or list marker that `text` starts with. */
function nextPrefixPiece(text: string): string | undefined {
  for (const pattern of PREFIX_PIECES) {
    const match = pattern.exec(text)
    if (match !== null) return match[0]
  }
  return undefined
}

/** Splits a line into its container prefix and what follows it. */
function readPrefix(line: string): { prefix: string; rest: string } {
  let rest = line
  let piece = nextPrefixPiece(rest)
  while (piece !== undefined) {
    rest = rest.slice(piece.length)
    piece = nextPrefixPiece(rest)
  }
  return { prefix: line.slice(0, line.length - rest.length), rest }
}

/** The prefix a block's later lines carry: list markers become spaces, quote markers stay. */
function continuationOf(openingPrefix: string): string {
  return openingPrefix.replace(LIST_MARKER_ANYWHERE, marker => ' '.repeat(marker.length))
}

/**
 * The line without the block's prefix. Undefined when a quote marker is
 * missing, as that ends the blockquote and the block inside it. Markdown
 * lets a later line drop indentation, so missing spaces are allowed.
 */
function stripLinePrefix(line: string, linePrefix: string): string | undefined {
  let at = 0
  for (const expected of linePrefix) {
    if (line[at] === expected) {
      at += 1
    } else if (expected === QUOTE_MARKER) {
      return undefined
    }
  }
  return line.slice(at)
}

function readFenceRun(text: string): FenceRun | undefined {
  const char = text[0] ?? ''
  if (!FENCE_CHARS.includes(char)) return undefined

  let length = 0
  while (text[length] === char) length += 1
  if (length < MIN_FENCE_LENGTH) return undefined

  return { char, length, info: text.slice(length).trim() }
}

/** A backtick fence's info string cannot hold a backtick: that line is inline code. */
function readOpeningFence(text: string): FenceRun | undefined {
  const run = readFenceRun(text)
  if (run === undefined) return undefined
  if (run.char === '`' && run.info.includes('`')) return undefined
  return run
}

function closesFence(text: string, open: OpenFence): boolean {
  const run = readFenceRun(text.trimStart())
  if (run === undefined) return false
  return run.char === open.char && run.length >= open.length && run.info === ''
}

/** Markdown names a code block's language by the first word of its info string. */
function namesMermaid(info: string): boolean {
  const language = info.split(/\s+/)[0] ?? ''
  return language.toLowerCase() === DIAGRAM_LANGUAGE
}

/**
 * Reads a reply line by line, tracking every code block, so a mermaid fence
 * quoted inside another code block, as in a markdown example, is not taken
 * for a diagram. HTML comments are skipped the same way.
 */
class FenceScanner {
  private readonly fences: MermaidFence[] = []
  private open: OpenFence | undefined
  private isInComment = false

  scan(text: string): MermaidFence[] {
    for (const line of splitLines(text)) this.read(line)
    if (this.open !== undefined) this.finish(this.open, false)
    return this.fences
  }

  private read(line: Line): void {
    if (this.open !== undefined) {
      this.readInsideFence(this.open, line)
    } else if (this.isInComment) {
      this.readInsideComment(line)
    } else {
      this.readOutside(line)
    }
  }

  private readInsideFence(open: OpenFence, line: Line): void {
    const body = stripLinePrefix(line.text, open.linePrefix)
    if (body === undefined) {
      this.readPastQuote(open, line)
      return
    }

    open.end = line.end
    if (closesFence(body, open)) {
      this.finish(open, true)
      return
    }
    open.bodyLines.push(body)
  }

  /** A line without the block's quote marker ends the quote, and the block inside it. */
  private readPastQuote(open: OpenFence, line: Line): void {
    // A blank last line is a line still arriving, which says nothing yet
    // about whether the blockquote goes on.
    if (line.isLast && line.text.trim() === '') return

    this.finish(open, true)
    this.read(line)
  }

  private readInsideComment(line: Line): void {
    if (line.text.includes(COMMENT_CLOSE)) this.isInComment = false
  }

  private readOutside(line: Line): void {
    const { prefix, rest } = readPrefix(line.text)
    if (rest.startsWith(COMMENT_OPEN)) {
      this.isInComment = !rest.includes(COMMENT_CLOSE, COMMENT_OPEN.length)
      return
    }

    const run = readOpeningFence(rest)
    if (run === undefined) return
    this.open = {
      ...run,
      isMermaid: namesMermaid(run.info),
      start: line.start,
      end: line.end,
      openingPrefix: prefix,
      linePrefix: continuationOf(prefix),
      bodyLines: [],
    }
  }

  private finish(open: OpenFence, isClosed: boolean): void {
    this.open = undefined
    if (!open.isMermaid) return

    this.fences.push({
      start: open.start,
      end: open.end,
      source: open.bodyLines.join('\n'),
      isClosed,
      openingPrefix: open.openingPrefix,
      linePrefix: open.linePrefix,
    })
  }
}

/**
 * Every mermaid code block in a reply, in order, including one whose closing
 * fence has not arrived. The fence is three or more backticks or tildes, and
 * a block closes on the same character repeated at least as many times.
 */
export function findMermaidFences(text: string): MermaidFence[] {
  return new FenceScanner().scan(text)
}

/** Puts a block's prefix back on each line of its replacement, so it stays inside its list item or blockquote. */
function withPrefix(fence: MermaidFence, text: string): string {
  return text
    .split('\n')
    .map((line, index) => (index === 0 ? fence.openingPrefix : fence.linePrefix) + line)
    .join('\n')
}

/** The reply with each replaced block's lines swapped for its new text. */
export function replaceFences(text: string, replacements: readonly FenceReplacement[]): string {
  let rewritten = ''
  let copiedUpTo = 0
  for (const { fence, text: replacement } of replacements) {
    rewritten += text.slice(copiedUpTo, fence.start) + withPrefix(fence, replacement)
    copiedUpTo = fence.end
  }
  return rewritten + text.slice(copiedUpTo)
}
