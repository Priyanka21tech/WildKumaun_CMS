import type { Check } from '../types'

/**
 * Things that say they are buttons without being one.
 *
 * `role="button"` on a div tells a screen reader "button" and changes nothing
 * else. The browser turns Enter and Space into a click for a real `<button>`
 * and for nothing else, so a div that carries the role announces an action it
 * cannot perform. Add a missing `tabindex` and it is not even reachable.
 *
 * This site had both kinds at once: carousel arrows that took focus and ignored
 * every key, and accordion headers with no tabindex at all.
 *
 * `<a role="button">` is counted too. A link styled as a button still navigates
 * on Enter but not on Space, so the role is a promise it half keeps.
 */
export const realButtons: Check = {
  id: 'real-buttons',
  title: 'Buttons are real buttons',
  wcag: ['2.1.1', '4.1.2'],

  async run(page) {
    const found = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('[role="button"]')).filter(
        (el) => el.tagName !== 'BUTTON',
      )

      return nodes.map((el) => ({
        tag: el.tagName.toLowerCase(),
        cls: (el.getAttribute('class') ?? '').split(/\s+/).slice(0, 2).join(' '),
        focusable: el.hasAttribute('tabindex'),
      }))
    })

    if (!found.length) return { status: 'pass' }

    /**
     * The ones with no tabindex are worse and are named first: those cannot be
     * reached at all, where the others can be reached but not operated.
     */
    const unreachable = found.filter((n) => !n.focusable)
    const first = unreachable[0] ?? found[0]

    return {
      status: 'fail',
      count: found.length,
      sample: `${first.tag}.${first.cls.split(' ').join('.')}`,
      detail:
        `${found.length} element(s) use role="button" instead of <button>` +
        (unreachable.length
          ? `. ${unreachable.length} of them have no tabindex, so a keyboard cannot reach them at all.`
          : '. They take focus but do not respond to Enter or Space.'),
    }
  },
}
