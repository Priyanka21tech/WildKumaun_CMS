import type { Block } from 'payload'

/**
 * A page's own words.
 *
 * Most of what a page says is prose with the occasional picture in it, and that
 * has no structure worth naming — no collection, because nothing repeats. It is
 * one rich text field, and the pictures go inside it where they belong rather
 * than in a separate list that has to be kept in step with the text.
 *
 * Images placed here are Media documents, which is the point: the origin wrote
 * them into the page as `<img src="/media/...">`, where nobody could change one
 * without editing markup. Inserted through the editor they are uploads like any
 * other, and swapping one is swapping a relationship.
 *
 * This replaces everything inside the page's content area, so a page carrying a
 * content block is no longer showing the mirror's copy at all — it is the first
 * kind of block that takes a page over rather than taking one section of it.
 */
export const ContentBlock: Block = {
  slug: 'content',

  labels: {
    singular: 'Content',
    plural: 'Content',
  },

  fields: [
    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description:
          "The page's copy. Everything the mirrored page used to show in its content area is replaced by this.",
      },
    },
  ],
}
