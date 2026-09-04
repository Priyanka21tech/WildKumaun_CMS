import type { CollectionConfig } from 'payload'

/**
 * The cards on the blog archive.
 *
 * A post is a card, not an article. The three posts the origin lists — Eco-friendly
 * Enterprises, the Spring 2022 trip report, Bird watching in Sattal — are already
 * pages in this CMS, with their own blocks and their own banners, because that is
 * how the origin built them: full Elementor pages that happen to be WordPress
 * posts. So a post here holds what the listing shows and points at the page that
 * holds the words. Storing the body twice would mean an editor changing a post and
 * watching the archive go on quoting the old version.
 *
 * `excerpt` is a field rather than the first paragraph of the page it points at.
 * WordPress trims to 55 words and adds an ellipsis, which lands mid-sentence on all
 * three; whoever writes the next post should be able to say something better than
 * the first 55 words, and cannot if this is derived.
 *
 * `image` is optional because none of the three has one — the origin renders them
 * `ast-no-thumb`. Setting one adds the thumbnail Astra already has the styling for,
 * which is the only reason the field is worth having: a field that changes nothing
 * when you fill it in is not a field.
 */
export const Posts: CollectionConfig = {
  slug: 'posts',

  labels: {
    singular: 'Post',
    plural: 'Posts',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'author', 'order', 'updatedAt'],
    description: 'The list on the Blog page, newest first by the order set here.',
  },

  defaultSort: 'order',

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
      admin: {
        description: 'The headline on the card. It need not match the page it links to.',
      },
    },
    {
      /**
       * The page carrying the post itself.
       *
       * A relationship rather than a typed path, for the reason the menu uses one:
       * the slug can change without breaking the card, and Payload knows the archive
       * points here before anyone deletes the page.
       */
      name: 'page',
      type: 'relationship',
      relationTo: 'pages',
      required: true,
      admin: {
        description: 'Where the title and "Read More" go.',
      },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      admin: {
        description:
          'The teaser under the title. The origin ends each with an ellipsis where WordPress cut it off — write a whole sentence instead if you prefer.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Optional. Leave empty for a card with no picture, as the site has today.',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'text',
          required: true,
          defaultValue: 'General',
          admin: { width: '50%' },
        },
        {
          name: 'author',
          type: 'text',
          required: true,
          defaultValue: 'Neer',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first. Leave gaps so a post can be slotted in later.',
      },
    },
  ],
}
