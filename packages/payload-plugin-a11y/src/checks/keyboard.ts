import type { Check } from '../types'
import { tabWalk } from './tab-walk'

/**
 * Can a keyboard reach everything a mouse can?
 *
 * The commonest way to fail this is not exotic: it is a `<div onclick>` or a
 * `<div role="button">` with no tabindex. It looks and behaves like a control
 * for anyone with a mouse and does not exist for anyone without one.
 *
 * This site's mobile menu was exactly that. The button was visible, the styles
 * were right, and below 1024px it was the only route to any other page — and no
 * keyboard could reach it.
 */
export const keyboardReachable: Check = {
  id: 'keyboard-reachable',
  title: 'Everything works with a keyboard',
  wcag: ['2.1.1'],

  async run(page) {
    const walk = await tabWalk(page)

    if (!walk.unreachable.length) {
      return { status: 'pass', count: walk.stops.length, detail: `${walk.stops.length} stops in the tab order.` }
    }

    const first = walk.unreachable[0]
    return {
      status: 'fail',
      count: walk.unreachable.length,
      sample: first.selector,
      detail:
        `${walk.unreachable.length} control(s) can be clicked but never receive keyboard focus. ` +
        `First: ${first.name ? `"${first.name}"` : first.selector}.`,
    }
  },
}

/**
 * Does focus ever get stuck?
 *
 * A trap is the one failure that ends the session: the reader cannot go forward,
 * cannot go back, and cannot leave without closing the tab. WCAG treats it as a
 * Level A failure for that reason, and the guide's severity model calls it a
 * blocker outright.
 */
export const keyboardTrap: Check = {
  id: 'keyboard-trap',
  title: 'No keyboard trap',
  wcag: ['2.1.2'],

  async run(page) {
    const walk = await tabWalk(page)

    if (!walk.trapped) return { status: 'pass' }

    return {
      status: 'fail',
      count: 1,
      sample: walk.trappedAt,
      detail:
        `Focus stopped moving at ${walk.trappedAt}. Pressing Tab from here does not ` +
        `reach the next control, so a keyboard user cannot get past it.`,
    }
  },
}

/**
 * Can you see where you are?
 *
 * Every stop in the tab order has to show something. This is worth checking on
 * every page rather than once, because the indicator is usually removed by a
 * theme rule that only applies to certain components — here it was Astra,
 * Header Footer Elementor and Elementor each setting `outline: 0` on their own
 * elements, so the ring survived in some places and vanished in others.
 */
export const focusVisible: Check = {
  id: 'focus-visible',
  title: 'Focus indicator is visible',
  wcag: ['2.4.7'],

  async run(page) {
    const walk = await tabWalk(page)

    if (!walk.stops.length) {
      return { status: 'manual', detail: 'Nothing was reachable by Tab, so there was nothing to look at.' }
    }

    const invisible = walk.stops.filter((stop) => !stop.hasIndicator)
    if (!invisible.length) {
      return { status: 'pass', count: walk.stops.length }
    }

    const first = invisible[0]
    return {
      status: 'fail',
      count: invisible.length,
      sample: first.selector,
      detail:
        `${invisible.length} of ${walk.stops.length} focus stops show no visible outline or shadow. ` +
        `First: ${first.selector} (outline: ${first.outline}).`,
    }
  },
}
