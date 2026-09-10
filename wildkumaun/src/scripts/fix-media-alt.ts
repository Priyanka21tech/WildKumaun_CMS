/**
 * Replace filename-derived alt text in the Media collection with real words.
 *
 * import-media.ts sets `alt` when a file is first brought in, falling back to a
 * tidied-up filename when it has nothing better. That fallback is what most of
 * the library ended up with — "work from hills 1024x683", "wild-kumaon-logo-
 * finale" — text that is present, so nothing flags it, and useless to anyone
 * listening to it.
 *
 * The better words already exist. Elementor stored a title on every lightbox
 * link, _tools/extract-image-alts.mjs harvested them into
 * content/image-alts.json, and src/lib/image-alt.ts is what reads that map for
 * the mirrored pages. This points the CMS at the same map, so a photograph is
 * described identically whether the page renders it from the mirror or from a
 * gallery block.
 *
 * Only alt text that still looks like a filename is replaced. Anything a person
 * has written is left alone — this runs more than once, and it must never undo
 * an editor's work.
 *
 * Run:  npm run fix:media-alt
 */
import { getPayload } from 'payload'
import config from '@payload-config'

import { altForFile, tidyAlt, LOGO_ALT } from '../lib/image-alt'

/**
 * Alt text nobody would have typed on purpose.
 *
 * A filename with the extension taken off and the hyphens turned to spaces —
 * "wild kumaon logo finale", "work from hills 1024x683" — or one still carrying
 * its hyphens or its size suffix. Real sentences have spaces and no dimensions.
 */
function looksDerived(alt: string, filename: string): boolean {
  const text = alt.trim()
  if (!text) return true

  // Carries a pixel size: "…1024x683".
  if (/\b\d{2,4}\s*[x×]\s*\d{2,4}\b/i.test(text)) return true

  // Still hyphenated or underscored rather than spaced.
  if (/[-_]/.test(text) && !text.includes(' ')) return true

  // The filename itself, give or take separators and the extension.
  const norm = (s: string) => s.toLowerCase().replace(/\.[a-z0-9]+$/i, '').replace(/[^a-z0-9]+/g, '')
  return norm(text) === norm(filename)
}

const payload = await getPayload({ config })

const { docs } = await payload.find({
  collection: 'media',
  limit: 0,
  pagination: false,
  depth: 0,
})

let updated = 0
let kept = 0
let noWords = 0

for (const doc of docs) {
  const filename = doc.filename ?? ''
  const current = doc.alt ?? ''

  if (!looksDerived(current, filename)) {
    kept++
    continue
  }

  /**
   * Three sources, in order of how much a person had to do with them.
   *
   * The logo is named by hand because it is the one image every visitor's screen
   * reader meets. Then the harvested map, which carries the origin's own words.
   * Then, failing both, the alt already stored — tidied, since the words may be
   * right and only the punctuation wrong.
   */
  const stem = filename.replace(/\.[a-z0-9]+$/i, '').replace(/-\d+x\d+$/i, '')
  const better = LOGO_ALT[stem] ?? altForFile(filename) ?? tidyAlt(current)

  if (!better || better === current) {
    noWords++
    continue
  }

  await payload.update({
    collection: 'media',
    id: doc.id,
    data: { alt: better },
    // The file is not being touched, only the field beside it.
    overrideAccess: true,
  })

  console.log(`  ${filename}\n    "${current}"  ->  "${better}"`)
  updated++
}

console.log(`\nupdated ${updated}, left alone ${kept}, no better words ${noWords} (of ${docs.length})`)

process.exit(0)
