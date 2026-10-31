import type { On, ToolSpec } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'
import { MAX_PNG_BYTES, SHOW_IMAGE_TOOL, imageCells, nextSize, pngSize } from '../hooks/show-image'
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

/**
 * Stands for the machine beneath the plugin: a disk of `files`, the web's
 * `remote` files, and the mkdir, curl, sips, cp, rm and find it runs;
 * without `canFind`, find cannot start.
 * Returns the disk and every command run, in order.
 */
function machine(on: On, files: Record<string, DiskFile>, remote: Record<string, DiskFile> = {}, { canFind = true } = {}) {
  const disk = new Map(Object.entries(files))
  const commands: string[][] = []
  const registered: ToolSpec[] = []
  mock.env(on, { HOME })
  on('session.cwd', async () => ({ value: CWD }))
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
    if (command === 'curl') {
      const [out, url] = [argv[argv.indexOf('-o') + 1] ?? '', argv.at(-1) ?? '']
      const file = remote[url]
      if (file === undefined) return { value: { ...failed('curl: (22) The requested URL returned error: 404'), exitCode: 22 } }
      disk.set(out, file)
      return { value: ok('') }
    }
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
    if (command === 'rm') disk.delete(argv.at(-1) ?? '')
    return { value: ok('') }
  })
  return { disk, commands, registered }
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

test('a URL is downloaded, converted, and its download removed', async ($, on) => {
  const url = 'https://example.com/design.jpg'
  const { disk, commands } = machine(on, {}, { [url]: { size: 300_000, picture: { format: 'jpeg', width: 1024, height: 768 } } })
  const answer = await callShow($, { paths: [url] })

  const downloaded = `${CACHE}/${CALL_ID}-0.download`
  expect(answer.result).toBe(`Showed 1 picture inline: ${url}.`)
  expect(commands).toContainEqual(['curl', '-fsSL', '--max-time', '20', '-o', downloaded, url])
  expect(commands).toContainEqual(['rm', '-f', downloaded])
  expect(disk.has(downloaded)).toBe(false)
  expect(recordOf(disk).pictures[0]).toMatchObject({ original: url, png: `${CACHE}/${CALL_ID}-0.png`, width: 1024, height: 768 })
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
  machine(on, {})
  const answer = await callShow($, { paths: ['gone.png', 'https://example.com/missing.png'] })

  expect(answer.deny).toContain('Could not show gone.png: file not found.')
  expect(answer.deny).toContain('Could not show https://example.com/missing.png: download failed: curl: (22) The requested URL returned error: 404.')
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

test('a failed prune does not fail the session start', async ($, on) => {
  machine(on, {}, {}, { canFind: false })
  on('session.start', async (_$, e) => ({ cwd: e.cwd }))
  expect(await $.session.start({ cwd: CWD, surface: 'terminal', isInteractive: true })).toEqual({ cwd: CWD })
})

// --- The row ---------------------------------------------------------------------

async function showWide($: Engine, on: On) {
  machine(on, {
    '/work/wide.png': { size: 10_000, picture: { format: 'png', width: 800, height: 200 } },
    '/work/tall.png': { size: 10_000, picture: { format: 'png', width: 200, height: 400 } },
  })
  await callShow($, { paths: ['wide.png', 'tall.png'], caption: 'before and after' })
}

test('the row draws each picture with its aspect kept, the caption, links and buttons', async ($, on) => {
  await showWide($, on)
  const row = await mountRow($)

  const images = await row.findAll({ type: 'Image' })
  expect(images.map(image => [image.props.columns, image.props.rows])).toEqual([
    [100, 13],
    [22, 22],
  ])
  expect(images.map(image => image.props.alt)).toEqual(['wide.png', 'tall.png'])
  expect(images[0]?.props.source).toEqual({ png: pngHead(800, 200) })
  expect(await row.find({ type: 'Text', text: 'before and after' })).toBeDefined()
  expect((await row.findAll({ type: 'Link' })).map(link => [link.props.href, link.props.label])).toEqual([
    ['file:///work/wide.png', 'wide.png'],
    ['file:///work/tall.png', 'tall.png'],
  ])
  expect((await row.findAll({ type: 'Button' })).map(button => button.props.label)).toEqual(['Hide', 'size: medium'])
})

test('Hide collapses the row to one line, and Show brings the pictures back', async ($, on) => {
  await showWide($, on)
  const row = await mountRow($)

  await row.press({ key: `show-image:visibility:${CALL_ID}` })
  expect(await row.findAll({ type: 'Image' })).toEqual([])
  expect(await row.find({ type: 'Text', text: '2 pictures hidden' })).toBeDefined()
  expect((await row.findAll({ type: 'Button' })).map(button => button.props.label)).toEqual(['Show'])

  await row.press({ key: `show-image:visibility:${CALL_ID}` })
  expect(await row.findAll({ type: 'Image' })).toHaveLength(2)
})

test('the size button cycles medium, large, small, medium', async ($, on) => {
  await showWide($, on)
  const row = await mountRow($)
  const sizeKey = `show-image:size:${CALL_ID}`
  const firstColumns = async () => (await row.findAll({ type: 'Image' }))[0]?.props.columns

  const seen: unknown[] = []
  for (let press = 0; press < 3; press += 1) {
    await row.press({ key: sizeKey })
    seen.push([(await row.find({ key: sizeKey }))?.props.label, await firstColumns()])
  }
  // Large is 120 columns at most, held to the 120-column view less 4.
  expect(seen).toEqual([
    ['size: large', 116],
    ['size: small', 60],
    ['size: medium', 100],
  ])
})

test('a row whose call left no record draws as the engine does', async ($, on) => {
  machine(on, {})
  on('ui.render', async () => ({ type: 'Text', props: {}, children: ['engine row'] }) as never)
  const row = await mountRow($)
  expect(await row.find({ type: 'Text', text: 'engine row' })).toBeDefined()
  expect(await row.findAll({ type: 'Image' })).toEqual([])
})

test('on the desktop the row lists the caption and paths as text', async ($, on) => {
  await showWide($, on)
  const row = await mountRow($, 'desktop')
  const texts = (await row.findAll({ type: 'Text' })).map(text => text.text)
  expect(texts).toEqual(['before and after', '/work/wide.png', '/work/tall.png'])
})

// --- Sizes and PNG headers -----------------------------------------------------------

test('a picture keeps its aspect inside each size and the view', () => {
  expect(imageCells({ width: 1600, height: 900 }, 'small')).toEqual({ columns: 43, rows: 12 })
  expect(imageCells({ width: 1600, height: 400 }, 'large', 80)).toEqual({ columns: 76, rows: 10 })
  expect(imageCells({ width: 1600, height: 400 }, 'medium', 8)).toEqual({ columns: 10, rows: 1 })
  expect(imageCells({}, 'medium')).toEqual({ columns: 100, rows: 22 })
  expect([nextSize('small'), nextSize('medium'), nextSize('large')]).toEqual(['medium', 'large', 'small'])
})

test('the pixel size is read from the PNG header', () => {
  expect(pngSize({ base64: pngHead(70000, 3) })).toEqual({ width: 70000, height: 3 })
  expect(() => pngSize({ base64: btoa('GIF89a not a png at all, padded out') })).toThrow('not a PNG')
})
