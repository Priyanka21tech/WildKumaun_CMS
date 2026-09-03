/**
 * Import the paintings into the Bird Art collection.
 *
 *   npm run seed:birdart
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts). Needs the
 * media library, since a painting's picture is required.
 *
 * Creates only. A painting already in the collection keeps its title.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedBirdArt } from '../seed/bird-art'

const payload = await getPayload({ config })

const result = await seedBirdArt(payload)

console.log(`bird art: ${result.created} created, ${result.skipped} already present`)

process.exit(0)
