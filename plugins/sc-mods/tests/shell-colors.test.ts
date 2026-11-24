import { expect, test } from 'claude-code/testing'
import { cells } from '../hooks/drawer-text'
import { fitTokens, shellTokens, tokenCells } from '../hooks/shell-colors'

const roles = (line: string) => shellTokens(line).filter(token => token.text.trim() !== '').map(token => [token.text.trim(), token.role])

test('shellTokens gives the line back in parts', () => {
  const line = `FOO=1 git -C /tmp log --oneline "a b" $HOME \${X} 2>&1 | wc -l; echo 'hi' > out.txt # note`
  expect(shellTokens(line).map(token => token.text).join('')).toBe(line)
})

test('shellTokens names commands, operators, flags, strings, variables, redirects, paths and comments', () => {
  expect(roles('ls /nonexistent | wc -l')).toEqual([['ls', 'command'], ['/nonexistent', 'path'], ['|', 'operator'], ['wc', 'command'], ['-l', 'flag']])
  expect(roles('cd ~/x && npm test || echo "failed $?"')).toEqual([
    ['cd', 'command'], ['~/x', 'path'], ['&&', 'operator'], ['npm', 'command'], ['test', 'plain'], ['||', 'operator'], ['echo', 'command'], ['"failed $?"', 'string'],
  ])
  expect(roles('echo $(date) ${HOME} 2>&1 >> log # done')).toEqual([
    ['echo', 'command'], ['$(', 'operator'], ['date', 'command'], [')', 'operator'], ['${HOME}', 'variable'], ['2>&1', 'redirect'], ['>>', 'redirect'], ['log', 'plain'], ['# done', 'comment'],
  ])
  expect(roles('FOO=1 make')).toEqual([['FOO=', 'variable'], ['1', 'plain'], ['make', 'command']])
  expect(roles("grep 'a#b' x#y")).toEqual([['grep', 'command'], ["'a#b'", 'string'], ['x#y', 'plain']])
})

test('fitTokens cuts by terminal cells and ends with an ellipsis', () => {
  const tokens = shellTokens('git status --short')
  expect(fitTokens(tokens, 40)).toEqual(tokens)
  const cut = fitTokens(tokens, 8)
  expect(cut.map(token => token.text).join('')).toBe('git sta…')
  expect(tokenCells(cut)).toBe(8)
  expect(cut[0]?.role).toBe('command')
  const wide = fitTokens(shellTokens('echo 漢字漢字'), 9)
  expect(cells(wide.map(token => token.text).join(''))).toBeLessThanOrEqual(9)
  expect(fitTokens(tokens, 0)).toEqual([])
})

test('an escaped double quote stays inside its string; single quotes escape nothing', () => {
  expect(roles('grep "a\\"b" f && ls')).toEqual([['grep', 'command'], ['"a\\"b"', 'string'], ['f', 'plain'], ['&&', 'operator'], ['ls', 'command']])
  expect(roles("echo 'a\\' b")).toEqual([['echo', 'command'], ["'a\\'", 'string'], ['b', 'plain']])
})

test('only an opening backtick, $( or ( makes the next word a command', () => {
  expect(roles('echo `date` foo')).toEqual([['echo', 'command'], ['`', 'operator'], ['date', 'command'], ['`', 'operator'], ['foo', 'plain']])
  expect(roles('echo $(date) foo')).toEqual([['echo', 'command'], ['$(', 'operator'], ['date', 'command'], [')', 'operator'], ['foo', 'plain']])
  expect(roles('echo $((1+2)) foo')).toEqual([['echo', 'command'], ['$((1+2))', 'variable'], ['foo', 'plain']])
})

test('the parts rebuild escaped, backticked and arithmetic lines exactly', () => {
  for (const line of ['grep "a\\"b" f && ls', 'echo `date` foo', 'echo $((1+2)) "x', "echo 'open"]) {
    expect(shellTokens(line).map(token => token.text).join('')).toBe(line)
  }
})
