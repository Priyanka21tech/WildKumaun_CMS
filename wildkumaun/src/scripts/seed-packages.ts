/**
 * Import the four packages into the Packages collection.
 *
 *   npm run seed:packages
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts). It is here
 * for the case the boot seeding could not run, and for re-running it after
 * content/packages.json changes.
 *
 * Needs the media library: a package's image is required, and one whose picture
 * has not been imported is skipped rather than created without it. Run
 * `npm run import:media` first.
 *
 * Creates only. A package already in the collection is never rewritten.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedPackages } from '../seed/packages'

const payload = await getPayload({ config })

const result = await seedPackages(payload)

console.log(`packages: ${result.created} created, ${result.skipped} already present`)

process.exit(0)
