import type { On, ToolSpec } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import { MAX_PNG_BYTES, SHOW_IMAGE_TOOL, absolutePath, fileUrl, imageCells, nextSize, pngSize } from '../hooks/show-image'
import { failed, ok } from './support'

const HOME = '/home/person'
const CWD = '/work'
const CACHE = `${HOME}/.cache/sc-mods/images`
const CALL_ID = 'toolu_01'

/** A picture as sips reads it: its format and pixel size. */
type Picture = { format: string; width: number; height: number }

/** A file of the fake disk: its size, and the picture in it when it holds one. */
type DiskFile = { size: number; picture?: Picture; text?: string }

/** The head of a PNG of `width` by `height`, base64: the signature and the IHDR chunk, 8-bit RGBA. */
function pngHead(width: number, height: number): string {
  const word = (n: number) => String.fromCharCode((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
  return btoa('\x89PNG\r\n\x1a\n' + word(13) + 'IHDR' + word(width) + word(height) + '\x08\x06\x00\x00\x00' + word(0))
}

/** What sips's PNG of a picture weighs: 1.5 bytes a pixel. */
const pngBytes = (width: number, height: number) => Math.round(width * height * 1.5)

/** The pixel size sips gives a picture scaled so its longest side is `side`. */
function scaled({ width, height }: Picture, side: number | undefined): { width: number; height: number } {
  if (side === undefined) return { width, height }
  const ratio = side / Math.max(width, height)
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) }
}

type Decision = 'allow' | 'ask' | 'deny'

type MachineOptions = {
  /** What Claude Code's permission rules answer for a Read of each path; allow when not listed. */
  reads?: Record<string, Decision>
  /** What the person answers the question; undefined for a session with nobody to ask. */
  answer?: string
  canFind?: boolean
  hasSips?: boolean
}

/**
 * Stands for the machine beneath the plugin: a disk of `files`, the
 * permission rules and the person, and the mkdir, sips, cp and find it
 * runs. Returns the disk, every command run, the tools registered, the
 * paths whose Read was judged and the questions asked, in order.
 */
function machine(on: On, files: Record<string, DiskFile>, { reads = {}, answer, canFind = true, hasSips = true }: MachineOptions = {}) {
  const disk = new Map(Object.entries(files))
  const commands: string[][] = []
  const registered: ToolSpec[] = []
  const judged: string[] = []
  const byteReads: string[] = []
  const questions: string[] = []
  mock.env(on, { HOME })
  on('session.root', async () => ({ value: CWD }))
  on('tool.check', async (_$, e) => {
    const path = (e.input as { file_path: string }).file_path
    judged.push(`${e.tool}(${path})`)
    const decision = reads[path] ?? 'allow'
    return decision === 'deny' ? { decision, reason: 'Read(/secret/**)' } : { decision }
  })
  on('tool.call', { tool: 'AskUserQuestion' }, async (_$, e) => {
    const [question] = e.questions
    questions.push(question?.question ?? '')
    if (answer === undefined) return { deny: 'no one to ask' }
    return { result: { questions: e.questions, answers: { [question?.question ?? '']: answer } } } as never
  })
  on('ui.log', async () => ({ value: undefined }))
  on('tool.register', async (_$, e) => {
    registered.push(e)
    return { value: { tool: `mcp__sc-mods__${e.name}` } }
  })
  on('fs.stat', async (_$, e) => {
    const file = disk.get(e.path)
    return file === undefined ? { deny: 'ENOENT' } : { value: { kind: 'file', size: file.size, mtimeMs: 0, isLink: false } }
  })
  on('fs.read', async (_$, e) => {
    const file = disk.get(e.path)
    if (file === undefined) return { deny: 'ENOENT' }
    if (e.as === 'bytes') byteReads.push(e.path)
    if (e.as === 'bytes') return { value: { base64: file.picture ? pngHead(file.picture.width, file.picture.height) : '' } }
    return { value: file.text ?? '' }
  })
  on('fs.write', async (_$, e) => {
    disk.set(e.path, { size: e.text.length, text: e.text })
    return { value: undefined }
  })
  on('process.run', async (_$, e) => {
    const argv = [...e.argv]
    commands.push(argv)
    const [command] = argv
    if (command === 'sips' && argv[1] === '-v') return hasSips ? { value: ok('sips-316\n') } : { deny: 'sips: command not found' }
    if (command === 'sips' && argv[1] === '-g') {
      const picture = disk.get(argv.at(-1) ?? '')?.picture
      if (picture === undefined) return { value: ok(`${argv.at(-1)}\n  format: txt\n  pixelWidth: <nil>\n  pixelHeight: <nil>\n`) }
      return { value: ok(`${argv.at(-1)}\n  format: ${picture.format}\n  pixelWidth: ${picture.width}\n  pixelHeight: ${picture.height}\n`) }
    }
    if (command === 'sips') {
      const [input, out] = [argv[argv.indexOf('--out') - 1] ?? '', argv[argv.indexOf('--out') + 1] ?? '']
      const picture = disk.get(input)?.picture
      if (picture === undefined) return { value: { ...failed('Error: Cannot extract image from file.'), exitCode: 13 } }
      const sideAt = argv.indexOf('-Z')
      const size = scaled(picture, sideAt < 0 ? undefined : Number(argv[sideAt + 1]))
      disk.set(out, { size: pngBytes(size.width, size.height), picture: { format: 'png', ...size } })
      return { value: ok('') }
    }
    if (command === 'cp') {
      const file = disk.get(argv[1] ?? '')
      if (file === undefined) return { value: failed('cp: no such file') }
      disk.set(argv[2] ?? '', file)
      return { value: ok('') }
    }
    if (command === 'find' && !canFind) return { deny: 'find: command not found' }
    return { value: ok('') }
  })
  return { disk, commands, registered, judged, questions, byteReads }
}

const callShow = ($: Engine, args: Record<string, unknown>, tool_use_id = CALL_ID) =>
  $.tool.call({ tool: SHOW_IMAGE_TOOL, tool_use_id, ...args })

const mountRow = ($: Engine, surface: 'terminal' | 'desktop' = 'terminal', columns = 120) =>
  $.ui.mount({
    plugin: 'sc-mods',
    surface,
    component: 'ToolResult',
    requestId: CALL_ID,
    viewport: { columns, rows: 40 },
    props: { tool_use_id: CALL_ID, tool: SHOW_IMAGE_TOOL, output: 'Showed', isErrored: false },
  })

const sipsCalls = (commands: string[][]) => commands.filter(argv => argv[0] === 'sips' && argv[1] === '-s')

const recordOf = (disk: Map<string, DiskFile>) => JSON.parse(disk.get(`${CACHE}/${CALL_ID}.json`)?.text ?? 'null')

// --- Preparing the pictures ---------------------------------------------------

test('a PNG under the limit is copied as it is', async ($, on) => {
  const { disk, commands } = machine(on, { '/work/chart.png': { size: 50_000, picture: { format: 'png', width: 400, height: 200 } } })
  const answer = await callShow($, { paths: ['chart.png'], caption: 'p95 latency' })

  expect(answer.result).toBe('Showed 1 picture inline: chart.png.')
  expect(commands).toContainEqual(['cp', '/work/chart.png', `${CACHE}/${CALL_ID}-0.png`])
  expect(sipsCalls(commands)).toEqual([])
  expect(recordOf(disk)).toEqual({
    caption: 'p95 latency',
    size: 'medium',
    pictures: [{ source: 'chart.png', original: '/work/chart.png', png: `${CACHE}/${CALL_ID}-0.png`, width: 400, height: 200 }],
  })
})

test('a JPEG is converted to PNG at its own size', async ($, on) => {
  const { commands } = machine(on, { '/shots/a.jpg': { size: 100_000, picture: { format: 'jpeg', width: 800, height: 600 } } })
  const answer = await callShow($, { paths: ['/shots/a.jpg'] })

  expect(answer.result).toBe('Showed 1 picture inline: a.jpg.')
  expect(sipsCalls(commands)).toEqual([['sips', '-s', 'format', 'png', '/shots/a.jpg', '--out', `${CACHE}/${CALL_ID}-0.png`]])
})

test('a PNG over the limit is scaled down until it fits', async ($, on) => {
  const { disk, commands } = machine(on, { '/shots/big.png': { size: 5_000_000, picture: { format: 'png', width: 3000, height: 2000 } } })
  await callShow($, { paths: ['/shots/big.png'] })

  // 1600 px is 2.56 MB at the fake's weight; 1200 px fits.
  expect(sipsCalls(commands).map(argv => argv[argv.indexOf('-Z') + 1])).toEqual(['1600', '1200'])
  const png = disk.get(`${CACHE}/${CALL_ID}-0.png`)
  expect(png?.size).toBeLessThanOrEqual(MAX_PNG_BYTES)
  expect(recordOf(disk).pictures[0]).toMatchObject({ width: 1200, height: 800 })
})

test('a web URL is refused without a request, and the model is told to save it first', async ($, on) => {
  const { commands, judged } = machine(on, { '/work/ok.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } } })
  const answer = await callShow($, { paths: ['/work/ok.png', 'https://example.com/logo.png'] })

  expect(answer.result).toBe(
    [
      'Showed 1 picture inline: ok.png.',
      'Could not show https://example.com/logo.png: show_image shows local files only; save the picture to a file with your own tools (for example Bash) first, then pass the saved path.',
    ].join('\n'),
  )
  expect(commands.some(argv => argv.includes('https://example.com/logo.png'))).toBe(false)
  expect(judged).toEqual(['Read(/work/ok.png)'])
})

test('a file:// URL is read as its path', async ($, on) => {
  const { commands } = machine(on, { '/shots/my shot.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } } })
  const answer = await callShow($, { paths: ['file:///shots/my%20shot.png'] })
  expect(answer.result).toBe('Showed 1 picture inline: my shot.png.')
  expect(commands).toContainEqual(['cp', '/shots/my shot.png', `${CACHE}/${CALL_ID}-0.png`])
})

// --- Permission --------------------------------------------------------------------

test('each file is judged as a Read, and a file the rules deny is not read', async ($, on) => {
  const { commands, judged, questions } = machine(
    on,
    { '/work/ok.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } }, '/secret/key.png': { size: 10_000, picture: { format: 'png', width: 1, height: 1 } } },
    { reads: { '/secret/key.png': 'deny' } },
  )
  const answer = await callShow($, { paths: ['ok.png', '/secret/key.png'] })

  expect(judged).toEqual(['Read(/work/ok.png)', 'Read(/secret/key.png)'])
  expect(answer.result).toContain("Could not show key.png: Claude Code's permission rules do not allow reading it (Read(/secret/**)).")
  expect(commands.some(argv => argv.includes('/secret/key.png'))).toBe(false)
  expect(questions).toEqual([])
})

test('files the rules ask about are put to the person in one question', async ($, on) => {
  const files = {
    '/tmp/a.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } },
    '/tmp/b.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } },
  }
  const { commands, questions } = machine(on, files, { reads: { '/tmp/a.png': 'ask', '/tmp/b.png': 'ask' }, answer: 'Yes' })
  const answer = await callShow($, { paths: ['/tmp/a.png', '/tmp/b.png'] })

  expect(questions).toEqual(['Let Claude show you a.png, b.png? Claude Code asks before reading these files.'])
  expect(answer.result).toBe('Showed 2 pictures inline: a.png, b.png.')
  expect(commands.filter(argv => argv[0] === 'cp')).toHaveLength(2)
})

test('a file the person does not allow is not read', async ($, on) => {
  const { commands } = machine(on, { '/tmp/a.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } } }, { reads: { '/tmp/a.png': 'ask' }, answer: 'No' })
  const answer = await callShow($, { paths: ['/tmp/a.png'] })

  expect(answer.deny).toBe('Could not show a.png: the person did not allow reading it.')
  expect(commands.some(argv => argv.includes('/tmp/a.png'))).toBe(false)
})

test('where nobody can be asked, a file the rules ask about is refused', async ($, on) => {
  const { commands } = machine(on, { '/tmp/a.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } } }, { reads: { '/tmp/a.png': 'ask' } })
  const answer = await callShow($, { paths: ['/tmp/a.png'] })

  expect(answer.deny).toBe('Could not show a.png: Claude Code asks before reading it, and no one answered.')
  expect(commands.some(argv => argv.includes('/tmp/a.png'))).toBe(false)
})

test('a missing file and a file that is no picture fail alone, each with its reason', async ($, on) => {
  const { disk } = machine(on, {
    '/work/ok.png': { size: 10_000, picture: { format: 'png', width: 100, height: 100 } },
    '/work/notes.txt': { size: 10 },
  })
  const answer = await callShow($, { paths: ['ok.png', 'gone.png', 'notes.txt'] })

  expect(answer.result).toBe(
    ['Showed 1 picture inline: ok.png.', 'Could not show gone.png: file not found.', 'Could not show notes.txt: not a picture sips can read.'].join('\n'),
  )
  expect(recordOf(disk).pictures.map((picture: { error?: string }) => picture.error)).toEqual([
    undefined,
    'file not found',
    'not a picture sips can read',
  ])
})

test('a call where every picture fails is an error the model reads', async ($, on) => {
  machine(on, { '/work/notes.txt': { size: 10 } })
  const answer = await callShow($, { paths: ['gone.png', 'notes.txt'] })

  expect(answer.deny).toBe(['Could not show gone.png: file not found.', 'Could not show notes.txt: not a picture sips can read.'].join('\n'))
})

test('a call without paths is refused', async ($, on) => {
  machine(on, {})
  const answer = await callShow($, { paths: [] })
  expect(answer.deny).toContain('paths must be a non-empty array')
})

// --- Session start ---------------------------------------------------------------

test('session start registers the tool and prunes pictures older than 30 days', async ($, on) => {
  const { commands, registered } = machine(on, {})
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })

  expect(registered.map(tool => [tool.name, tool.isDeferred])).toEqual([['show_image', false]])
  expect(registered[0]?.inputSchema).toMatchObject({ required: ['paths'] })
  expect(commands).toContainEqual(['find', CACHE, '-type', 'f', '-mtime', '+30', '-delete'])
})

test('without sips the tool is not registered', async ($, on) => {
  const { registered } = machine(on, {}, { hasSips: false })
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })
  expect(registered).toEqual([])
})

test('a failed prune does not fail the session start', async ($, on) => {
  machine(on, {}, { canFind: false })
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  expect(await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })).toEqual({ cwd: CWD })
})

// --- The row ---------------------------------------------------------------------

const WIDE = { size: 10_000, picture: { format: 'png', width: 1600, height: 400 } }
const TALL = { size: 10_000, picture: { format: 'png', width: 200, height: 400 } }

async function showPictures($: Engine, on: On, paths: string[] = ['wide.png', 'tall.png']) {
  const world = machine(on, { '/work/wide.png': WIDE, '/work/tall.png': TALL, '/work/odd #1?.png': TALL })
  await callShow($, { paths, caption: 'before and after' })
  return world
}

test('the row draws each picture with its aspect kept and a numbered label under it', async ($, on) => {
  await showPictures($, on)
  const row = await mountRow($)

  const images = await row.findAll({ type: 'Image' })
  expect(images.map(image => [image.props.columns, image.props.rows])).toEqual([
    [81, 10],
    [24, 24],
  ])
  expect(images.map(image => image.props.alt)).toEqual(['/work/wide.png', '/work/tall.png'])
  expect(images[0]?.props.source).toEqual({ png: pngHead(1600, 400) })

  const links = await row.findAll({ type: 'Link' })
  // A Link's text leads with its href, then what it draws.
  expect(links.map(link => [link.props.href, link.text.slice(String(link.props.href).length)])).toEqual([
    ['file:///work/wide.png', 'wide.png ↗'],
    ['file:///work/tall.png', 'tall.png ↗'],
  ])
  const names = await row.findAll({ type: 'Text', text: /\.png$/ })
  expect(names.map(name => name.props)).toEqual([
    { underline: true, color: 'suggestion' },
    { underline: true, color: 'suggestion' },
  ])
  const numbers = await row.findAll({ type: 'Text', text: /^\d $/ })
  expect(numbers.map(number => [number.text, number.props.dimColor])).toEqual([
    ['1 ', true],
    ['2 ', true],
  ])
  expect(await row.find({ type: 'Text', text: 'before and after' })).toBeDefined()
  // The caption heads the row, above the first picture.
  expect((await row.findAll({ type: 'Text' }))[0]?.text).toBe('before and after')
  expect((await row.findAll({ type: 'Button' })).map(button => button.props.label)).toEqual(['Hide', 'size: medium'])
})

test('a call with no caption draws no caption line', async ($, on) => {
  machine(on, { '/work/wide.png': WIDE })
  await callShow($, { paths: ['wide.png'] })
  const row = await mountRow($)

  expect((await row.findAll({ type: 'Text' }))[0]?.text).toBe('wide.png')
})

test('a single picture has no number, and its link encodes the file name', async ($, on) => {
  await showPictures($, on, ['odd #1?.png'])
  const row = await mountRow($)

  expect(await row.findAll({ type: 'Text', text: /^\d $/ })).toEqual([])
  expect((await row.findAll({ type: 'Link' })).map(link => link.props.href)).toEqual(['file:///work/odd%20%231%3F.png'])
})

test('a failed picture keeps its place and number as a red line', async ($, on) => {
  await showPictures($, on, ['wide.png', 'gone.png'])
  const row = await mountRow($)

  expect(await row.findAll({ type: 'Image' })).toHaveLength(1)
  const failure = await row.find({ type: 'Text', text: 'gone.png: file not found' })
  expect(failure?.props.color).toBe('red')
  expect((await row.findAll({ type: 'Text', text: /^\d $/ })).map(number => number.text)).toEqual(['1 ', '2 '])
})

test('Hide collapses the row to one line, and Show brings the pictures back', async ($, on) => {
  await showPictures($, on)
  const row = await mountRow($)

  await row.press({ key: `show-image:visibility:${CALL_ID}` })
  expect(await row.findAll({ type: 'Image' })).toEqual([])
  expect(await row.findAll({ type: 'Link' })).toEqual([])
  expect(await row.find({ type: 'Text', text: '2 pictures hidden' })).toBeDefined()
  expect((await row.findAll({ type: 'Button' })).map(button => button.props.label)).toEqual(['Show'])

  await row.press({ key: `show-image:visibility:${CALL_ID}` })
  expect(await row.findAll({ type: 'Image' })).toHaveLength(2)
})

test('the size button cycles medium, large, small, medium', async ($, on) => {
  await showPictures($, on)
  const row = await mountRow($)
  const sizeKey = `show-image:size:${CALL_ID}`
  const firstCells = async () => {
    const [image] = await row.findAll({ type: 'Image' })
    return [image?.props.columns, image?.props.rows]
  }

  const seen: unknown[] = []
  for (let press = 0; press < 3; press += 1) {
    await row.press({ key: sizeKey })
    seen.push([(await row.find({ key: sizeKey }))?.props.label, ...(await firstCells())])
  }
  // Each size takes its share of the 120-column view less 4: all, 40% and 70%.
  expect(seen).toEqual([
    ['size: large', 116, 15],
    ['size: small', 46, 6],
    ['size: medium', 81, 10],
  ])
})

test('a redraw reads no PNG again', async ($, on) => {
  const { byteReads } = await showPictures($, on)
  const row = await mountRow($)
  const readsBefore = byteReads.length
  await row.press({ key: `show-image:size:${CALL_ID}` })
  expect(await row.findAll({ type: 'Image' })).toHaveLength(2)
  expect(byteReads.length).toBe(readsBefore)
})

test('a row whose call left no record draws as the engine does', async ($, on) => {
  machine(on, {})
  on('ui.render', async () => ({ type: 'Text', props: {}, children: ['engine row'] }) as never)
  const row = await mountRow($)
  expect(await row.find({ type: 'Text', text: 'engine row' })).toBeDefined()
  expect(await row.findAll({ type: 'Image' })).toEqual([])
})

test('on the desktop the row lists the caption and paths as text', async ($, on) => {
  await showPictures($, on)
  const row = await mountRow($, 'desktop')
  const texts = (await row.findAll({ type: 'Text' })).map(text => text.text)
  expect(texts).toEqual(['before and after', '/work/wide.png', '/work/tall.png'])
})

// --- Sizes, paths and PNG headers -----------------------------------------------------

test('a picture keeps its aspect inside each size, the view and its own pixels', () => {
  expect(imageCells({ width: 1600, height: 900 }, 'small')).toEqual({ columns: 40, rows: 11 })
  expect(imageCells({ width: 1600, height: 400 }, 'large', 80)).toEqual({ columns: 76, rows: 10 })
  expect(imageCells({ width: 1600, height: 400 }, 'medium', 8)).toEqual({ columns: 7, rows: 1 })
  // A 256-pixel picture still grows from size to size.
  const sizes = (['small', 'medium', 'large'] as const).map(size => imageCells({ width: 256, height: 128 }, size, 104).columns)
  expect(sizes).toEqual([40, 70, 100])
  // A 32-pixel icon is enlarged at most about fourfold, not to the whole box.
  expect(imageCells({ width: 32, height: 32 }, 'large')).toEqual({ columns: 16, rows: 8 })
  expect(imageCells({}, 'medium')).toEqual({ columns: 70, rows: 24 })
  expect([nextSize('small'), nextSize('medium'), nextSize('large')]).toEqual(['medium', 'large', 'small'])
})

test('paths are made absolute and file links encode each segment', () => {
  expect(absolutePath('shots/a.png', '/work/', HOME)).toBe('/work/shots/a.png')
  expect(absolutePath('~/a.png', CWD, HOME)).toBe(`${HOME}/a.png`)
  expect(absolutePath('file:///tmp/a%20b.png', CWD, HOME)).toBe('/tmp/a b.png')
  expect(fileUrl('/tmp/a #1?.png')).toBe('file:///tmp/a%20%231%3F.png')
})

test('the pixel size is read from the PNG header', () => {
  expect(pngSize({ base64: pngHead(70000, 3) })).toEqual({ width: 70000, height: 3 })
  expect(() => pngSize({ base64: btoa('GIF89a not a png at all, padded out') })).toThrow('not a PNG')
})
