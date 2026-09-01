import type { CollectionConfig } from 'payload'

/**
 * The questions on the FAQs page.
 *
 * The first thing on the site to move onto the CMS as content rather than as
 * configuration: six questions that an owner will want to add to, reword and
 * reorder without anyone touching the repository.
 *
 * `answer` is rich text because the answers genuinely are. The origin renders
 * them as a paragraph followed by a numbered list and sometimes a closing line,
 * with links and emphasis inside — flattening that into a textarea would lose the
 * lists, and splitting it into intro/points/closing fields would fit today's six
 * answers and constrain every one written after.
 *
 * `slug` is what the accordion uses as its element id, so a question keeps its
 * deep link — /faqs#distance-to-lakes — even when the wording changes.
 */
export const FAQs: CollectionConfig = {
  slug: 'faqs',

  labels: {
    singular: 'FAQ',
    plural: 'FAQs',
  },

  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order', 'updatedAt'],
    description: 'Shown on the FAQs page, in the order set here.',
  },

  // The page renders them in this order, so the admin list should agree.
  defaultSort: 'order',

  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description:
          'Used for the link to this question — /faqs#your-slug. Changing it breaks any link already shared.',
      },
    },
    {
      name: 'order',
      type: 'number',
      required: true,
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        description: 'Low numbers first. Leave gaps so a question can be slotted in later.',
      },
    },
  ],
}
