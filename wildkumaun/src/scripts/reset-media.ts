/**
 * Empty the Media collection and the files it owns, so import-media.ts can run
 * from a clean slate.
 *
 *   npm run reset:media && npm run import:media
 *
 * Needed because Payload will not overwrite a file that is already sitting in
 * staticDir — it appends "-1" to the name instead. public/media already held a
 * static copy of every original, so the first import produced 273 documents
 * named <original>-1.jpg: a second copy of every image, under a name no page
 * references. Deleting the documents takes Payload's files with them; this then
 * clears the static originals too, leaving only the WordPress size variants that
 * Payload does not manage, so the re-import can claim the real filenames.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const PUBLIC_MEDIA = path.resolve(dirname, '../../public/media')

/** WordPress responsive copies: bedroom-img-1024x683.jpg */
const isSizeVariant = (file: string) => /-\d{2,4}x\d{2,4}\.[a-z]+$/i.test(file)

const payload = await getPayload({ config })

const { docs } = await payload.find({ collection: 'media', limit: 0, pagination: false, depth: 0 })
console.log(`${docs.length} media documents to delete`)

let deleted = 0
for (const doc of docs) {
  await payload.delete({ collection: 'media', id: doc.id })
  deleted++
  if (deleted % 50 === 0) console.log(`   ${deleted} deleted…`)
}

// Whatever Payload did not remove: the static originals that caused the clash.
// The size variants stay — the mirrored markup's srcset still points at them.
let removed = 0
let kept = 0
for (const file of fs.readdirSync(PUBLIC_MEDIA)) {
  if (isSizeVariant(file)) {
    kept++
    continue
  }
  fs.rmSync(path.join(PUBLIC_MEDIA, file))
  removed++
}

console.log(`\ndocuments : ${deleted} deleted`)
console.log(`files     : ${removed} originals cleared, ${kept} size variants kept`)
