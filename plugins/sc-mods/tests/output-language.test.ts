import { expect, test } from 'claude-code/testing'
import { outputLanguage } from '../hooks/output-language'

const HUNK = ['diff --git a/x b/x', '@@ -1 +1 @@', '-a', '+b']

test('diff commands with a hunk in their output are diffs', () => {
  expect(outputLanguage('git diff', HUNK)).toEqual({ format: 'diff' })
  expect(outputLanguage('git -C /repo show --stat -p HEAD~1 | head -40', HUNK)).toEqual({ format: 'diff' })
  expect(outputLanguage('git log -p -3', HUNK)).toEqual({ format: 'diff' })
  expect(outputLanguage('diff -u a b', HUNK)).toEqual({ format: 'diff' })
  expect(outputLanguage('git diff --stat', [' x | 2 +-'])).toBeUndefined()
  expect(outputLanguage('cat notes.txt', HUNK)).toEqual({ path: 'notes.txt' })
})

test('output that parses as JSON, or a jq pipe, is JSON', () => {
  expect(outputLanguage('curl -s api', ['{', '  "a": [1, 2]', '}'])).toEqual({ language: 'json' })
  expect(outputLanguage('kubectl get pods | jq .items', ['not json yet'])).toEqual({ language: 'json' })
  expect(outputLanguage('echo', ['{ not json'])).toBeUndefined()
})

test('a single-file reader names the file by its path', () => {
  expect(outputLanguage('cat plugins/sc-mods/hooks/tool-drawer.tsx', ['x'])).toEqual({ path: 'plugins/sc-mods/hooks/tool-drawer.tsx' })
  expect(outputLanguage('head -n 20 src/app.rb', ['x'])).toEqual({ path: 'src/app.rb' })
  expect(outputLanguage("sed -n '1,20p' lib/a.py", ['x'])).toEqual({ path: 'lib/a.py' })
  expect(outputLanguage('bat Dockerfile', ['x'])).toEqual({ path: 'Dockerfile' })
  expect(outputLanguage('cat a.rb b.rb', ['x'])).toBeUndefined()
  expect(outputLanguage('cat a.rb | wc -l', ['x'])).toBeUndefined()
  expect(outputLanguage('cat README', ['x'])).toBeUndefined()
})

test('a failed call or no output stays plain', () => {
  expect(outputLanguage('git diff', HUNK, true)).toBeUndefined()
  expect(outputLanguage('cat a.json', [])).toBeUndefined()
})
