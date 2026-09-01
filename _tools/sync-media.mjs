/**
 * Copy the WordPress size variants from assets/images into wildkumaun/public/media.
 *
 * Only the variants — <name>-<w>x<h>.jpg, the responsive copies the mirrored
 * markup's srcset points at. Payload does not manage those, so nothing else puts
 * them on disk.
 *
 * The originals are deliberately NOT copied. Payload owns them: `npm run
 * import:media` creates a Media document per original and writes the file into
 * public/media itself, at the same /media/<filename> the pages already ask for.
 * Placing a static copy there first makes Payload find the name taken and save
 * its own as <name>-1.jpg instead — a duplicate of every image, under a name no
 * page references.
 *
 *   npm run mirror:media   # variants, no database needed
 *   npm run import:media   # originals, into Payload
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const SRC = path.join(ROOT, 'assets/images')
const DEST = path.join(ROOT, 'wildkumaun/public/media')

/** WordPress responsive copies are named for their dimensions: bedroom-img-1024x683.jpg */
const looksLikeVariant = (file) => /-\d{2,4}x\d{2,4}\.[a-z0-9]+$/i.test(file)

/** bedroom-img-1024x683.jpg -> bedroom-img.jpg */
const baseName = (file) => file.replace(/-\d{2,4}x\d{2,4}(\.[a-z0-9]+)$/i, '$1')

if (!fs.existsSync(SRC)) {
  console.error(`missing ${path.relative(ROOT, SRC)} — run "node _tools/fetch-assets.mjs" first`)
  process.exit(1)
}

/**
 * A file is a byproduct only if the image it was cut from is here too. Eleven of
 * these have no original — the site's logo among them — and they are images in
 * their own right, so Payload owns them and this must not copy them in ahead of it.
 * Kept identical to the rule in wildkumaun/src/scripts/import-media.ts.
 */
const present = new Set(fs.readdirSync(SRC))
const isDerived = (file) => looksLikeVariant(file) && present.has(baseName(file))


fs.mkdirSync(DEST, { recursive: true })

let copied = 0
let current = 0
for (const entry of fs.readdirSync(SRC, { withFileTypes: true })) {
  if (!entry.isFile() || !isDerived(entry.name)) continue
  const from = path.join(SRC, entry.name)
  const to = path.join(DEST, entry.name)
  // Same size means same file here: these are fetched originals, never edited.
  if (fs.existsSync(to) && fs.statSync(to).size === fs.statSync(from).size) {
    current++
    continue
  }
  fs.copyFileSync(from, to)
  copied++
}

console.log(`size variants: ${copied} copied, ${current} already current -> wildkumaun/public/media`)
console.log('originals are owned by Payload — run "npm run import:media"')
