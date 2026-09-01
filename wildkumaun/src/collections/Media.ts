import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Every image on the site lives here — the ticket asks for the upload collection
 * to own all images rather than having them sit in the repo as static files.
 *
 * Files are written to public/media, so Next serves them at /media/<filename>.
 * That is deliberate: it is the same path the current site already asks for, so
 * images keep resolving while the pages are still being moved onto the CMS.
 */
export const Media: CollectionConfig = {
  slug: 'media',

  admin: {
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },

  access: {
    // Images have to be public — they are requested straight from the browser.
    read: () => true,
    // Everything that changes the library requires a logged-in user.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describes the image for screen readers and for when it fails to load. For a bird photo this is the species name.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description: 'Optional. Shown alongside the image where a layout allows it.',
      },
    },
  ],

  upload: {
    staticDir: path.resolve(dirname, '../../public/media'),
    // The site is photography-heavy; anything else belongs in its own collection.
    mimeTypes: ['image/*'],
    adminThumbnail: 'thumbnail',
    // Lets an editor choose what stays in frame when an image is cropped.
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 300 },
      { name: 'medium', width: 900 },
      { name: 'large', width: 1400 },
      // Social previews need a fixed aspect ratio, so this one crops.
      { name: 'og', width: 1200, height: 630, crop: 'center' },
    ],
  },
}
