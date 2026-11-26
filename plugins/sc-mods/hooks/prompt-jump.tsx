import { atom, read, update } from 'claude-code'
import type { ButtonProps, ElementConstructor, EngineInterface, On, RenderNode, ProcessRunResult, SessionAppendDoor, SessionAppendInput } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * The person's prompts the conversation keeps, by their stored row ids, in
 * the order sent: those its transcript file held when the plugin loaded,
 * then those stored since. `at` is the index of the prompt the arrows last
 * jumped to, or undefined while they rest at the end of the conversation, a
 * place after the newest prompt where ▶ past the newest and every
 * new prompt puts them. `storedRead` is the read of the transcript file,
 * under way or done; undefined until it starts, and again when it found no
 * file or a file behind the conversation, so the next need tries again.
 * `endRow` is the id of the row the conversation stored last, where its end
 * is drawn; undefined until it stores one while the plugin runs.
 * `storedEndRows` is the ids of the last main-conversation rows the
 * transcript file held since its last compaction, newest last: where the end
 * of a conversation the plugin loaded into is drawn.
 */
export type PromptTrail = {
  prompts: string[]
  at: number | undefined
  storedRead: Promise<void> | undefined
  endRow: string | undefined
  storedEndRows: string[]
}

export const newTrail = (): PromptTrail => ({ prompts: [], at: undefined, storedRead: undefined, endRow: undefined, storedEndRows: [] })

/**
 * The rows ▶ on the newest prompt tries, in order, to reach the end of the
 * conversation: the row stored last while the plugin runs, else the
 * transcript file's last rows, newest first.
 */
export const endRowsToTry = (trail: PromptTrail): string[] => (trail.endRow !== undefined ? [trail.endRow] : [...trail.storedEndRows].reverse())

/** Whether the person sent it: typed at the terminal, or through Remote Control. */
export const isPersonsPrompt = (origin: { kind: string }) => origin.kind === 'composer' || origin.kind === 'bridge'

/**
 * The id of the person's prompt a `session.append` stores in the main
 * conversation; undefined for any other row. A prompt sent while a turn
 * runs its tools is delivered into that turn as a `queued_command` row, and
 * drawn as a prompt all the same.
 */
export function promptIdOf(e: SessionAppendInput): string | undefined {
  const isTyped = e.door === 'prompt' || (e.door === 'delivery' && e.message.name === 'queued_command')
  const isPrompt = e.agentId === undefined && isTyped && isPersonsPrompt(e.origin) && e.message.isMeta !== true
  return isPrompt ? e.uuid : undefined
}

/** The index of the prompt the arrows are on: the one last jumped to, else the newest. */
const indexOn = ({ prompts, at }: PromptTrail) => at ?? prompts.length - 1

/**
 * Where a step lands: the index of a prompt, `'end'` for the end of the
 * conversation after the newest prompt, or undefined before the first. From
 * the end, a step back lands on the newest prompt and a step on stays at the
 * end; from the newest prompt, a step on lands at the end.
 */
export function jumpTarget(trail: PromptTrail, step: Step): number | 'end' | undefined {
  const target = (trail.at ?? trail.prompts.length) + step
  if (target < 0) return undefined
  return target < trail.prompts.length ? target : 'end'
}

/** `Turn 7/8` while the arrows are on the seventh of eight prompts; empty with none known. */
export const positionText = (trail: PromptTrail): string => (trail.prompts.length === 0 ? '' : `Turn ${indexOn(trail) + 1}/${trail.prompts.length}`)

/** The prompt the arrows are on: its id, its number counting from 1, and how many prompts are known. */
export type TurnOn = { promptId: string; number: number; count: number }

/** The prompt the arrows are on, or undefined with none known. */
export function turnOn(trail: PromptTrail): TurnOn | undefined {
  const index = indexOn(trail)
  const promptId = trail.prompts[index]
  return promptId === undefined ? undefined : { promptId, number: index + 1, count: trail.prompts.length }
}

/** The newest prompt known, or undefined with none. */
export const newestPromptId = (trail: PromptTrail): string | undefined => trail.prompts.at(-1)

/** The prompt's number counting from 1, or undefined for a row that is not one of the person's prompts known. */
export function promptNumber(trail: PromptTrail, id: string): number | undefined {
  const index = trail.prompts.indexOf(id)
  return index < 0 ? undefined : index + 1
}

/** Adds a prompt the conversation stored; the arrows rest on it. */
export function notePrompt(trail: PromptTrail, id: string) {
  if (trail.prompts.includes(id)) return
  trail.prompts.push(id)
  trail.at = undefined
}

/**
 * Puts the prompts the transcript file held before the first prompt already
 * known, each once: all of them while none is known, those up to the first
 * known where the file holds it, and none where it does not (a prompt from
 * before the file's last compaction, or one the file has not stored yet).
 * The arrows keep the prompt they are on.
 */
export function noteStored(trail: PromptTrail, ids: readonly string[]) {
  const [first] = trail.prompts
  const olderCount = first === undefined ? ids.length : ids.indexOf(first)
  if (olderCount <= 0) return

  const older = ids.slice(0, olderCount)
  const held = new Set(older)
  trail.prompts = [...older, ...trail.prompts.filter(id => !held.has(id))]
  if (trail.at !== undefined) trail.at += older.length
}

/** Forgets the conversation that ended: `/clear` and `/resume` go on in this process with other prompts. */
function startOver(trail: PromptTrail) {
  Object.assign(trail, newTrail())
}

// --- The prompts a transcript file holds --------------------------------

/**
 * The fields of a transcript line that tell a prompt the person typed: its
 * row type and id, who wrote it, whether the person sees it as typed or a
 * subagent keeps it, and a compaction's boundary. Inside a JSON string every
 * quote is escaped, so these match the line's own fields and never text the
 * row quotes.
 */
const ROW_FIELDS = '"type":"user"|"type":"attachment"|"type":"queued_command"|"origin":\\{"kind":"human"|"isMeta":true|"isSidechain":true|"subtype":"compact_boundary"|"uuid":"[^"]+"'

const UUID_FIELD = /^"uuid":"([^"]+)"$/

/** The command that prints ROW_FIELDS of each line of a transcript file, as `grep -n -o` does: `<line>:<field>`. */
export const transcriptFieldsCommand = (path: string) => ['grep', '-a', '-n', '-o', '-E', ROW_FIELDS, path]

/** Each line's fields, in file order. */
function linesOf(grepOutput: string): string[][] {
  const lines: Array<{ line: string; fields: string[] }> = []
  for (const printed of grepOutput.split('\n')) {
    const colon = printed.indexOf(':')
    if (colon < 0) continue

    const [line, field] = [printed.slice(0, colon), printed.slice(colon + 1)]
    const current = lines.at(-1)
    if (current?.line === line) current.fields.push(field)
    else lines.push({ line, fields: [field] })
  }
  return lines.map(({ fields }) => fields)
}

// A prompt typed at rest is a user row; one delivered into a running turn is a queued_command attachment row.
const isTypedRow = (fields: readonly string[]) =>
  fields.includes('"type":"user"') || (fields.includes('"type":"attachment"') && fields.includes('"type":"queued_command"'))

const isPersonsRow = (fields: readonly string[]) =>
  isTypedRow(fields) && fields.includes('"origin":{"kind":"human"') && !fields.includes('"isMeta":true') && !fields.includes('"isSidechain":true')

/**
 * The ids of the person's prompts since the last compaction, in order, from
 * `grep -n -o` of ROW_FIELDS over a transcript file. Claude Code draws a
 * resumed conversation from its last compaction's boundary, so the prompts
 * before it have no row to scroll to.
 */
export function storedPromptIds(grepOutput: string): string[] {
  return storedRows(grepOutput).promptIds
}

/** How many of the transcript file's last rows ▶ tries for the end of the conversation. */
export const END_ROW_COUNT = 5

/**
 * What a transcript file holds since its last compaction, from `grep -n -o`
 * of ROW_FIELDS over it: the ids of the person's prompts, in order, and of
 * the last `END_ROW_COUNT` rows of the main conversation (not a subagent's),
 * newest last.
 */
export function storedRows(grepOutput: string): { promptIds: string[]; endRowIds: string[] } {
  let promptIds: string[] = []
  let endRowIds: string[] = []
  for (const fields of linesOf(grepOutput)) {
    if (fields.includes('"subtype":"compact_boundary"')) {
      promptIds = []
      endRowIds = []
      continue
    }
    const id = fields.map(field => UUID_FIELD.exec(field)?.[1]).find(found => found !== undefined)
    if (id === undefined || fields.includes('"isSidechain":true')) continue
    if (isPersonsRow(fields)) promptIds.push(id)
    endRowIds.push(id)
    if (endRowIds.length > END_ROW_COUNT) endRowIds.shift()
  }
  return { promptIds, endRowIds }
}

// grep's exit status when it read the file and matched nothing.
const NO_MATCH = 1

/** Whether the file read holds the row anywhere, before its last compaction included. */
export const readHoldsRow = (grepOutput: string, id: string) => grepOutput.includes(`"uuid":"${id}"`)

/** The rows `transcriptFieldsCommand` found (see `storedRows`), from what it printed and how it exited. */
export function storedRowsOfRead({ exitCode, stdout, stderr, isStdoutTruncated }: ProcessRunResult): { promptIds: string[]; endRowIds: string[] } {
  // A cut output loses the newest rows, the ones a jump reaches.
  if (isStdoutTruncated) throw new Error('grep output truncated')
  if (exitCode === 0) return storedRows(stdout)
  if (exitCode === NO_MATCH) return { promptIds: [], endRowIds: [] }
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

const TRANSCRIPT_FIND_TIMEOUT_MS = 5000
const TRANSCRIPT_READ_TIMEOUT_MS = 10000

async function configDir($: EngineInterface): Promise<string | undefined> {
  const configured = await $.env.get('CLAUDE_CONFIG_DIR')
  if (configured !== undefined) return configured

  const home = await $.env.get('HOME')
  return home === undefined ? undefined : `${home}/.claude`
}

async function findTranscript($: EngineInterface): Promise<string | undefined> {
  const dir = await configDir($)
  if (dir === undefined) return undefined

  const found = await $.process.run(findTranscriptCommand(dir, await $.session.id()), { timeoutMs: TRANSCRIPT_FIND_TIMEOUT_MS })
  return found.stdout.trim() || undefined
}

/**
 * Reads the transcript file once for the prompts the conversation stored
 * before the plugin saw them: those of a session resumed or continued, or
 * one the plugin loaded into. A session's file is written with its first
 * row, so a read that finds none leaves the next need to read again.
 */
function readStored($: EngineInterface, trail: PromptTrail): Promise<void> {
  if (trail.storedRead !== undefined) return trail.storedRead

  const readOnce = async () => {
    try {
      const path = await findTranscript($)
      if (path === undefined) {
        if (trail.storedRead === pending) trail.storedRead = undefined
        return
      }
      const read = await $.process.run(transcriptFieldsCommand(path), { timeoutMs: TRANSCRIPT_READ_TIMEOUT_MS })
      if (trail.storedRead !== pending) return
      const { promptIds, endRowIds } = storedRowsOfRead(read)
      noteStored(trail, promptIds)
      trail.storedEndRows = endRowIds
      // A file that holds none of the prompts known lags the conversation: the next need reads it again.
      const [first] = trail.prompts
      if (first !== undefined && !readHoldsRow(read.stdout, first)) trail.storedRead = undefined
      await publishPosition($, trail)
    } catch (error) {
      // The prompts stored before the plugin loaded go uncounted.
      $.ui.log(`sc-mods: could not read the transcript: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
    }
  }
  const pending = readOnce()
  trail.storedRead = pending
  return pending
}

// --- The band -----------------------------------------------------------

/**
 * The doors whose rows reach this plugin where managed settings are present.
 * Rows through the other doors (attachment, hook-context, compaction,
 * tool-message, note) do not.
 */
const REACHABLE_DOORS: SessionAppendDoor[] = ['prompt', 'delivery', 'response', 'tool-result', 'command', 'notice', 'queue']

/**
 * The count the band shows. A jump does not change the band's props, so the
 * band reads the count from state, and a write draws the band again without
 * drawing the transcript's rows.
 */
const PROMPT_POSITION = atom({ plugin: 'sc-mods', key: 'promptPosition' } as const, '')

const publishPosition = ($: EngineInterface, trail: PromptTrail) => update($, PROMPT_POSITION, () => positionText(trail))

/**
 * The prompt the arrows are on, read while drawing: a jump, a new prompt or
 * the transcript file's read draws the reader again.
 */
export async function readTurnOn($: EngineInterface, trail: PromptTrail): Promise<TurnOn | undefined> {
  await read($, PROMPT_POSITION)
  return turnOn(trail)
}

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  await readStored($, trail)
  const target = jumpTarget(trail, step)
  if (target === undefined) {
    $.ui.toast('No earlier prompt')
    return
  }

  // The arrows move on before the scroll, so a press during it steps from this place, and past a prompt the transcript cannot reach (one a rewind took away).
  trail.at = target === 'end' ? undefined : target
  await publishPosition($, trail)
  if (target === 'end') {
    const endRows = endRowsToTry(trail)
    if (endRows.length === 0) {
      $.ui.toast('No later prompt')
      return
    }
    const refusal = await firstScrollRefusal(endRows, id => scrollRefusal($, id, 'end'))
    if (refusal !== undefined) $.ui.toast(`Can't scroll to the end: ${refusal}`)
    return
  }
  const refusal = await scrollRefusal($, trail.prompts[target] as string, 'start')
  if (refusal !== undefined) $.ui.toast(`Can't jump to that prompt: ${refusal}`)
}

/**
 * Scrolls to each row in turn until one is not refused (a file's row may be
 * one the transcript does not draw). Undefined once the transcript moved,
 * else the last row's refusal.
 */
export async function firstScrollRefusal(ids: readonly string[], scroll: (id: string) => Promise<string | undefined>): Promise<string | undefined> {
  let refusal: string | undefined
  for (const id of ids) {
    refusal = await scroll(id)
    if (refusal === undefined) return undefined
  }
  return refusal
}

/**
 * Why the transcript did not move to the row, or undefined once it did. With
 * `block` `'start'` the row lands at the window's top, with the rows after it
 * below; with `'end'` it lands at the window's bottom, just above the prompt
 * box. Claude Code scrolls to a row its transcript has drawn; the window
 * stays where it is when the row cannot reach that edge (a row near the end
 * cannot reach the top), and that answers as moved.
 */
async function scrollRefusal($: EngineInterface, requestId: string, block: 'start' | 'end'): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * The band's ◀ and ▶ buttons, which scroll the transcript so the previous or
 * next of the person's prompts sits at the top of the view, with the
 * arrows' place among them between. The end of the conversation is a place
 * after the newest prompt: ▶ from the newest prompt, or from the end, scrolls
 * there, and ◀ from it goes to the newest prompt. Hotkeys 1 and 2 press them
 * while the band holds the keyboard.
 *
 * The prompts counted are those the transcript file holds since its last
 * compaction, read when the plugin loads or at the first press, and those
 * stored since. The arrows step from the place last jumped to, so a press
 * moves them on even where the window could not move; the person's own
 * scrolling does not move them.
 *
 * `trail` is the prompts it counts; `startPromptJump` with the same trail
 * runs once the session has started.
 */
export function registerPromptJump(on: On, trail: PromptTrail) {
  on('session.end', ($, e, next) => {
    if (e.reason === 'clear' || e.reason === 'resume') {
      startOver(trail)
      void publishPosition($, trail)
    }
    return next(e)
  })

  on('session.append', { door: REACHABLE_DOORS }, ($, e, next) => {
    if (e.agentId === undefined) trail.endRow = e.uuid
    const id = promptIdOf(e)
    if (id !== undefined) {
      notePrompt(trail, id)
      void publishPosition($, trail)
    }
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    // The prompts it knows are the main conversation's, not an agent's.
    if (e.props.hasSurvey || e.props.view.agentId !== undefined) return next(e)

    const position = await read($, PROMPT_POSITION)
    // The band is shared: what the plugins beneath draw stays, above the arrows.
    const beneath = await next(e)
    // A plugin beneath that draws the arrows in its own rows keeps the band a row shorter.
    if (holdsArrows(beneath)) return beneath
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {beneath}
        <Box flexDirection="row" columnGap={1}>
          {promptArrows($, Button, trail, position === '' ? null : <Text dimColor>{position}</Text>)}
        </Box>
      </Box>
    )
  })
}

/** The keys of the ◀ and ▶ buttons, wherever they are drawn. */
export const PREVIOUS_KEY = 'prompt-jump:previous'
export const NEXT_KEY = 'prompt-jump:next'

/** The cells a ◀ or ▶ button takes: the terminal draws it `[ ◀ ]`. */
export const ARROW_CELLS = 5

/**
 * The ◀ and ▶ buttons with `between` drawn between them, as the children of
 * a row Box. A plugin that draws them in its own band rows keeps the arrows'
 * own row from being drawn; they jump as they do there.
 */
export function promptArrows($: EngineInterface, Button: ElementConstructor<ButtonProps>, trail: PromptTrail, between: RenderNode | null): Array<RenderNode | null> {
  return [
    <Button key={PREVIOUS_KEY} hotkey="1" label="◀" onPress={() => jump($, trail, -1)} />,
    between,
    <Button key={NEXT_KEY} hotkey="2" label="▶" onPress={() => jump($, trail, 1)} />,
  ]
}

/** Whether a drawn tree holds the ◀ button. */
export function holdsArrows(tree: unknown): boolean {
  if (Array.isArray(tree)) return tree.some(holdsArrows)
  if (tree === null || typeof tree !== 'object') return false
  const element = tree as { key?: unknown; props?: { key?: unknown } | null; children?: unknown }
  if (element.key === PREVIOUS_KEY || element.props?.key === PREVIOUS_KEY) return true
  return holdsArrows(element.children)
}

/** Resolves once the prompts the transcript file held are known (or could not be read). */
export function readStoredPrompts($: EngineInterface, trail: PromptTrail): Promise<void> {
  return readStored($, trail)
}

/** Starts the read of the transcript file, once the session has started. */
export function startPromptJump($: EngineInterface, trail: PromptTrail) {
  void readStored($, trail)
}
