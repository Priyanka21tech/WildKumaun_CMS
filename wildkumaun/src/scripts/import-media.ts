/**
 * Import every image the site uses into the Media collection.
 *
 *   pnpm import:media
 *
 * Alt text comes from content/image-alts.json, which was lifted off the live
 * site's own <img> tags — better than anything derived from a filename, and the
 * only reason the bird photos named as UUIDs end up labelled with their species.
 *
 * Two kinds of file sit in assets/images:
 *
 *   originals      279 — the actual photographs and graphics
 *   size variants   58 — WordPress's responsive copies, <name>-<w>x<h>.jpg,
 *                        referenced only from srcset attributes
 *
 * Only the originals become documents. The variants are byproducts, not library
 * items, and 58 near-duplicates would make the admin panel unusable — Payload
 * generates its own sizes anyway. They are copied into public/media as plain
 * files so the pages still being served from the mirror keep resolving.
 *
 * Resume-safe: rerun any time, it skips what is already imported.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')
const IMAGES = path.join(REPO, 'assets/images')
const ALTS = path.join(REPO, 'content/image-alts.json')
const PUBLIC_MEDIA = path.resolve(dirname, '../../public/media')

/** WordPress responsive copies are named for their dimensions: bedroom-img-1024x683.jpg */
const looksLikeVariant = (file: string) => /-\d{2,4}x\d{2,4}\.[a-z0-9]+$/i.test(file)

/** bedroom-img-1024x683.jpg -> bedroom-img.jpg */
const baseName = (file: string) => file.replace(/-\d{2,4}x\d{2,4}(\.[a-z0-9]+)$/i, '$1')

/**
 * Not editorial content: the icon fonts Font Awesome and eicons ship as SVG and
 * the site's favicon. They are referenced from the stylesheet as fonts, not
 * placed on pages, so they would only clutter the library.
 */
const NOT_CONTENT = new Set([
  'eicons.svg',
  'fa-brands-400.svg',
  'fa-regular-400.svg',
  'fa-solid-900.svg',
  'fontawesome-webfont.svg',
  'favicon.ico',
])

/** Readable fallback for the files the markup carried no alt text for. */
const altFromFilename = (file: string) =>
  path.basename(file, path.extname(file)).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

const alts: Record<string, string> = JSON.parse(fs.readFileSync(ALTS, 'utf8'))

const payload = await getPayload({ config })

const files = fs.readdirSync(IMAGES).sort()
const content = files.filter((f) => !NOT_CONTENT.has(f))
/**
 * A file is a byproduct only if the image it was cut from is here too.
 *
 * Eleven files are named like responsive copies but have no original beside them
 * — the site's own logo among them, which exists solely as
 * wild-kumaon-logo-finale-1-300x219.png. Going by the name alone skipped all
 * eleven, so the logo never became a Media document and the header had nothing to
 * show. If there is no original, the file is the original.
 */
const present = new Set(content)
const isDerived = (f: string) => looksLikeVariant(f) && present.has(baseName(f))

const originals = content.filter((f) => !isDerived(f))
const variants = content.filter(isDerived)

console.log(
  `${files.length} files — ${originals.length} to import, ${variants.length} size variants, ` +
    `${files.length - content.length} skipped as non-content\n`,
)

let created = 0
let skipped = 0
const failed: Array<[string, string]> = []

for (const file of originals) {
  const existing = await payload.find({
    collection: 'media',
    where: { filename: { equals: file } },
    limit: 1,
    pagination: false,
  })

  if (existing.docs.length) {
    skipped++
    continue
  }

  try {
    await payload.create({
      collection: 'media',
      data: { alt: alts[file] ?? altFromFilename(file) },
      filePath: path.join(IMAGES, file),
    })
    created++
    if (created % 25 === 0) console.log(`   ${created} imported…`)
  } catch (err) {
    failed.push([file, err instanceof Error ? err.message : String(err)])
  }
}

// Responsive copies the mirrored markup's srcset points at. Payload never learns
// about these; they only need to sit next to the files it does manage.
fs.mkdirSync(PUBLIC_MEDIA, { recursive: true })
let copied = 0
for (const file of variants) {
  const src = path.join(IMAGES, file)
  const dest = path.join(PUBLIC_MEDIA, file)
  if (fs.existsSync(dest) && fs.statSync(dest).size === fs.statSync(src).size) continue
  fs.copyFileSync(src, dest)
  copied++
}

console.log(`\nmedia documents : ${created} created, ${skipped} already present`)
console.log(`size variants   : ${copied} copied, ${variants.length - copied} already current`)

if (failed.length) {
  console.log(`\n${failed.length} failed:`)
  for (const [file, msg] of failed) console.log(`   ${file} — ${msg}`)
}

process.exit(failed.length ? 1 : 0)
