import type { GlobalConfig } from 'payload'

/**
 * What the site is, and how to reach it — the facts that are true on every page.
 *
 * A global rather than a collection because there is exactly one of each of
 * these. The phone numbers are the reason this is the first thing to move onto
 * the CMS: they appear in the header, in the footer and on the contact page, they
 * change, and changing them should not need a developer.
 *
 * What does not belong here is anything a single page says. The hero copy and the
 * "by air / by rail / by road" directions were extracted alongside these fields
 * and are easy to file here by mistake, but they appear on one page each — they
 * are that page's content, and they belong to the blocks that render it. The test
 * is whether removing it would change every page or one.
 *
 * The menu is not here either. It lives in Header, because its shape is a menu's,
 * not a fact's.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',

  admin: {
    description: 'Name, logo, contact details and address. Used across the whole site.',
  },

  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Identity',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true, admin: { width: '50%' } },
                {
                  name: 'legalName',
                  type: 'text',
                  admin: {
                    width: '50%',
                    description: 'The registered name, where it differs from the trading name.',
                  },
                },
              ],
            },
            {
              name: 'tagline',
              type: 'text',
              admin: {
                description: 'The line that sits under the name — "An Eco-Resort at Sattal".',
              },
            },
            {
              type: 'row',
              fields: [
                { name: 'logo', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
                { name: 'favicon', type: 'upload', relationTo: 'media', admin: { width: '50%' } },
              ],
            },
          ],
        },
        {
          label: 'Contact',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'email', type: 'email', required: true, admin: { width: '50%' } },
                {
                  name: 'whatsapp',
                  type: 'text',
                  admin: { width: '50%', description: 'Number only, no country code.' },
                },
              ],
            },
            {
              name: 'phones',
              type: 'array',
              labels: { singular: 'Phone number', plural: 'Phone numbers' },
              admin: {
                description:
                  'The label says what a caller gets — reservations, birding tours, the property manager. The same number may appear twice under different labels, as it does on the live site.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'number', type: 'text', required: true, admin: { width: '40%' } },
                    { name: 'label', type: 'text', required: true, admin: { width: '60%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'showInHeader',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'showInFooter',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: { width: '50%' },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Address',
          fields: [
            {
              name: 'address',
              type: 'group',
              label: false,
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'short',
                      type: 'text',
                      admin: { width: '50%', description: 'The one-line form the footer uses.' },
                    },
                    { name: 'locality', type: 'text', admin: { width: '50%' } },
                  ],
                },
                { name: 'full', type: 'textarea' },
                {
                  name: 'mapUrl',
                  type: 'text',
                  admin: {
                    description:
                      'Where the footer address links to — the share link for the place on a map.',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'region', type: 'text', admin: { width: '33%' } },
                    { name: 'postalCode', type: 'text', admin: { width: '33%' } },
                    { name: 'country', type: 'text', admin: { width: '34%' } },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Social',
          fields: [
            {
              name: 'social',
              type: 'array',
              labels: { singular: 'Profile', plural: 'Profiles' },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'network',
                      type: 'select',
                      required: true,
                      options: ['Facebook', 'Instagram', 'YouTube', 'X', 'TripAdvisor', 'Other'],
                      admin: { width: '33%' },
                    },
                    { name: 'label', type: 'text', admin: { width: '33%' } },
                    {
                      name: 'url',
                      type: 'text',
                      admin: {
                        width: '34%',
                        description: 'The live site links these from icons with no href set.',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'SEO',
          fields: [
            {
              name: 'metaDescription',
              type: 'textarea',
              admin: {
                description:
                  'The default description for pages that do not set their own. Around 155 characters.',
              },
            },
          ],
        },
      ],
    },
  ],
}
