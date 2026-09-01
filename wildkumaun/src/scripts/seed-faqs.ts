/**
 * Import the extracted questions into the FAQs collection.
 *
 *   npm run seed:faqs
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts), so it is
 * not part of setting the project up. It is here for the case the boot seeding
 * could not run — a database that was unreachable at the time, say — and for
 * adding questions appended to content/faqs.json afterwards.
 *
 * Creates only. A question already in the collection is never rewritten.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedFaqs } from '../seed/faqs'

const payload = await getPayload({ config })

const result = await seedFaqs(payload)

console.log(`faqs: ${result.created} created, ${result.skipped} already present`)

process.exit(0)
