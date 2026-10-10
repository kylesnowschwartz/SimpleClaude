import type { ProcessRunResult, SessionAppendInput } from 'claude-code'

/**
 * A row the main conversation keeps, by the ids a drawn row of it carries:
 * the stored row's own id first, then the ids of the tool calls it makes.
 */
export type StoredRow = { ids: readonly string[]; isPrompt: boolean }

/**
 * Where each stored row of the main conversation sits, in the order the
 * conversation keeps them. A drawn message's requestId is its stored row's
 * id and a tool row's is its call's id, so each maps to the row's place.
 */
export class TranscriptOrder {
  readonly #placeOf = new Map<string, number>()
  readonly #prompts: Array<{ place: number; id: string }> = []
  #rowCount = 0

  /** The rows in order; a row whose id is placed already keeps its first place. */
  static of(rows: Iterable<StoredRow>): TranscriptOrder {
    const order = new TranscriptOrder()
    for (const row of rows) order.add(row)
    return order
  }

  /** Places the row after every row placed so far, unless it is placed already. */
  add(row: StoredRow) {
    if (row.ids.some(id => this.#placeOf.has(id))) return

    const place = this.#rowCount
    this.#rowCount += 1
    for (const id of row.ids) this.#placeOf.set(id, place)
    const [id] = row.ids
    if (row.isPrompt && id !== undefined) this.#prompts.push({ place, id })
  }

  /** The place of the first row holding one of the ids: a group of tool calls sits at its first call's. */
  placeOf(ids: readonly string[]): number | undefined {
    const places = ids.flatMap(id => this.#placeOf.get(id) ?? [])
    return places.length === 0 ? undefined : Math.min(...places)
  }

  /** The id of the person's nearest prompt before the place (step -1) or after it (step 1). */
  promptPast(place: number, step: -1 | 1): string | undefined {
    const prompt = step === 1 ? this.#prompts.find(p => p.place > place) : this.#prompts.findLast(p => p.place < place)
    return prompt?.id
  }
}

/** Whether the person sent it: typed at the terminal, or through Remote Control. */
export const isPersonsPrompt = (origin: { kind: string }) => origin.kind === 'composer' || origin.kind === 'bridge'

const toolUseIdsOf = (e: SessionAppendInput) =>
  e.message.content.flatMap(block => (block.type === 'tool_use' && typeof block.id === 'string' ? [block.id] : []))

/** The main conversation's row a `session.append` stores; undefined for a subagent's. */
export function appendedRow(e: SessionAppendInput): StoredRow | undefined {
  if (e.agentId !== undefined) return undefined
  return { ids: [e.uuid, ...toolUseIdsOf(e)], isPrompt: e.door === 'prompt' && isPersonsPrompt(e.origin) }
}

/**
 * The parts of a transcript line that place its row: its id, its tool calls'
 * ids, who wrote it, and whether the person sees it as typed or a subagent
 * keeps it. Inside a JSON string every quote is escaped, so these match the
 * line's own fields and never text the row quotes.
 */
const ROW_FIELDS = '"uuid":"[^"]+"|"type":"tool_use","id":"[^"]+"|"origin":\\{"kind":"[a-z-]+"|"isMeta":true|"isSidechain":true'

const UUID_FIELD = /^"uuid":"([^"]+)"$/
const TOOL_USE_FIELD = /^"type":"tool_use","id":"([^"]+)"$/
// The transcript files the person's own prompts under this origin.
const PERSONS_ORIGIN = '"origin":{"kind":"human"'

/** One transcript line's fields, as `grep -n -o` prints them: `<line>:<field>`. */
type LineFields = { line: string; fields: string[] }

function linesOf(grepOutput: string): LineFields[] {
  const lines: LineFields[] = []
  for (const printed of grepOutput.split('\n')) {
    const colon = printed.indexOf(':')
    if (colon < 0) continue

    const [line, field] = [printed.slice(0, colon), printed.slice(colon + 1)]
    const current = lines.at(-1)
    if (current?.line === line) current.fields.push(field)
    else lines.push({ line, fields: [field] })
  }
  return lines
}

function rowOfLine({ fields }: LineFields): StoredRow | undefined {
  if (fields.includes('"isSidechain":true')) return undefined

  const ids = fields.flatMap(field => UUID_FIELD.exec(field)?.[1] ?? [])
  if (ids.length === 0) return undefined

  const toolUseIds = fields.flatMap(field => TOOL_USE_FIELD.exec(field)?.[1] ?? [])
  const isPrompt = fields.includes(PERSONS_ORIGIN) && !fields.includes('"isMeta":true')
  return { ids: [...ids, ...toolUseIds], isPrompt }
}

/** The main conversation's rows, in order, from `grep -n -o` of ROW_FIELDS over a transcript file. */
export const rowsOfTranscriptFields = (grepOutput: string): StoredRow[] => linesOf(grepOutput).flatMap(line => rowOfLine(line) ?? [])

/**
 * The command that prints ROW_FIELDS of each line of a transcript file. A
 * transcript can run to tens of megabytes, past what one file read takes,
 * so grep prints only the fields that place each row.
 */
export const transcriptFieldsCommand = (path: string) => ['grep', '-a', '-n', '-o', '-E', ROW_FIELDS, path]

// grep's exit status when it read the file and matched nothing.
const NO_MATCH = 1

/** The rows `transcriptFieldsCommand` found, from what it printed and how it exited. */
export function rowsOfTranscriptRead({ exitCode, stdout, stderr }: ProcessRunResult): StoredRow[] {
  if (exitCode === 0) return rowsOfTranscriptFields(stdout)
  if (exitCode === NO_MATCH) return []
  throw new Error(stderr.trim() || `grep exited ${exitCode}`)
}

/**
 * The command that prints the path of the session's transcript file:
 * `<id>.jsonl` in one of the config folder's project folders. It is searched
 * for rather than built, since a project folder's name is Claude Code's own
 * encoding of the project's path.
 */
export const findTranscriptCommand = (configDir: string, sessionId: string) => [
  'find',
  `${configDir}/projects`,
  '-maxdepth',
  '2',
  '-name',
  `${sessionId}.jsonl`,
  '-print',
  '-quit',
]
