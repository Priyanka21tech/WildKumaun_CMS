/**
 * Give each page the blocks that render its amenities, packages, gallery and
 * partner logos from the CMS.
 *
 *   npm run seed:blocks
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts). It is here
 * for the case the boot seeding could not run, and for putting a block back after
 * one has been deleted in the admin panel.
 *
 * Needs the amenities, packages and media to be in place first — a block is a
 * list of references, and there is nothing to point at otherwise.
 *
 * Creates only, per block. A block already on a page is never rewritten, and the
 * blocks a page already carries stay in the order they are in.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedPageBlocks } from '../seed/page-blocks'

const payload = await getPayload({ config })

const result = await seedPageBlocks(payload)

if (result.added.length) {
  for (const entry of result.added) console.log(`added ${entry}`)
} else {
  console.log('every block already present')
}

process.exit(0)
