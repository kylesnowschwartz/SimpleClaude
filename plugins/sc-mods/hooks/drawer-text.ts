// Text as a terminal draws it: what stays on screen of a line, and how many
// cells each character takes.

const ELLIPSIS = '…'
const TAB_STOP = 8

// CSI (`ESC [ … final`), OSC (`ESC ] … BEL` or `ESC ] … ESC \`), and any
// other two-character escape.
const ESCAPE_SEQUENCE = /\u001b\[[0-?]*[ -/]*[@-~]|\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]/g
// C0 and C1 controls, format characters (zero-width joiners, direction marks), line and paragraph separators.
const INVISIBLE = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu
const ZERO_WIDTH = /[\p{Mn}\p{Me}]/u
const PICTOGRAPH = /\p{Extended_Pictographic}/u

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

/** The cells one character takes: 0 for a combining mark, 2 for a wide one or an emoji, else 1. */
export function charCells(char: string): number {
  if (ZERO_WIDTH.test(char)) return 0
  const codePoint = char.codePointAt(0) ?? 0
  if (isWide(codePoint)) return 2
  // A pictograph below the emoji blocks (☀, ✔) draws narrow unless a variation selector asks otherwise.
  return PICTOGRAPH.test(char) && codePoint >= 0x1f000 ? 2 : 1
}

/** The cells the text takes in a terminal. */
export function cells(text: string): number {
  let total = 0
  for (const char of text) total += charCells(char)
  return total
}

/** The text cut to `width` cells, its last cell `…` when cut. */
export function fit(text: string, width: number): string {
  if (width <= 0) return ''
  if (cells(text) <= width) return text
  let kept = ''
  let used = 0
  for (const char of text) {
    const size = charCells(char)
    if (used + size > width - 1) break
    kept += char
    used += size
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
 * return rewrote (a progress bar), the last segment it wrote; tabs expanded;
 * control and invisible characters out.
 */
export function cleanLine(line: string): string {
  const plain = line.replace(ESCAPE_SEQUENCE, '')
  const segments = plain.split('\r').filter(segment => segment !== '')
  const shown = segments.at(-1) ?? ''
  return expandTabs(shown).replace(INVISIBLE, '')
}

/** Each line of the text cleaned, as `cleanLine` does; the line breaks kept. */
export const cleanText = (text: string): string => text.split('\n').map(cleanLine).join('\n')
