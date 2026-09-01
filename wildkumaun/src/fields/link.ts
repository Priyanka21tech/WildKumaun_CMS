import type { Field } from 'payload'

/**
 * One destination, chosen rather than typed.
 *
 * The site's menu carries three kinds of destination and a raw href field would
 * flatten all of them into a string that nothing can check:
 *
 *   /about-us                          a page on this site
 *   https://explorewildindia.app/...   somewhere else
 *   #                                  no destination — SERVICES and WELLNESS are
 *                                      parents that only exist to hold children
 *
 * Picking a page instead of typing its path means a slug can change without
 * breaking every link that points at it, a mistyped path is impossible, and
 * Payload knows which documents reference a page before anyone deletes it.
 *
 * `anchor` is separate from the page so a link can reach a section rather than
 * the top of a page — "Services" from the home page, say. It applies to a chosen
 * page and to `none` (same page), which is where the site's own in-page jumps go.
 */

type LinkOptions = {
  /** Field name. Defaults to `link`. */
  name?: string
  /** Whether the group carries its own label. Menu items do; a card's CTA may inherit one. */
  withLabel?: boolean
  /** Offer `none` — for menu parents that open a submenu instead of navigating. */
  allowNone?: boolean
  label?: string
}

export const link = ({
  name = 'link',
  withLabel = true,
  allowNone = false,
  label = 'Link',
}: LinkOptions = {}): Field => ({
  name,
  type: 'group',
  label,
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'reference',
          options: [
            { label: 'Page on this site', value: 'reference' },
            { label: 'External URL', value: 'custom' },
            ...(allowNone ? [{ label: 'No destination', value: 'none' }] : []),
          ],
          admin: { layout: 'horizontal', width: '50%' },
        },
        ...(withLabel
          ? ([
              {
                name: 'label',
                type: 'text',
                // Optional for a page, which already knows what to call itself. A
                // URL or a menu parent has no page behind it, so it has to be told.
                validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) => {
                  if (siblingData?.type === 'reference') return true
                  return value ? true : 'Required for anything other than a page.'
                },
                admin: {
                  width: '50%',
                  description:
                    "Leave empty to use the page's own menu name. Fill it in only to say something different here.",
                },
              },
            ] as Field[])
          : []),
      ],
    },
    {
      name: 'reference',
      type: 'relationship',
      relationTo: 'pages',
      required: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'reference',
      },
    },
    {
      name: 'url',
      type: 'text',
      required: true,
      admin: {
        condition: (_data, siblingData) => siblingData?.type === 'custom',
        description: 'Include the protocol, e.g. https://example.com/page.',
      },
    },
    {
      name: 'anchor',
      type: 'text',
      admin: {
        condition: (_data, siblingData) => siblingData?.type !== 'custom',
        description:
          'Optional. The id of a section to jump to, without the #. Leave empty to land at the top.',
      },
    },
    {
      name: 'newTab',
      type: 'checkbox',
      label: 'Open in a new tab',
      defaultValue: false,
      admin: { condition: (_data, siblingData) => siblingData?.type === 'custom' },
    },
  ],
})

/** The shape `link()` stores. */
export type LinkValue = {
  type?: 'reference' | 'custom' | 'none' | null
  label?: string | null
  reference?: number | { slug?: string | null; navLabel?: string | null; title?: string | null } | null
  url?: string | null
  anchor?: string | null
  newTab?: boolean | null
}

/**
 * Turn a stored link into an href.
 *
 * The reference has to be populated — query with depth >= 1 — or there is only an
 * id to go on and no slug to build a path from, in which case this returns the
 * anchor alone rather than a wrong path.
 *
 * The home page is stored under the slug `home` because Payload slugs cannot be
 * "/", so it is the one slug that does not map to /<slug>.
 */
export function resolveHref(value?: LinkValue | null): string {
  if (!value) return '#'

  const anchor = value.anchor ? `#${value.anchor.replace(/^#/, '')}` : ''

  if (value.type === 'custom') return value.url || '#'
  if (value.type === 'none') return anchor || '#'

  const page = typeof value.reference === 'object' ? value.reference : null
  if (!page?.slug) return anchor || '#'

  return `${page.slug === 'home' ? '/' : `/${page.slug}`}${anchor}`
}

/**
 * What the link should read as.
 *
 * A link to a page falls back to that page's own menu name, so a page is renamed
 * in one place — on the page — rather than everywhere something points at it. An
 * explicit label still wins, which is how a menu says something shorter than the
 * page would.
 *
 * The reference has to be populated for the fallback to work; with only an id
 * there is nothing to read a name off, and the link renders unlabelled rather
 * than wrong.
 */
export function resolveLabel(value?: LinkValue | null): string {
  if (!value) return ''
  if (value.label) return value.label

  const page = typeof value.reference === 'object' ? value.reference : null
  return page?.navLabel || page?.title || ''
}
