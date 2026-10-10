import { expect, test } from 'claude-code/testing'
import { displayWidth } from '../hooks/display-width'

test('ASCII takes one cell a character', () => {
  expect(displayWidth('> - ')).toBe(4)
})

test('East Asian wide characters take two cells', () => {
  expect(displayWidth('図表')).toBe(4)
  expect(displayWidth('한글')).toBe(4)
  expect(displayWidth('ＡＢ')).toBe(4)
})

test('emoji take two cells, joined sequences and skin tones included', () => {
  expect(displayWidth('🙂')).toBe(2)
  expect(displayWidth('👍🏽')).toBe(2)
  expect(displayWidth('\u{1F469}\u200D\u{1F4BB}')).toBe(2)
})

test('combining marks take no cell', () => {
  expect(displayWidth('e\u0301')).toBe(1)
})
