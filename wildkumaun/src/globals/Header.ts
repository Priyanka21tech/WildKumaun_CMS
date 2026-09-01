import type { GlobalConfig } from 'payload'
import { link } from '../fields/link'

/**
 * The main menu and the button beside it.
 *
 * Two levels, which is what the live site has: SERVICES and GALLERY and BLOG open
 * a submenu, everything else navigates. A parent that only opens a submenu is a
 * link of type "none" — the live markup writes it as href="#", which is a
 * destination that does not exist pretending to be one.
 *
 * Nesting is fixed at two levels on purpose. Payload can express arbitrary depth
 * through a self-referencing structure, but the design does not have a third
 * level, and an editor given one would build a menu the site cannot render.
 *
 * The phone numbers shown here are not configured here — they are the numbers in
 * Site Settings marked "show in header", so the number itself lives in one place.
 * Nor is the logo: that is the site's, not the header's, and the footer will want
 * it too.
 *
 * There is no call-to-action button. The live header has none — its widgets are a
 * phone list, a search box, the logo, the menu and the scrolling line, and that is
 * all. "Make A Booking" appears inside pages, so it belongs to the blocks that
 * render them.
 */
export const Header: GlobalConfig = {
  slug: 'header',

  admin: {
    description: 'The main menu, the scrolling line under it, and the search box.',
  },

  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },

  fields: [
    {
      name: 'nav',
      type: 'array',
      label: 'Menu',
      labels: { singular: 'Menu item', plural: 'Menu items' },
      admin: {
        description: 'Top-level items, in the order they appear.',
        initCollapsed: true,
      },
      fields: [
        link({ allowNone: true, label: 'Destination' }),
        {
          name: 'children',
          type: 'array',
          label: 'Submenu',
          labels: { singular: 'Submenu item', plural: 'Submenu items' },
          admin: {
            description: 'Leave empty for an item that navigates straight to its own destination.',
          },
          // "none" is offered here too: WELLNESS sits in the Services submenu with
          // href="#" on the live site — an entry that is listed but goes nowhere.
          fields: [link({ allowNone: true, label: 'Destination' })],
        },
      ],
    },
    {
      name: 'ticker',
      type: 'textarea',
      label: 'Scrolling line',
      admin: {
        description:
          'The line that scrolls under the menu. Leave empty to show none. Present on every page, which is why it is here and not in a page block.',
      },
    },
    {
      name: 'showSearch',
      type: 'checkbox',
      label: 'Show the search box',
      defaultValue: true,
    },
  ],
}
