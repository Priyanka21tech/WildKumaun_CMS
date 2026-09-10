/**
 * Give every page the draft version row the admin panel looks for.
 *
 * `versions.drafts` was switched on for Pages when live preview was added, and
 * from that point Payload's list view reads the latest *version* of each
 * document rather than the document itself. The 26 pages were seeded straight
 * into the collection before that, and seeding writes no version row — so the
 * list could see exactly one page, the only one anybody had opened in the admin.
 *
 * The documents were never in danger; the API returned all 26 throughout. What
 * was missing was the snapshot the admin reads.
 *
 * This re-saves each page as a draft of its own current content, which is what
 * creates that snapshot. Nothing is edited: the data written back is the data
 * read a line earlier.
 *
 * Safe to run more than once. A page that already has a version simply gains
 * another identical one, and maxPerDoc keeps that bounded.
 *
 * Run:  npm run fix:page-versions [-- --only=<slug>]
 */
import { getPayload } from 'payload'
import config from '@payload-config'

const only = process.argv.find((arg) => arg.startsWith('--only='))?.split('=')[1]

const payload = await getPayload({ config })

/**
 * depth 0 on purpose.
 *
 * At any greater depth the relationships come back as whole documents, and
 * writing those back would replace an id with an object — turning a reference
 * into a copy. Ids in, ids out.
 */
const { docs } = await payload.find({
  collection: 'pages',
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
})

const versions = await payload.findVersions({
  collection: 'pages',
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
})

const covered = new Set(versions.docs.map((version) => String(version.parent)))

const targets = docs.filter((doc) => {
  if (only) return doc.slug === only
  return !covered.has(String(doc.id))
})

if (!targets.length) {
  console.log(only ? `No page with slug "${only}" needs this.` : 'Every page already has a version row.')
  process.exit(0)
}

console.log(`Backfilling ${targets.length} page(s).\n`)

let done = 0
for (const doc of targets) {
  /**
   * The fields Payload maintains itself are dropped rather than sent back.
   * `id` addresses the document; the timestamps and status belong to the
   * version being created, and passing the old ones would date the new snapshot
   * to when the page was seeded.
   */
  const { id, createdAt, updatedAt, _status, ...data } = doc as unknown as Record<
    string,
    unknown
  > & { id: string | number }
  void createdAt
  void updatedAt
  void _status

  await payload.update({
    collection: 'pages',
    id,
    data,
    draft: true,
    overrideAccess: true,
  })

  done++
  console.log(`  ${String(done).padStart(2)}. ${doc.slug}`)
}

const after = await payload.findVersions({
  collection: 'pages',
  limit: 0,
  pagination: false,
  depth: 0,
  overrideAccess: true,
})

const nowCovered = new Set(after.docs.map((version) => String(version.parent)))
console.log(`\n${nowCovered.size} of ${docs.length} page(s) now have a version row.`)

process.exit(0)
