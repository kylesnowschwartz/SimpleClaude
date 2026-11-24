// What a shell command's output is written in, read from the command and the
// output alone: a unified diff, JSON, or the file a single-file reader printed.

/** How an open card highlights its output: as diff hunks, as a language, or by a file's path. */
export type OutputLanguage = { format: 'diff' } | { language: string } | { path: string }

// Commands that print unified diffs.
const DIFF_COMMAND = /\bgit\b(?:\s+-[Cc]\s+\S+|\s+--?[\w-]+(?:=\S+)?)*\s+(?:diff|show)\b|\bgit\b.*\blog\b.*\s(?:-p|--patch)\b|\bdiff\s+(?:-\w*u|--unified)/
const HUNK_HEADER = /^@@ -\d+(?:,\d+)? \+\d+(?:,\d+)? @@/
const JQ_PIPE = /\|\s*jq\b/
// `cat f`, `head -n 20 f`, `tail -5 f`, `sed -n '1,20p' f`, `bat f`: one command and one file.
const SINGLE_FILE_READER = /^\s*(?:cat|bat|head|tail|sed\s+-n\s+(?:'[^']*'|"[^"]*"|\S+))(?:\s+-{1,2}[\w-]+(?:[= ]\d+)?)*\s+([^\s|&;<>()`$'"*?]+)\s*$/
// A file name with an extension, or a name the highlighter knows by itself.
const NAMED_FILE = /\.[A-Za-z0-9]+$|(?:^|\/)(?:Dockerfile|Makefile|Gemfile|Rakefile|justfile)$/

/** Whether the text parses as JSON: an object or an array. */
function isJson(text: string): boolean {
  const trimmed = text.trim()
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return false
  try {
    JSON.parse(trimmed)
    return true
  } catch {
    return false
  }
}

/**
 * The language an open card's output is highlighted in, or undefined for
 * plain text: a diff command whose output holds a hunk header, output that
 * parses as JSON or a command ending in `| jq`, or the path of the one file
 * `cat`, `bat`, `head`, `tail` or `sed -n` printed. A failed call's output
 * stays plain.
 */
export function outputLanguage(command: string, output: readonly string[], failed = false): OutputLanguage | undefined {
  if (failed || output.length === 0) return undefined
  if (DIFF_COMMAND.test(command) && output.some(line => HUNK_HEADER.test(line))) return { format: 'diff' }
  if (JQ_PIPE.test(command) || isJson(output.join('\n'))) return { language: 'json' }
  const file = SINGLE_FILE_READER.exec(command)?.[1]
  if (file !== undefined && NAMED_FILE.test(file)) return { path: file }
  return undefined
}

/** Whether a line opens a diff hunk. */
export const isHunkHeader = (line: string) => HUNK_HEADER.test(line)
