import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, ProcessRunResult, SessionAppendInput } from 'claude-code'

/** A step through the person's prompts: back to the previous one, or on to the next. */
export type Step = -1 | 1

/**
 * The person's prompts the conversation keeps, by their stored row ids, in
 * the order sent: those its transcript file held when the plugin loaded,
 * then those stored since. `at` is the index of the prompt the arrows last
 * jumped to, or undefined while they rest on the newest prompt, where every
 * new prompt puts them. `storedRead` is the read of the transcript file,
 * under way or done; undefined until it starts, and again when it found no
 * file, so the next need tries again.
 */
export type PromptTrail = { prompts: string[]; at: number | undefined; storedRead: Promise<void> | undefined }

export const newTrail = (): PromptTrail => ({ prompts: [], at: undefined, storedRead: undefined })

/** Whether the person sent it: typed at the terminal, or through Remote Control. */
export const isPersonsPrompt = (origin: { kind: string }) => origin.kind === 'composer' || origin.kind === 'bridge'

/** The id of the person's prompt a `session.append` stores in the main conversation; undefined for any other row. */
export function promptIdOf(e: SessionAppendInput): string | undefined {
  const isPrompt = e.agentId === undefined && e.door === 'prompt' && isPersonsPrompt(e.origin) && e.message.isMeta !== true
  return isPrompt ? e.uuid : undefined
}

/** The index of the prompt the arrows are on: the one last jumped to, else the newest. */
const indexOn = ({ prompts, at }: PromptTrail) => at ?? prompts.length - 1

/** The index of the prompt a step from the one the arrows are on lands on, or undefined past either end. */
export function jumpTarget(trail: PromptTrail, step: Step): number | undefined {
  const target = indexOn(trail) + step
  return target >= 0 && target < trail.prompts.length ? target : undefined
}

/** `7/8` while the arrows are on the seventh of eight prompts; empty with none known. */
export const positionText = (trail: PromptTrail): string => (trail.prompts.length === 0 ? '' : `${indexOn(trail) + 1}/${trail.prompts.length}`)

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
const ROW_FIELDS = '"type":"user"|"origin":\\{"kind":"human"|"isMeta":true|"isSidechain":true|"subtype":"compact_boundary"|"uuid":"[^"]+"'

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

const isPersonsRow = (fields: readonly string[]) =>
  fields.includes('"type":"user"') && fields.includes('"origin":{"kind":"human"') && !fields.includes('"isMeta":true') && !fields.includes('"isSidechain":true')

/**
 * The ids of the person's prompts since the last compaction, in order, from
 * `grep -n -o` of ROW_FIELDS over a transcript file. Claude Code draws a
 * resumed conversation from its last compaction's boundary, so the prompts
 * before it have no row to scroll to.
 */
export function storedPromptIds(grepOutput: string): string[] {
  let ids: string[] = []
  for (const fields of linesOf(grepOutput)) {
    if (fields.includes('"subtype":"compact_boundary"')) {
      ids = []
      continue
    }
    const id = fields.map(field => UUID_FIELD.exec(field)?.[1]).find(found => found !== undefined)
    if (id !== undefined && isPersonsRow(fields)) ids.push(id)
  }
  return ids
}

// grep's exit status when it read the file and matched nothing.
const NO_MATCH = 1

/** The prompt ids `transcriptFieldsCommand` found, from what it printed and how it exited. */
export function promptIdsOfRead({ exitCode, stdout, stderr }: ProcessRunResult): string[] {
  if (exitCode === 0) return storedPromptIds(stdout)
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

  const pending = (async () => {
    try {
      const path = await findTranscript($)
      if (path === undefined) {
        if (trail.storedRead === pending) trail.storedRead = undefined
        return
      }
      const read = await $.process.run(transcriptFieldsCommand(path), { timeoutMs: TRANSCRIPT_READ_TIMEOUT_MS })
      if (trail.storedRead !== pending) return
      noteStored(trail, promptIdsOfRead(read))
      await publishPosition($, trail)
    } catch (error) {
      // The prompts stored before the plugin loaded go uncounted.
      $.ui.log(`sc-mods: could not read the transcript: ${error instanceof Error ? error.message : String(error)}`, { to: 'debug' })
    }
  })()
  trail.storedRead = pending
  return pending
}

// --- The band -----------------------------------------------------------

/**
 * The count the band shows. A jump does not change the band's props, so the
 * band reads the count from state, and a write draws the band again without
 * drawing the transcript's rows.
 */
const PROMPT_POSITION = atom({ plugin: 'sc-mods', key: 'promptPosition' } as const, '')

const publishPosition = ($: EngineInterface, trail: PromptTrail) => update($, PROMPT_POSITION, () => positionText(trail))

async function jump($: EngineInterface, trail: PromptTrail, step: Step) {
  await readStored($, trail)
  const target = jumpTarget(trail, step)
  if (target === undefined) {
    $.ui.toast(step === -1 ? 'No earlier prompt' : 'No later prompt')
    return
  }

  const refusal = await scrollRefusal($, trail.prompts[target] as string)
  if (refusal !== undefined) {
    $.ui.toast(`Can't jump to that prompt: ${refusal}`)
    return
  }
  trail.at = target
  await publishPosition($, trail)
}

/**
 * Why the transcript did not move to the row, or undefined once it did.
 * Claude Code scrolls to a row its transcript has drawn; the window stays
 * where it is when the row's top cannot reach the window's top (a prompt
 * near the end), and that answers as moved.
 */
async function scrollRefusal($: EngineInterface, requestId: string): Promise<string | undefined> {
  try {
    return (await $.ui.scroll({ to: { requestId }, block: 'start' })).deny
  } catch (error) {
    // Where no surface scrolls the transcript, the call rejects instead of denying.
    return error instanceof Error ? error.message : String(error)
  }
}

/**
 * The band's ◀ and ▶ buttons, which scroll the transcript to the previous or
 * next of the person's prompts, with the arrows' place among them between.
 * Hotkeys 1 and 2 press them while the band holds the keyboard.
 *
 * The prompts counted are those the transcript file holds since its last
 * compaction, read when the plugin loads or at the first press, and those
 * stored since. The arrows step from the prompt last jumped to, so a press
 * moves them on even where the window could not move; the person's own
 * scrolling does not move them.
 */
export function registerPromptJump(on: On) {
  const trail = newTrail()

  on('session.start', async ($, e, next) => {
    const started = await next(e)
    void readStored($, trail)
    return started
  })

  on('session.end', ($, e, next) => {
    if (e.reason === 'clear' || e.reason === 'resume') {
      startOver(trail)
      void publishPosition($, trail)
    }
    return next(e)
  })

  on('session.append', ($, e, next) => {
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
    const { Box, Button, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="column">
        {beneath}
        <Box flexDirection="row" columnGap={1}>
          <Button key="prompt-jump:previous" hotkey="1" label="◀" onPress={() => jump($, trail, -1)} />
          {position === '' ? null : <Text dimColor>{position}</Text>}
          <Button key="prompt-jump:next" hotkey="2" label="▶" onPress={() => jump($, trail, 1)} />
        </Box>
      </Box>
    )
  })
}
