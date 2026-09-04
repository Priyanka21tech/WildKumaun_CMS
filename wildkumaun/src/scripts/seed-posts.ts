/**
 * Import the origin's blog cards into the Posts collection.
 *
 *   npm run seed:posts
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts), so it is
 * not part of setting the project up. It is here for the case the boot seeding
 * could not run — a database that was unreachable at the time, say — and for
 * re-running it after a page the archive links to has been created.
 *
 * Creates only. A post already in the collection is never rewritten.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedPosts } from '../seed/posts'

const payload = await getPayload({ config })

const result = await seedPosts(payload)

console.log(`posts: ${result.created} created, ${result.skipped} already present`)
for (const entry of result.unresolved) console.log(`  skipped: ${entry}`)

process.exit(0)
