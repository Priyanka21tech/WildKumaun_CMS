import type { CollectionConfig } from 'payload'
import { TestimonialsBlock } from '../blocks/TestimonialsBlock'

/**
 * The pages of the site, as documents that other documents can point at.
 *
 * Deliberately thin for now: a title, a slug, and the label the menu uses. No
 * layout, no blocks, no content — the pages are still rendered from the mirrored
 * markup in content/mirror, and the block schema should be designed once it is
 * clear which section types actually recur across the 26 pages, not guessed at
 * up front.
 *
 * It exists this early because links need it. A menu item or a CTA that stores
 * "/about-us" as text is a string nothing can verify; one that stores a
 * relationship to a Page survives the slug changing and tells Payload which
 * documents would break if that page were deleted. Building the registry first
 * means every link created from here on already points at a real document, and
 * the layout fields can be added to these same documents later without anything
 * having to be relinked.
 *
 * `banner` is the page's lead image. It is not layout — every page that has one
 * has exactly one, in the same place — and it was the last image on the site that
 * could not be changed without editing a file, since the origin sets it either as
 * a CSS background or as a plain `<img>` in the markup.
 *
 * `layout` is where the page starts becoming its own. Each block replaces one
 * section of the mirrored markup: the testimonials block takes over the run of
 * reviews and the heading above it, and the rest of the page carries on being the
 * mirror's. Blocks are added a section at a time, as each is understood well
 * enough to be worth taking over — a page with no blocks renders exactly as
 * before, so nothing has to move until it is ready to.
 *
 * The home page is `home` rather than `/` — a slug cannot be a bare slash. See
 * resolveHref in src/fields/link.ts, which is the one place that knows this.
 */
export const Pages: CollectionConfig = {
  slug: 'pages',

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    description: 'Every page on the site. Links point at these rather than at typed paths.',
  },

  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Used in the browser tab and as the page heading.' },
    },
    {
      name: 'banner',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          "The page's lead image. Leave it empty and the page shows none — the mirrored image is not kept as a fallback, so an empty field looks empty.",
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [TestimonialsBlock],
      admin: {
        description:
          'Sections this page builds from the CMS. Everything not listed here still comes from the mirrored markup, so a page with no blocks looks exactly as it did.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'The path, without the leading slash. The home page is "home".',
      },
    },
    {
      name: 'navLabel',
      type: 'text',
      admin: {
        position: 'sidebar',
        description:
          'What menus call this page, when that differs from the title — "BIRDING GUIDES" for the team page. Every link to this page reads it, so changing it here changes it everywhere. Falls back to the title.',
      },
    },
  ],
}
