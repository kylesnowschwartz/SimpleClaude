const NARROW_CELLS = 1
const WIDE_CELLS = 2
const ZERO_WIDTH_JOINER = '\u200D'

// Hangul Jamo, CJK radicals through Yi, Hangul syllables, CJK compatibility
// ideographs, CJK compatibility forms, fullwidth forms and signs, and the
// supplementary ideograph planes: the East Asian Wide and Fullwidth ranges.
const EAST_ASIAN_WIDE =
  /[\u1100-\u115F\u2E80-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFE30-\uFE4F\uFF00-\uFF60\uFFE0-\uFFE6\u{20000}-\u{3FFFD}]/u
const EMOJI = /\p{Emoji_Presentation}/u
// Combining marks, format characters and skin-tone modifiers draw on the
// character before them.
const ZERO_WIDTH = /[\p{M}\p{Cf}\p{Emoji_Modifier}]/u

function cellsOf(character: string): number {
  if (ZERO_WIDTH.test(character)) return 0
  if (EAST_ASIAN_WIDE.test(character) || EMOJI.test(character)) return WIDE_CELLS
  return NARROW_CELLS
}

/**
 * The terminal cells `text` takes: East Asian wide characters and emoji take
 * two, marks take none, and a character joined on by a zero-width joiner
 * draws inside the emoji before it.
 */
export function displayWidth(text: string): number {
  let cells = 0
  let previous = ''
  for (const character of text) {
    if (previous !== ZERO_WIDTH_JOINER) cells += cellsOf(character)
    previous = character
  }
  return cells
}
