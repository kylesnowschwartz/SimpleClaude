import { atom, memberOf, read, update } from 'claude-code'
import type { EngineInterface, FsBytes, On, ProcessRunResult, RenderInput } from 'claude-code'
import type { ImageSize, ImageView } from '../types'

export const SHOW_IMAGE_TOOL = 'mcp__sc-mods__show_image'
// A string literal names only the tools the types know, and plugin tools are not among them.
const SHOW_IMAGE_PATTERN = /^mcp__sc-mods__show_image$/

export const SIZES: readonly ImageSize[] = ['small', 'medium', 'large']
const DEFAULT_SIZE: ImageSize = 'medium'

/**
 * The room a picture takes at each size: a share of the row's width, and at
 * most this many rows. A share keeps the three sizes apart at any width.
 */
export const SIZE_BOXES: Record<ImageSize, { share: number; rows: number }> = {
  small: { share: 0.4, rows: 12 },
  medium: { share: 0.7, rows: 24 },
  large: { share: 1, rows: 40 },
}

// The row's indent plus a margin column on each side.
const GUTTER = 4
const MIN_COLUMNS = 10
// The row's width where the surface does not say.
const DEFAULT_ROOM = 100
// The fewest pixels of a picture one cell shows, so a small icon is enlarged at most about fourfold.
const PIXELS_PER_COLUMN = 2
const PIXELS_PER_ROW = 4

/** The most bytes an Image's `png` source may decode to. */
export const MAX_PNG_BYTES = 2 * 1024 * 1024
/** Longest sides, in pixels, tried in turn until the PNG fits MAX_PNG_BYTES. */
export const SCALE_STEPS = [1600, 1200, 800, 512, 256]
const KEEP_DAYS = 30

const CONVERT_TIMEOUT_MS = 30_000
const SHORT_TIMEOUT_MS = 10_000

// Enough for every picture on a screen or two of the conversation.
const MAX_CACHED_PICTURES = 32

const WEB_URL = /^https?:\/\//i
const FILE_URL = /^file:\/\//i

// A theme color the terminal draws in its accent blue.
const LINK_COLOR = 'suggestion'

const WEB_URL_ERROR =
  'show_image shows local files only; save the picture to a file with your own tools (for example Bash) first, then pass the saved path'

/** One picture of a call: where it came from, the PNG made for it and its pixel size, or why there is none. */
export type ShownPicture = {
  /** The path as Claude gave it. */
  source: string
  /** The file's absolute path. */
  original: string
  png?: string
  width?: number
  height?: number
  error?: string
}

/** What one call showed, kept beside its PNGs so the row draws again after a resume. */
export type ShownPictures = { caption?: string; size: ImageSize; pictures: ShownPicture[] }

const IMAGE_VIEW = atom({ plugin: 'sc-mods', key: 'imageView' } as const, { isHidden: false, size: '' })

const TOOL_DESCRIPTION = [
  'Show pictures to the person inline in the conversation: screenshots, charts, diagrams, designs, generated images, or any other picture file.',
  "The pictures are drawn in this tool's result row in the person's terminal. The pixels are not returned to you, so this tool does not let you see a picture; read the file for that.",
  'paths: local files only, given as absolute paths. A relative path is read from the folder the session started in, and a file:// URL is read as its path. An http or https URL is refused: save the picture to a file with your own tools (for example Bash) first, then pass the saved path. Claude Code asks the person before it shows a file it would ask about for Read. Any format macOS sips reads works (PNG, JPEG, GIF, HEIC, TIFF, WebP and more); large pictures are scaled down.',
  'caption: optional; one line shown above the pictures. Leave it out unless it tells the person something the file names do not.',
  'size: "small" for icons, thumbnails, or a quick look at several pictures; "medium" (the default) for most screenshots and charts; "large" when detail matters, such as a full-page screenshot or a dense chart. The person can change the size and hide the pictures from the row.',
].join('\n\n')

const INPUT_SCHEMA = {
  type: 'object',
  properties: {
    paths: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      description: 'Absolute paths of local picture files, shown in this order.',
    },
    caption: { type: 'string', description: 'Optional line shown above the pictures.' },
    size: { type: 'string', enum: SIZES, description: 'How large the pictures are drawn; medium when not given.' },
  },
  required: ['paths'],
}

// --- Sizes ------------------------------------------------------------------

const isSize = (value: unknown): value is ImageSize => SIZES.includes(value as ImageSize)

/** The size after `size` on the size button: small, medium, large, then small again. */
export const nextSize = (size: ImageSize): ImageSize => SIZES[(SIZES.indexOf(size) + 1) % SIZES.length] ?? DEFAULT_SIZE

/**
 * The cells a picture of `width` by `height` pixels takes at `size`, its
 * aspect ratio kept: the size's share of the row's width, narrower when that
 * would be taller than the size's rows or would enlarge the picture past
 * PIXELS_PER_COLUMN and PIXELS_PER_ROW. Without pixel sizes, the whole box.
 */
export function imageCells(picture: Pick<ShownPicture, 'width' | 'height'>, size: ImageSize, viewportColumns?: number) {
  const box = SIZE_BOXES[size]
  const room = viewportColumns === undefined ? DEFAULT_ROOM : Math.max(MIN_COLUMNS, viewportColumns - GUTTER)
  const wide = Math.min(255, Math.max(1, Math.round(room * box.share)))
  const { width, height } = picture
  if (!width || !height) return { columns: wide, rows: box.rows }

  const columns = Math.min(wide, Math.ceil(width / PIXELS_PER_COLUMN))
  const maxRows = Math.min(box.rows, Math.ceil(height / PIXELS_PER_ROW))
  // A cell is about twice as tall as it is wide.
  const rows = (columns * height) / width / 2
  if (rows <= maxRows) return { columns, rows: Math.max(1, Math.round(rows)) }
  return { columns: Math.max(1, Math.min(columns, Math.round((maxRows * 2 * width) / height))), rows: maxRows }
}

// --- Files --------------------------------------------------------------------

/** The width and height a PNG's IHDR chunk gives: big-endian at bytes 16 to 23. */
export function pngSize({ base64 }: FsBytes): { width: number; height: number } {
  // 32 base64 characters decode to the first 24 bytes.
  const head = atob(base64.slice(0, 32))
  if (head.length < 24 || !head.startsWith('\x89PNG\r\n\x1a\n') || head.slice(12, 16) !== 'IHDR') {
    throw new Error('the converted file is not a PNG')
  }
  const at = (offset: number) =>
    ((head.charCodeAt(offset) << 24) | (head.charCodeAt(offset + 1) << 16) | (head.charCodeAt(offset + 2) << 8) | head.charCodeAt(offset + 3)) >>> 0
  return { width: at(16), height: at(20) }
}

/** The folder of the prepared PNGs and each call's record: `${XDG_CACHE_HOME:-$HOME/.cache}/sc-mods/images`. */
async function cacheFolder($: EngineInterface): Promise<string> {
  const cacheHome = (await $.env.get('XDG_CACHE_HOME'))?.trim()
  if (cacheHome) return `${cacheHome}/sc-mods/images`
  const home = await $.env.get('HOME')
  if (!home) throw new Error('neither XDG_CACHE_HOME nor HOME is set')
  return `${home}/.cache/sc-mods/images`
}

/** A file name from a tool_use_id; the ids are letters, digits and `_`. */
const stemOf = (toolUseId: string) => toolUseId.replace(/[^A-Za-z0-9_-]/g, '_')

const recordPath = (folder: string, toolUseId: string) => `${folder}/${stemOf(toolUseId)}.json`

const fileName = (path: string) => path.replace(/\/+$/, '').split('/').pop() || path

const lastLine = (text: string) => text.trim().split('\n').pop()?.trim() || undefined

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * A path Claude gave, made absolute: a `file://` URL's path, `~/` from HOME,
 * and anything else not absolute from the folder the session started in.
 */
export function absolutePath(path: string, root: string, home: string | undefined): string {
  if (FILE_URL.test(path)) return decodeURIComponent(new URL(path).pathname)
  if (path.startsWith('/')) return path
  if (home && (path === '~' || path.startsWith('~/'))) return home + path.slice(1)
  return `${root.replace(/\/+$/, '')}/${path.replace(/^\.\//, '')}`
}

/** A `file://` URL of an absolute path, each segment encoded so `#`, `?` and spaces stay part of the name. */
export const fileUrl = (path: string) => `file://${path.split('/').map(encodeURIComponent).join('/')}`

// --- Permission -------------------------------------------------------------------

/**
 * Asks Claude Code's permission rules about reading each file, as they
 * would judge a Read of it, and the person about every file the rules ask
 * about, in one question. Returns, per file, undefined where it may be
 * read, else why not. Where nobody can be asked (a `-p` run), an ask is a
 * refusal.
 */
async function readPermissions($: EngineInterface, files: readonly string[]): Promise<Array<string | undefined>> {
  const verdicts = await Promise.all(
    files.map(file =>
      $.tool.check({ tool: 'Read', input: { file_path: file } }).catch(error => ({ decision: 'deny' as const, reason: messageOf(error) })),
    ),
  )
  const asked = files.filter((_file, index) => verdicts[index]?.decision === 'ask')
  const answer = asked.length === 0 ? undefined : await askToShow($, asked)

  return verdicts.map(verdict => {
    if (verdict.decision === 'allow') return undefined
    if (verdict.decision === 'ask') return answer
    return `Claude Code's permission rules do not allow reading it${verdict.reason ? ` (${verdict.reason})` : ''}`
  })
}

/** Undefined when the person lets Claude show the files, else why not. */
async function askToShow($: EngineInterface, files: readonly string[]): Promise<string | undefined> {
  const names = files.map(fileName).join(', ')
  try {
    const answer = await $.ui.ask(`Let Claude show you ${names}? Claude Code asks before reading ${files.length === 1 ? 'this file' : 'these files'}.`, {
      header: 'Pictures',
      options: ['Yes', 'No'],
    })
    return answer === 'Yes' ? undefined : 'the person did not allow reading it'
  } catch {
    return 'Claude Code asks before reading it, and no one answered'
  }
}

// --- Preparing a picture ----------------------------------------------------------

type Run = (argv: readonly string[], timeoutMs?: number) => Promise<ProcessRunResult>

const runnerFor =
  ($: EngineInterface): Run =>
  (argv, timeoutMs = SHORT_TIMEOUT_MS) =>
    $.process.run(argv, { timeoutMs })

async function fileSize($: EngineInterface, path: string): Promise<number> {
  const stat = await $.fs.stat(path).catch(() => undefined)
  if (stat === undefined) throw new Error('file not found')
  if (stat.kind !== 'file') throw new Error('not a file')
  return stat.size
}

type Probe = { format: string; width: number; height: number }

/** The format and pixel size sips reads in a file; a file without a pixel size is no picture. */
async function probe(run: Run, path: string): Promise<Probe> {
  const { exitCode, stdout, stderr } = await run(['sips', '-g', 'format', '-g', 'pixelWidth', '-g', 'pixelHeight', path])
  if (exitCode !== 0) throw new Error(`sips could not read it: ${lastLine(stderr) ?? `exit ${exitCode}`}`)

  const width = Number(/pixelWidth: (\d+)/.exec(stdout)?.[1])
  const height = Number(/pixelHeight: (\d+)/.exec(stdout)?.[1])
  if (!(width > 0 && height > 0)) throw new Error('not a picture sips can read')
  return { format: /format: (\S+)/.exec(stdout)?.[1]?.toLowerCase() ?? '', width, height }
}

/**
 * Writes `png` from `input`: a copy of a PNG that already fits MAX_PNG_BYTES,
 * else sips's PNG at the first of SCALE_STEPS (or the picture's own size,
 * when smaller) that fits. sips scales up as readily as down, so no step
 * above the picture's longest side is tried.
 */
async function makePng($: EngineInterface, run: Run, input: string, inputBytes: number, found: Probe, png: string) {
  const isPng = found.format === 'png'
  if (isPng && inputBytes <= MAX_PNG_BYTES) {
    const { exitCode, stderr } = await run(['cp', input, png])
    if (exitCode !== 0) throw new Error(`could not copy it: ${lastLine(stderr) ?? `exit ${exitCode}`}`)
    return
  }

  const longest = Math.max(found.width, found.height)
  const sides = [Math.min(longest, SCALE_STEPS[0] ?? longest), ...SCALE_STEPS.slice(1).filter(side => side < longest)]
  for (const side of new Set(sides)) {
    const scale = side < longest ? ['-Z', String(side)] : []
    // A PNG at its own size is the file that did not fit.
    if (isPng && scale.length === 0) continue

    const { exitCode, stderr } = await run(['sips', '-s', 'format', 'png', ...scale, input, '--out', png], CONVERT_TIMEOUT_MS)
    if (exitCode !== 0) throw new Error(`sips could not convert it: ${lastLine(stderr) ?? `exit ${exitCode}`}`)
    if ((await fileSize($, png)) <= MAX_PNG_BYTES) return
  }
  throw new Error(`too large to show, even at ${SCALE_STEPS.at(-1)} px`)
}

async function preparePicture($: EngineInterface, run: Run, original: string, png: string) {
  const inputBytes = await fileSize($, original)
  await makePng($, run, original, inputBytes, await probe(run, original), png)
  return { png, ...pngSize(await $.fs.read(png, { as: 'bytes' })) }
}

type ShowRequest = { paths: string[]; caption: string | undefined; size: ImageSize }

/** The call's arguments, or what is wrong with them. */
function requestOf(e: Record<string, unknown>): ShowRequest | string {
  const { paths, caption, size } = e
  if (!Array.isArray(paths) || paths.length === 0 || !paths.every(path => typeof path === 'string' && path.trim() !== '')) {
    return 'paths must be a non-empty array of file paths'
  }
  if (caption !== undefined && typeof caption !== 'string') return 'caption must be a string'
  if (size !== undefined && !isSize(size)) return `size must be one of ${SIZES.join(', ')}`
  return { paths: paths.map(path => path.trim()), caption: caption?.trim() || undefined, size: size ?? DEFAULT_SIZE }
}

const pictureName = ({ source, original }: ShownPicture) => (WEB_URL.test(source) ? source : fileName(original))

/** The line the model reads: what was shown, and why any picture was not. */
function summaryOf({ pictures }: ShownPictures): string {
  const shown = pictures.filter(picture => picture.error === undefined)
  const failed = pictures.filter(picture => picture.error !== undefined)
  const lines: string[] = []
  if (shown.length > 0) {
    const noun = shown.length === 1 ? 'picture' : 'pictures'
    lines.push(`Showed ${shown.length} ${noun} inline: ${shown.map(pictureName).join(', ')}.`)
  }
  for (const picture of failed) lines.push(`Could not show ${pictureName(picture)}: ${picture.error}.`)
  return lines.join('\n')
}

async function show($: EngineInterface, toolUseId: string, request: ShowRequest): Promise<ShownPictures> {
  const run = runnerFor($)
  const folder = await cacheFolder($)
  const made = await run(['mkdir', '-p', folder])
  if (made.exitCode !== 0) throw new Error(`could not make ${folder}: ${lastLine(made.stderr) ?? `exit ${made.exitCode}`}`)

  const [root, home] = [await $.session.root(), await $.env.get('HOME')]
  const local = request.paths.filter(source => !WEB_URL.test(source))
  const originals = local.map(source => absolutePath(source, root, home))
  const refusals = await readPermissions($, originals)
  const refusalOf = new Map(originals.map((original, index) => [original, refusals[index]]))

  const stem = stemOf(toolUseId)
  const pictures = await Promise.all(
    request.paths.map(async (source, index): Promise<ShownPicture> => {
      if (WEB_URL.test(source)) return { source, original: source, error: WEB_URL_ERROR }
      const original = absolutePath(source, root, home)
      const refusal = refusalOf.get(original)
      if (refusal !== undefined) return { source, original, error: refusal }
      try {
        return { source, original, ...(await preparePicture($, run, original, `${folder}/${stem}-${index}.png`)) }
      } catch (error) {
        return { source, original, error: messageOf(error) }
      }
    }),
  )
  const shown: ShownPictures = { ...(request.caption ? { caption: request.caption } : {}), size: request.size, pictures }
  await $.fs.write(recordPath(folder, toolUseId), JSON.stringify(shown, null, 2))
  return shown
}

/** Deletes prepared pictures and records older than KEEP_DAYS; a folder not there yet is nothing to do. */
async function pruneCache($: EngineInterface) {
  try {
    const folder = await cacheFolder($)
    await $.process.run(['find', folder, '-type', 'f', '-mtime', `+${KEEP_DAYS}`, '-delete'], { timeoutMs: SHORT_TIMEOUT_MS })
  } catch (error) {
    $.ui.log(`sc-mods: could not prune the picture cache: ${messageOf(error)}`, { to: 'debug' })
  }
}

/** Whether sips runs here; the tool needs it to read and convert pictures, and only macOS has it. */
async function hasSips($: EngineInterface): Promise<boolean> {
  try {
    return (await $.process.run(['sips', '-v'], { timeoutMs: SHORT_TIMEOUT_MS })).exitCode === 0
  } catch {
    return false
  }
}

// --- The row ----------------------------------------------------------------------

function isShownPictures(value: unknown): value is ShownPictures {
  const record = value as Partial<ShownPictures> | null
  return typeof record === 'object' && record !== null && isSize(record.size) && Array.isArray(record.pictures)
}

async function readShown($: EngineInterface, toolUseId: string): Promise<ShownPictures | undefined> {
  try {
    const parsed: unknown = JSON.parse(await $.fs.read(recordPath(await cacheFolder($), toolUseId)))
    return isShownPictures(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

/**
 * The PNGs read lately, base64 by path, so a redraw does not read them
 * again. A prepared PNG never changes under its path. Past
 * MAX_CACHED_PICTURES the least recently used goes.
 */
const pngCache = new Map<string, string>()

async function pngOf($: EngineInterface, path: string): Promise<string | undefined> {
  const cached = pngCache.get(path)
  if (cached !== undefined) {
    pngCache.delete(path)
    pngCache.set(path, cached)
    return cached
  }
  try {
    const { base64 } = await $.fs.read(path, { as: 'bytes' })
    pngCache.set(path, base64)
    // A Map iterates in insertion order, so its first key is the least recently used.
    const [oldest] = pngCache.keys()
    if (pngCache.size > MAX_CACHED_PICTURES && oldest !== undefined) pngCache.delete(oldest)
    return base64
  } catch {
    return undefined
  }
}

/** Each picture's PNG as base64, or undefined where it failed or its file is gone. */
const pixelsOf = ($: EngineInterface, pictures: ShownPicture[]) =>
  Promise.all(pictures.map(picture => (picture.png === undefined ? undefined : pngOf($, picture.png))))

type ViewInput = Pick<RenderInput, 'requestId'>

const viewOf = ($: EngineInterface, e: ViewInput) => read($, memberOf(IMAGE_VIEW, e))

const changeView = ($: EngineInterface, e: ViewInput, change: (view: ImageView) => ImageView) => update($, memberOf(IMAGE_VIEW, e), change)

/**
 * A `show_image` tool Claude calls to show local picture files to the
 * person, drawn in the tool's own result row.
 *
 * The call asks Claude Code's permission rules about each file as a Read,
 * turns each picture into a PNG that fits an Image's byte limit and keeps
 * it, with a record of the call, in the cache folder under the call's
 * tool_use_id; the row draws from those files, so it draws again after a
 * resume. Each picture has a label line under it; the row's buttons hide
 * the pictures and step through the sizes, kept per row in `imageView`.
 *
 * `startShowImage` runs once the session has started.
 */
export function registerShowImage(on: On) {
  on('tool.call', { tool: SHOW_IMAGE_PATTERN }, async ($, e) => {
    const request = requestOf(e as Record<string, unknown>)
    if (typeof request === 'string') return { deny: request }

    const shown = await show($, e.tool_use_id, request)
    const summary = summaryOf(shown)
    return shown.pictures.every(picture => picture.error !== undefined) ? { deny: summary } : { result: summary }
  }).catch((_$, _e, next) => ({ deny: `show_image failed: ${next.error.message ?? next.error.kind}` }))

  on('ui.render', { component: 'ToolResult', props: { tool: SHOW_IMAGE_TOOL } }, async ($, e, next) => {
    if (e.props.isErrored) return next(e)
    const shown = await readShown($, e.props.tool_use_id)
    if (shown === undefined) return next(e)

    const { Box, Text } = $.ui.resolve(e)
    if (e.surface !== 'terminal') {
      return (
        <Box flexDirection="column">
          {shown.caption ? <Text>{shown.caption}</Text> : null}
          {shown.pictures.map((picture, index) => (
            <Text key={`show-image:path:${index}`} dimColor={picture.error === undefined} color={picture.error === undefined ? undefined : 'red'}>
              {picture.error === undefined ? picture.original : `${picture.original}: ${picture.error}`}
            </Text>
          ))}
        </Box>
      )
    }

    const { Button, Image, Link } = $.ui.resolve(e)
    const id = e.props.tool_use_id
    const view = await viewOf($, e)
    const visibility = (
      <Button
        key={`show-image:visibility:${id}`}
        label={view.isHidden ? 'Show' : 'Hide'}
        onPress={() => changeView($, e, current => ({ ...current, isHidden: !current.isHidden }))}
      />
    )

    if (view.isHidden) {
      const noun = shown.pictures.length === 1 ? 'picture' : 'pictures'
      return (
        <Box flexDirection="row" columnGap={1}>
          <Text dimColor>
            {shown.pictures.length} {noun} hidden
          </Text>
          {visibility}
        </Box>
      )
    }

    const size = isSize(view.size) ? view.size : shown.size
    const pixels = await pixelsOf($, shown.pictures)
    const isNumbered = shown.pictures.length > 1
    return (
      <Box flexDirection="column">
        {shown.caption ? <Text>{shown.caption}</Text> : null}
        {shown.pictures.map((picture, index) => {
          const base64 = pixels[index]
          const number = isNumbered ? <Text dimColor>{`${index + 1} `}</Text> : null
          if (base64 === undefined) {
            return (
              <Box key={`show-image:picture:${index}`} flexDirection="row">
                {number}
                <Text color="red">
                  {pictureName(picture)}: {picture.error ?? 'the prepared picture is gone from the cache'}
                </Text>
              </Box>
            )
          }
          const { columns, rows } = imageCells(picture, size, e.viewport?.columns)
          return (
            <Box key={`show-image:picture:${index}`} flexDirection="column">
              <Image key={`show-image:${id}:${index}`} source={{ png: base64 }} columns={columns} rows={rows} alt={picture.original} />
              <Box flexDirection="row">
                {number}
                <Link href={fileUrl(picture.original)}>
                  <Text underline color={LINK_COLOR}>
                    {fileName(picture.original)}
                  </Text>
                  <Text color={LINK_COLOR}> ↗</Text>
                </Link>
              </Box>
            </Box>
          )
        })}
        <Box flexDirection="row" columnGap={1}>
          {visibility}
          <Button
            key={`show-image:size:${id}`}
            label={`size: ${size}`}
            onPress={() => changeView($, e, current => ({ ...current, size: nextSize(isSize(current.size) ? current.size : shown.size) }))}
          />
        </Box>
      </Box>
    )
  })
}

/** Registers the tool where sips runs, and prunes the cache, once the session has started. */
export async function startShowImage($: EngineInterface) {
  await Promise.all([registerTool($), pruneCache($)])
}

async function registerTool($: EngineInterface) {
  if (!(await hasSips($))) {
    $.ui.log('sc-mods: sips is not on this machine, so show_image is not registered', { to: 'debug' })
    return
  }
  try {
    await $.tool.register({ name: 'show_image', description: TOOL_DESCRIPTION, inputSchema: INPUT_SCHEMA, isDeferred: false })
  } catch (error) {
    $.ui.log(`sc-mods: could not register show_image: ${messageOf(error)}`, { to: 'debug' })
  }
}
