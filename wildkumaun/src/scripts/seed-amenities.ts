/**
 * Import the site's amenities into the Amenities collection.
 *
 *   npm run seed:amenities
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts), so it is
 * not part of setting the project up. It is here for the case the boot seeding
 * could not run — a database that was unreachable at the time, say — and for
 * picking up items added to the mirrored pages afterwards.
 *
 * Needs the media library: the icons are looked up by filename, so run
 * `npm run import:media` first or the amenities arrive without pictures.
 *
 * Creates only. An amenity already in the collection is never rewritten.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedAmenities } from '../seed/amenities'

const payload = await getPayload({ config })

const result = await seedAmenities(payload)

console.log(`amenities: ${result.created} created, ${result.skipped} already present`)

process.exit(0)
