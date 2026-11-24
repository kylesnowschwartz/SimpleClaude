// A shell command in coloured parts: what each word does on the command line,
// and the theme colour that shows it.

import { cells, headOf } from './drawer-text'

/** What a part of a command line is to the shell. */
export type ShellRole = 'command' | 'operator' | 'flag' | 'string' | 'variable' | 'redirect' | 'comment' | 'path' | 'plain'

/** One part of a command line and what it is. */
export type ShellToken = { text: string; role: ShellRole }

/** The theme colour of each role; a role absent here draws as the line around it. */
export const SHELL_ROLE_COLOR: Partial<Record<ShellRole, string>> = {
  command: 'suggestion',
  operator: 'permission',
  flag: 'warning',
  string: 'success',
  variable: 'merged',
  redirect: 'permission',
  path: 'ide',
}

/** The roles drawn dim rather than coloured. */
export const isDimRole = (role: ShellRole) => role === 'comment'

const ELLIPSIS = '…'
// Operators after which the next word is a command, longest first.
const COMMAND_OPERATORS = ['&&', '||', '$(', '|&', ';', '|', '&', '(', '`']
const REDIRECT = /^(?:\d*>&\d+|&>>?|\d*>>?|\d*<<?<?)/
const VARIABLE = /^\$(?:\{[^}]*\}?|[A-Za-z_][A-Za-z0-9_]*|[0-9@#?$!*-])/
const ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=/
// A word stops at a space, a quote, a variable, or a character the shell treats apart.
const WORD = /^[^\s'"$|&;<>()`]+/

const isPath = (word: string) => word.includes('/') || word.startsWith('~') || /^\.\.?$/.test(word)

/**
 * The command line in parts, left to right, their texts joined giving the
 * line back: the first word and each word after `&&`, `||`, `;`, `|`, `&`,
 * `(` or `$(` is a command, a word after a leading `-` a flag, a word with
 * a `/` or a leading `~` a path, a quoted part a string, `$X` and `${X}`
 * variables, `>`, `2>&1` and the like redirects, and a `#` that starts a
 * word comments out the rest.
 */
export function shellTokens(line: string): ShellToken[] {
  const tokens: ShellToken[] = []
  let rest = line
  let expectsCommand = true
  let atWordStart = true
  const push = (text: string, role: ShellRole) => {
    const last = tokens.at(-1)
    if (last !== undefined && last.role === role && role === 'plain') last.text += text
    else tokens.push({ text, role })
    rest = rest.slice(text.length)
  }

  while (rest !== '') {
    const space = /^\s+/.exec(rest)?.[0]
    if (space !== undefined) {
      push(space, 'plain')
      atWordStart = true
      continue
    }
    if (rest.startsWith('#') && atWordStart) {
      push(rest, 'comment')
      break
    }
    const operator = COMMAND_OPERATORS.find(op => rest.startsWith(op))
    const redirect = REDIRECT.exec(rest)?.[0]
    if (redirect !== undefined && redirect !== '' && (operator === undefined || redirect.length > operator.length)) {
      push(redirect, 'redirect')
      atWordStart = true
      continue
    }
    if (operator !== undefined) {
      push(operator, 'operator')
      expectsCommand = true
      atWordStart = true
      continue
    }
    if (rest.startsWith(')')) {
      push(')', 'operator')
      atWordStart = true
      continue
    }
    const quote = rest[0]
    if (quote === "'" || quote === '"') {
      const end = rest.indexOf(quote, 1)
      push(end === -1 ? rest : rest.slice(0, end + 1), 'string')
      atWordStart = false
      expectsCommand = false
      continue
    }
    const variable = VARIABLE.exec(rest)?.[0]
    if (variable !== undefined) {
      push(variable, 'variable')
      atWordStart = false
      expectsCommand = false
      continue
    }
    const word = WORD.exec(rest)?.[0] ?? rest[0] ?? ''
    if (expectsCommand && atWordStart && ASSIGNMENT.test(word)) {
      const name = ASSIGNMENT.exec(word)?.[0] ?? word
      push(name, 'variable')
      atWordStart = false
      continue
    }
    // An assignment's value leaves the next word the command.
    if (expectsCommand && !atWordStart) {
      push(word, isPath(word) ? 'path' : 'plain')
      continue
    }
    const role: ShellRole = expectsCommand && atWordStart ? 'command' : atWordStart && word.startsWith('-') ? 'flag' : isPath(word) ? 'path' : 'plain'
    push(word, role)
    expectsCommand = false
    atWordStart = false
  }
  return tokens
}

/** The cells the parts take together. */
export const tokenCells = (tokens: readonly ShellToken[]) => tokens.reduce((sum, token) => sum + cells(token.text), 0)

/** The parts cut to `width` cells together, the last cell a plain `…` when cut. */
export function fitTokens(tokens: readonly ShellToken[], width: number): ShellToken[] {
  if (width <= 0) return []
  if (tokenCells(tokens) <= width) return [...tokens]
  const kept: ShellToken[] = []
  let left = width - 1
  for (const token of tokens) {
    const size = cells(token.text)
    if (size <= left) {
      kept.push(token)
      left -= size
      continue
    }
    const part = headOf(token.text, left)
    if (part !== '') kept.push({ text: part, role: token.role })
    break
  }
  kept.push({ text: ELLIPSIS, role: 'plain' })
  return kept
}
