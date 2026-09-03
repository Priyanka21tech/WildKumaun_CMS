import type { CollectionConfig } from 'payload'

/**
 * The paintings shown on the bird art page.
 *
 * A collection rather than a list of images on the page, for the reason the
 * gallery pages are not: a painting has a name. The origin's markup does not —
 * its gallery captions each picture with its own filename, so the page reads
 * "Long-tailed-Minivet-1" where it means "Long-tailed Minivet". Giving an
 * artwork a title field is the smallest thing that fixes that, and it can only
 * live on a document.
 *
 * It is also the one kind of content here that grows on its own. Amenities and
 * packages change rarely; an artist paints another bird.
 *
 * `artist` is text rather than a relationship. There are two people on this site
 * and neither has a page, a biography or anything else to point at — a
 * relationship would be a second collection created so that a name could be
 * typed once, which is more machinery than the fact deserves.
 *
 * `altImage` exists because six of the eleven paintings appear twice in the
 * origin's gallery, as two photographs of the same canvas. They are one artwork,
 * so they are one document with a second picture rather than two documents that
 * would both have to be renamed.
 */
export const BirdArt: CollectionConfig = {
  slug: 'bird-art',

  labels: {
    singular: 'Artwork',
    plural: 'Bird Art',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'artist', 'order', 'updatedAt'],
    description: 'Paintings shown on the Bird Art page.',
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
      admin: { description: 'What the painting is of — shown under it on the page.' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'altImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description:
          'A second photograph of the same painting, where the page shows two. Leave empty for most.',
      },
    },
    {
      name: 'artist',
      type: 'text',
      admin: { description: 'Who painted it.' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Identifies this painting in the page markup. Rarely needs changing.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first. Leave gaps so a painting can be slotted in later.',
      },
    },
  ],
}
