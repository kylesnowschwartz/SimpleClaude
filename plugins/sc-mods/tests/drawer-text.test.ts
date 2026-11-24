import { expect, test } from 'claude-code/testing'
import { cells, charCells, cleanLine, cleanText, fit } from '../hooks/drawer-text'
import { keptOutput, startedCall } from '../hooks/tool-drawer'

test('cleanLine strips colour codes and other escape sequences', () => {
  expect(cleanLine('\u001b[31mred\u001b[0m and \u001b[1;32mbold green\u001b[m')).toBe('red and bold green')
  expect(cleanLine('\u001b]0;title\u0007after')).toBe('after')
  expect(cleanLine('\u001b]8;;https://x.test\u001b\\link\u001b]8;;\u001b\\')).toBe('link')
})

test('cleanLine keeps what a carriage return leaves on screen', () => {
  expect(cleanLine('10%\r50%\r100% done')).toBe('100% done')
  expect(cleanLine('line from windows\r')).toBe('line from windows')
})

test('cleanLine expands tabs to stops of eight cells', () => {
  expect(cleanLine('a\tb')).toBe('a       b')
  expect(cleanLine('abcdefgh\tc')).toBe('abcdefgh        c')
  expect(cleanLine('日\tx')).toBe('日      x')
})

test('cleanLine removes control and invisible characters', () => {
  expect(cleanLine('a\u0000b\u0007c​d e‮f')).toBe('abcdef')
})

test('cleanText cleans each line and keeps the breaks', () => {
  expect(cleanText('\u001b[1mone\u001b[0m\ntwo\rTWO')).toBe('one\nTWO')
})

test('a wide character takes two cells and a combining mark none', () => {
  expect(charCells('a')).toBe(1)
  expect(charCells('日')).toBe(2)
  expect(charCells('🚀')).toBe(2)
  expect(charCells('́')).toBe(0)
  expect(cells('é日本')).toBe(5)
})

test('fit cuts by cells with an ellipsis', () => {
  expect(fit('abcdef', 4)).toBe('abc…')
  expect(fit('abc', 4)).toBe('abc')
  expect(fit('abc', 0)).toBe('')
  expect(fit('日本語テキスト', 7)).toBe('日本語…')
  expect(cells(fit('日本語テキスト', 7))).toBeLessThanOrEqual(7)
  expect(fit('🚀🚀🚀', 4)).toBe('🚀…')
})

test('kept output and commands are cleaned', () => {
  expect(keptOutput('\u001b[32mok\u001b[0m\r\nnext\n').output).toEqual(['ok', 'next'])
  expect(startedCall('c', 'echo\t\u001b[1mhi\u001b[0m', 'p', 0).command).toBe('echo    hi')
})
