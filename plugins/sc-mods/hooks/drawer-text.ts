// Text as a terminal draws it: what stays on screen of a line, and how many
// cells each character takes.

const ELLIPSIS = '…'
const TAB_STOP = 8

// CSI (`ESC [ … final`, or the 8-bit `U+009B … final`), OSC (`ESC ] … BEL` or `ESC ] … ESC \`), and any
// other two-character escape.
const ESCAPE_SEQUENCE = /\u001b\[[0-?]*[ -/]*[@-~]|\u009b[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g
// C0 and C1 controls but the tab, format characters (zero-width joiners, direction marks), line and paragraph separators.
const INVISIBLE = /(?!\t)[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu
const ZERO_WIDTH = /[\p{Mn}\p{Me}]/u
const EMOJI_PRESENTATION = /\p{Emoji_Presentation}/u
const EMOJI_STYLE = '\ufe0f'

/** Whether a code point takes two cells: East Asian wide and full-width forms, and emoji. */
function isWide(codePoint: number): boolean {
  return (
    (codePoint >= 0x1100 && codePoint <= 0x115f) ||
    (codePoint >= 0x2e80 && codePoint <= 0x303e) ||
    (codePoint >= 0x3041 && codePoint <= 0x33ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xa000 && codePoint <= 0xa4cf) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7a3) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0xfe30 && codePoint <= 0xfe4f) ||
    (codePoint >= 0xff00 && codePoint <= 0xff60) ||
    (codePoint >= 0xffe0 && codePoint <= 0xffe6) ||
    (codePoint >= 0x1f300 && codePoint <= 0x1faff) ||
    (codePoint >= 0x20000 && codePoint <= 0x3fffd)
  )
}

/** The cells one character takes alone: 0 for a combining mark, 2 for a wide one or an emoji, else 1. */
export function charCells(char: string): number {
  if (ZERO_WIDTH.test(char)) return 0
  if (isWide(char.codePointAt(0) ?? 0) || EMOJI_PRESENTATION.test(char)) return 2
  return 1
}

/**
 * The text in the pieces a terminal draws, each with its cells: a character
 * with the marks after it; one followed by the emoji selector U+FE0F draws
 * as an emoji, two cells.
 */
function pieces(text: string): Array<{ text: string; cells: number }> {
  const out: Array<{ text: string; cells: number }> = []
  for (const char of text) {
    const last = out.at(-1)
    if (last !== undefined && ZERO_WIDTH.test(char)) {
      last.text += char
      if (char === EMOJI_STYLE) last.cells = 2
      continue
    }
    out.push({ text: char, cells: charCells(char) })
  }
  return out
}

/** The cells the text takes in a terminal. */
export function cells(text: string): number {
  return pieces(text).reduce((sum, piece) => sum + piece.cells, 0)
}

/** The text cut to `width` cells, its last cell `…` when cut. */
export function fit(text: string, width: number): string {
  if (width <= 0) return ''
  if (cells(text) <= width) return text
  let kept = ''
  let used = 0
  for (const piece of pieces(text)) {
    if (used + piece.cells > width - 1) break
    kept += piece.text
    used += piece.cells
  }
  return kept + ELLIPSIS
}

/** Tabs out to the next stop of eight cells. */
function expandTabs(line: string): string {
  if (!line.includes('\t')) return line
  let out = ''
  let column = 0
  for (const char of line) {
    if (char === '\t') {
      const pad = TAB_STOP - (column % TAB_STOP)
      out += ' '.repeat(pad)
      column += pad
    } else {
      out += char
      column += charCells(char)
    }
  }
  return out
}

/**
 * One line as it stays on screen: escape sequences out; of a line a carriage
 * return rewrote (a progress bar), the last segment it wrote; control and
 * invisible characters out; then tabs expanded.
 */
export function cleanLine(line: string): string {
  const plain = line.replace(ESCAPE_SEQUENCE, '')
  const segments = plain.split('\r').filter(segment => segment !== '')
  const shown = segments.at(-1) ?? ''
  return expandTabs(shown.replace(INVISIBLE, ''))
}

/** Each line of the text cleaned, as `cleanLine` does; the line breaks kept. */
export const cleanText = (text: string): string => text.split('\n').map(cleanLine).join('\n')
