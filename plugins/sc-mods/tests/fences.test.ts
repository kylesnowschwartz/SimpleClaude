import { expect, test } from 'claude-code/testing'
import { findMermaidFences, replaceFences } from '../hooks/fences'

const sourcesIn = (text: string) => findMermaidFences(text).map(fence => fence.source)

test('a backtick fence is found with its source and offsets', () => {
  const text = 'Before\n```mermaid\nflowchart TD\n  A-->B\n```\nAfter'
  const [fence] = findMermaidFences(text)
  expect(fence?.source).toBe('flowchart TD\n  A-->B')
  expect(fence?.isClosed).toBe(true)
  expect(text.slice(fence?.start, fence?.end)).toBe('```mermaid\nflowchart TD\n  A-->B\n```')
})

test('a tilde fence and a longer backtick fence are found', () => {
  expect(sourcesIn('~~~mermaid\ngraph TD\n~~~')).toEqual(['graph TD'])
  expect(sourcesIn('````mermaid\ngraph TD\n````')).toEqual(['graph TD'])
})

test('the language is matched case-insensitively, as a whole word', () => {
  expect(sourcesIn('```Mermaid\ngraph TD\n```')).toEqual(['graph TD'])
  expect(sourcesIn('```mermaid title\ngraph TD\n```')).toEqual(['graph TD'])
  expect(sourcesIn('```mermaidjs\ngraph TD\n```')).toEqual([])
  expect(sourcesIn('```text mermaid\ngraph TD\n```')).toEqual([])
})

test('a fence closes only on the same character, at least as long', () => {
  const text = '````mermaid\ngraph TD\n```\n~~~~\n````'
  expect(sourcesIn(text)).toEqual(['graph TD\n```\n~~~~'])
})

test('a closing fence with an info string does not close the block', () => {
  const [fence] = findMermaidFences('```mermaid\ngraph TD\n```js\n')
  expect(fence?.isClosed).toBe(false)
})

test('a fence with no closing line yet is reported as unclosed', () => {
  const text = 'Look:\n```mermaid\nflowchart TD\n  A-->'
  const [fence] = findMermaidFences(text)
  expect(fence?.isClosed).toBe(false)
  expect(fence?.source).toBe('flowchart TD\n  A-->')
  expect(fence?.end).toBe(text.length)
})

test('a fence in a list item carries the item indent', () => {
  const text = '1. Steps:\n\n   ```mermaid\n   graph TD\n     A-->B\n   ```\n2. Next'
  const [fence] = findMermaidFences(text)
  expect(fence?.source).toBe('graph TD\n  A-->B')
  expect(fence?.openingPrefix).toBe('   ')
  expect(fence?.linePrefix).toBe('   ')
})

test('a fence opened on a list marker line continues under spaces', () => {
  const [fence] = findMermaidFences('- ```mermaid\n  graph TD\n  ```')
  expect(fence?.source).toBe('graph TD')
  expect(fence?.openingPrefix).toBe('- ')
  expect(fence?.linePrefix).toBe('  ')
})

test('a fence in a blockquote is found, and ends with the quote', () => {
  const quoted = '> ```mermaid\n> graph TD\n> ```'
  expect(sourcesIn(quoted)).toEqual(['graph TD'])
  const [endedByQuote] = findMermaidFences('> ```mermaid\n> graph TD\nPlain text')
  expect(endedByQuote?.isClosed).toBe(true)
  expect(endedByQuote?.source).toBe('graph TD')
})

test('a quoted fence stays open across a blank last line', () => {
  const [fence] = findMermaidFences('> ```mermaid\n> graph TD\n')
  expect(fence?.isClosed).toBe(false)
  expect(fence?.source).toBe('graph TD')
})

test('a mermaid fence inside another code block is an example, not a diagram', () => {
  const text = '````markdown\n```mermaid\ngraph TD\n```\n````\n\n```mermaid\nsequenceDiagram\n```'
  expect(sourcesIn(text)).toEqual(['sequenceDiagram'])
})

test('a mermaid fence inside an HTML comment is skipped', () => {
  const text = '<!--\n```mermaid\ngraph TD\n```\n-->\n<!-- one line -->\n```mermaid\ngraph LR\n```'
  expect(sourcesIn(text)).toEqual(['graph LR'])
})

test('a backtick line whose info holds a backtick is inline code, not a fence', () => {
  expect(sourcesIn('```mermaid` inline\ngraph TD\n```')).toEqual([])
})

test('a replacement keeps the list prefix on every line', () => {
  const text = 'Intro\n- ```mermaid\n  graph TD\n  ```\nOutro'
  const [fence] = findMermaidFences(text)
  const rewritten = replaceFences(text, [{ fence: fence!, text: '```text\nA\nB\n```' }])
  expect(rewritten).toBe('Intro\n- ```text\n  A\n  B\n  ```\nOutro')
})

test('a replacement keeps the quote prefix on every line', () => {
  const text = '> ```mermaid\n> graph TD\n> ```'
  const [fence] = findMermaidFences(text)
  const rewritten = replaceFences(text, [{ fence: fence!, text: '```text\nA\n```' }])
  expect(rewritten).toBe('> ```text\n> A\n> ```')
})
