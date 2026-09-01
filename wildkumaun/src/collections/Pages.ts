import type { CollectionConfig } from 'payload'

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
          'Optional. What the menu calls this page when that differs from the title — "BIRDING GUIDES" for the team page.',
      },
    },
  ],
}
