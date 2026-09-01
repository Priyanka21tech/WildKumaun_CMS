import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { SiteSettings } from './globals/SiteSettings'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { seedGlobals } from './seed/globals'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages],
  globals: [SiteSettings, Header, Footer],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],

  /**
   * Boot the site into a usable state.
   *
   * The header and footer render from the globals now, not from the mirrored
   * markup, so an unseeded database does not give you a plain-looking site — it
   * gives you one with an empty menu and no footer at all. Making the first
   * `npm run dev` do this means there is no second command to forget.
   *
   * seedGlobals fills what is empty and never overwrites an edit, so this is safe
   * on every boot — and a field added later gets populated on the next start
   * rather than staying empty because the globals had been seeded once already.
   * `npm run seed:globals` forces it, for putting the extracted content back.
   */
  onInit: async (payload) => {
    try {
      const result = await seedGlobals(payload)
      if (result.pagesCreated) {
        payload.logger.info(`Seeded ${result.pagesCreated} pages`)
      }
      for (const entry of result.filled) {
        payload.logger.info(`Filled empty ${entry}`)
      }
      for (const entry of result.unresolved) {
        payload.logger.warn(`Menu link has no page behind it, kept as a URL: ${entry}`)
      }

      // Importing 273 photographs takes minutes and generates four sizes of each,
      // which is too much to do quietly while someone waits for a dev server. So
      // it stays a command, and this is the reminder to run it — without which the
      // only symptom is a header with no logo.
      const media = await payload.count({ collection: 'media' })
      if (media.totalDocs === 0) {
        payload.logger.warn('Media is empty — run "npm run import:media" to load the site images')
      }
    } catch (err) {
      // A failed seed must not stop Payload starting: the admin panel is where
      // this would be fixed, and it has to be reachable to fix it.
      payload.logger.error({ err }, 'Could not seed globals')
    }
  },
})
