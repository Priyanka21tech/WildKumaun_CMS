import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Amenities } from './collections/Amenities'
import { Packages } from './collections/Packages'
import { BirdArt } from './collections/BirdArt'
import { FAQs } from './collections/FAQs'
import { Posts } from './collections/Posts'
import { Testimonials } from './collections/Testimonials'
import { SiteSettings } from './globals/SiteSettings'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { seedGlobals } from './seed/globals'
import { seedFaqs } from './seed/faqs'
import { seedPosts } from './seed/posts'
import { seedTestimonials } from './seed/testimonials'
import { seedAmenities } from './seed/amenities'
import { seedPackages } from './seed/packages'
import { seedBirdArt } from './seed/bird-art'
import { seedPageBlocks } from './seed/page-blocks'
import { seedPageContent } from './seed/page-content'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Pages, Amenities, Packages, BirdArt, FAQs, Posts, Testimonials],
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
  plugins: [
    /**
     * Forms the client can change, and somewhere for what people send.
     *
     * Every form on the origin is dead: the enquiry form posts to WordPress with
     * a token that expired, and the guest book's nonce with it. So there was
     * nothing to preserve here — no working behaviour to keep faithful — which
     * makes this the one part of the site that is a rebuild rather than a
     * migration.
     *
     * The plugin rather than a hand-written block, because the client should be
     * able to add a field to the enquiry form without a developer, and because
     * storing submissions, validating them and confirming them is a lot of
     * ordinary code to get subtly wrong.
     *
     * The submissions collection is renamed to `enquiries`. `form-submissions` is
     * what the plugin calls it and it is accurate, but the admin panel is the
     * client's and an enquiry is what they are.
     */
    formBuilderPlugin({
      // Only what the site's forms actually use. Every extra field type is
      // another option in a menu the client has to read past.
      fields: {
        text: true,
        textarea: true,
        email: true,
        number: true,
        select: true,
        checkbox: true,
        message: true,
        payment: false,
      },
      formOverrides: {
        admin: {
          group: 'Forms',
          description: 'The forms on the site, and what happens when one is sent.',
        },
      },
      formSubmissionOverrides: {
        slug: 'enquiries',
        labels: { singular: 'Enquiry', plural: 'Enquiries' },
        admin: {
          group: 'Forms',
          description: 'What people have sent through the forms on the site.',
        },
      },
    }),
  ],

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
      if (result.bannersLinked) {
        payload.logger.info(`Linked banners on ${result.bannersLinked} pages`)
      }
      for (const entry of result.filled) {
        payload.logger.info(`Filled empty ${entry}`)
      }
      for (const entry of result.unresolved) {
        payload.logger.warn(`Menu link has no page behind it, kept as a URL: ${entry}`)
      }

      const faqs = await seedFaqs(payload)
      if (faqs.created) payload.logger.info(`Seeded ${faqs.created} FAQs`)

      /**
       * After the pages, because every card points at one and a post without its
       * page is not created at all.
       */
      const posts = await seedPosts(payload)
      if (posts.created) payload.logger.info(`Seeded ${posts.created} posts`)
      for (const entry of posts.unresolved) {
        payload.logger.warn(`Blog card has no page behind it, not created: ${entry}`)
      }

      const testimonials = await seedTestimonials(payload)
      if (testimonials.created) {
        payload.logger.info(`Seeded ${testimonials.created} testimonials`)
      }

      const content = await seedPageContent(payload)
      for (const slug of content.filled) {
        payload.logger.info(`Gave /${slug} a content block`)
      }

      // Importing 273 photographs takes minutes and generates four sizes of each,
      // which is too much to do quietly while someone waits for a dev server. So
      // it stays a command, and this is the reminder to run it — without which the
      // only symptom is a header with no logo.
      const media = await payload.count({ collection: 'media' })
      if (media.totalDocs === 0) {
        payload.logger.warn('Media is empty — run "npm run import:media" to load the site images')
      }

      /**
       * These two wait for the media library, unlike the seeds above.
       *
       * Both find their pictures by filename, and both create only. Run against
       * an empty library they would not fail — they would quietly create every
       * amenity without its icon and then skip them all forever after, and the
       * only way back would be deleting the documents by hand. So on a first boot
       * they do nothing and say so; the next boot after import:media seeds them
       * properly.
       */
      if (media.totalDocs === 0) {
        payload.logger.warn('Amenities and packages wait for the media library')
      } else {
        const amenities = await seedAmenities(payload)
        if (amenities.created) payload.logger.info(`Seeded ${amenities.created} amenities`)

        const packages = await seedPackages(payload)
        if (packages.created) payload.logger.info(`Seeded ${packages.created} packages`)

        const birdArt = await seedBirdArt(payload)
        if (birdArt.created) payload.logger.info(`Seeded ${birdArt.created} paintings`)

        // Last, because a block is a list of references and the documents it
        // points at have to exist before it can point at them.
        const blocks = await seedPageBlocks(payload)
        for (const block of blocks.added) {
          payload.logger.info(`Now rendered from the CMS: ${block}`)
        }
      }
    } catch (err) {
      // A failed seed must not stop Payload starting: the admin panel is where
      // this would be fixed, and it has to be reachable to fix it.
      payload.logger.error({ err }, 'Could not seed globals')
    }
  },
})
