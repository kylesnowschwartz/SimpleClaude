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
  readonly #prompts: StoredPrompt[] = []
  #rowCount = 0

  /** The rows in order; a row whose id is placed already keeps its first place. */
  static of(rows: Iterable<StoredRow>): TranscriptOrder {
    const order = new TranscriptOrder()
    for (const row of rows) order.add(row)
    return order
  }

  /**
   * Places the row after every row placed so far, unless its own id is
   * placed already. A row recorded again under a new id carries tool calls
   * placed with the first record, which keep that first place.
   */
  add(row: StoredRow) {
    const [id] = row.ids
    if (id === undefined || this.#placeOf.has(id)) return

    const place = this.#rowCount
    this.#rowCount += 1
    for (const each of row.ids) if (!this.#placeOf.has(each)) this.#placeOf.set(each, place)
    if (row.isPrompt) this.#prompts.push({ place, id })
  }

  /** The place of the first row holding one of the ids: a group of tool calls sits at its first call's. */
  placeOf(ids: readonly string[]): number | undefined {
    const places = ids.flatMap(id => this.#placeOf.get(id) ?? [])
    return places.length === 0 ? undefined : Math.min(...places)
  }

  /** The person's prompts, in transcript order. */
  prompts(): readonly StoredPrompt[] {
    return this.#prompts
  }
}

/** One of the person's prompts the conversation keeps: its place in the transcript, and its id. */
export type StoredPrompt = { place: number; id: string }

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
const ROW_FIELDS = '"parentUuid":(null|"[^"]+")|"uuid":"[^"]+"|"type":"tool_use","id":"[^"]+"|"origin":\\{"kind":"[a-z-]+"|"isMeta":true|"isSidechain":true'

const PARENT_FIELD = /^"parentUuid":(?:null|"([^"]+)")$/
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

/**
 * A transcript row and the row it follows: a parent id, null where the
 * conversation starts again (its first row, or a compaction's boundary), or
 * undefined for a line that names none, which follows the line before it.
 */
type LinkedRow = { row: StoredRow; parent: string | null | undefined }

function parentOf(fields: readonly string[]): string | null | undefined {
  // The line's own parent link is its first field.
  const link = fields.map(field => PARENT_FIELD.exec(field)).find(found => found !== null)
  return link === undefined ? undefined : (link[1] ?? null)
}

function rowOfLine({ fields }: LineFields): LinkedRow | undefined {
  if (fields.includes('"isSidechain":true')) return undefined

  const ids = fields.flatMap(field => UUID_FIELD.exec(field)?.[1] ?? [])
  if (ids.length === 0) return undefined

  const toolUseIds = fields.flatMap(field => TOOL_USE_FIELD.exec(field)?.[1] ?? [])
  const isPrompt = fields.includes(PERSONS_ORIGIN) && !fields.includes('"isMeta":true')
  return { row: { ids: [...ids, ...toolUseIds], isPrompt }, parent: parentOf(fields) }
}

/**
 * The rows of the conversation as it stands: the newest row and the rows it
 * follows, back to where the conversation last started again. A rewind
 * leaves the rows after the point rewound to off this line, and a
 * compaction leaves the rows before its boundary off it.
 */
function currentBranch(linked: readonly LinkedRow[]): StoredRow[] {
  const byId = new Map(linked.map((each, at) => [each.row.ids[0], at]))
  const onBranch = new Set<number>()
  let at: number | undefined = linked.length - 1
  while (at !== undefined && at >= 0 && !onBranch.has(at)) {
    onBranch.add(at)
    const { parent }: LinkedRow = linked[at] as LinkedRow
    at = parent === undefined ? at - 1 : parent === null ? undefined : byId.get(parent)
  }
  return linked.flatMap((each, place) => (onBranch.has(place) ? [each.row] : []))
}

/** The main conversation's rows, in order, from `grep -n -o` of ROW_FIELDS over a transcript file. */
export const rowsOfTranscriptFields = (grepOutput: string): StoredRow[] => currentBranch(linesOf(grepOutput).flatMap(line => rowOfLine(line) ?? []))

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
