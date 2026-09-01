/**
 * Give the plain content pages their content block.
 *
 *   npm run seed:content
 *
 * Payload runs this itself on boot (see onInit in payload.config.ts). This is for
 * the case that could not run.
 *
 * Creates only. A page that already has a layout keeps it.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import { seedPageContent } from '../seed/page-content'

const payload = await getPayload({ config })

const result = await seedPageContent(payload)

console.log(`content blocks: ${result.filled.length ? result.filled.join(', ') : 'nothing to fill'}`)

process.exit(0)
