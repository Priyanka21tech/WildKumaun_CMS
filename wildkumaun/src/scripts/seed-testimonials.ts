/**
 * Import the extracted guest reviews into the Testimonials collection.
 *
 *   npm run seed:testimonials
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts). This is for
 * the case that could not run, and for reviews appended to the extraction later.
 *
 * Creates only. A review already in the collection is never rewritten.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedTestimonials } from '../seed/testimonials'

const payload = await getPayload({ config })

const result = await seedTestimonials(payload)

console.log(`testimonials: ${result.created} created, ${result.skipped} already present`)

process.exit(0)
