/**
 * Put the extracted content back into the globals, over whatever is there now.
 *
 *   npm run seed:globals
 *
 * Payload seeds itself on boot (see onInit in payload.config.ts), so this is not
 * part of setting the project up — that happens on the first `npm run dev`. This
 * is the deliberate one: it forces, discarding edits made in the admin panel and
 * restoring the menu, contact details and footer to what was extracted from the
 * live site.
 *
 * Pages are still only created, never rewritten. A page that exists keeps the
 * title it has.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedGlobals } from '../seed/globals'

const payload = await getPayload({ config })

const result = await seedGlobals(payload, { force: true })

console.log(`pages    : ${result.pagesCreated} created, ${result.bannersLinked} banners linked`)
console.log(`globals  : ${result.filled.join('; ') || 'nothing written'}`)

if (result.unresolved.length) {
  console.log(`\n${result.unresolved.length} link(s) had no page to point at, kept as plain URLs:`)
  for (const entry of result.unresolved) console.log(`   ${entry}`)
}

process.exit(0)
