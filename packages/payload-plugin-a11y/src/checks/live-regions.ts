import type { Check } from '../types'

/**
 * When something on the page changes by itself, is anyone told?
 *
 * A sighted reader sees the carousel advance, the accordion open, the error
 * appear under the field. None of that reaches a screen reader unless the page
 * says so — through a live region, or by moving focus to what changed.
 *
 * This is the hardest of the seventeen to check honestly, because the only way
 * to prove it is to change something and listen. What can be checked is whether
 * the page has the machinery at all: a page carrying widgets that update, and no
 * live region anywhere, cannot be announcing anything.
 *
 * So a missing region is reported as a failure, and a present one as `manual` —
 * because a live region that exists is not the same as a live region that fires
 * at the right moment with the right words.
 */
export const liveRegions: Check = {
  id: 'live-regions',
  title: 'Dynamic changes are announced',
  wcag: ['4.1.3'],

  async run(page) {
    const found = await page.evaluate(() => {
      /**
       * Widgets whose content changes without the page reloading. Recognised by
       * the roles and attributes the ARIA patterns use, plus the class names the
       * two widget libraries on this site ship.
       */
      const dynamic = Array.from(
        document.querySelectorAll(
          '[aria-expanded], [role="tablist"], .swiper-container, .owl-carousel, ' +
            '.elementor-tab-title, .eael-accordion-header, form',
        ),
      ).filter((el) => {
        const style = window.getComputedStyle(el)
        return style.display !== 'none' && style.visibility !== 'hidden'
      })

      const regions = Array.from(
        document.querySelectorAll('[aria-live], [role="status"], [role="alert"], [role="log"]'),
      )

      const kinds = new Set(
        dynamic.map((el) => {
          if (el.tagName === 'FORM') return 'form'
          if (el.hasAttribute('aria-expanded')) return 'expandable'
          if (el.getAttribute('role') === 'tablist') return 'tabs'
          return 'carousel'
        }),
      )

      return {
        dynamic: dynamic.length,
        regions: regions.length,
        kinds: [...kinds],
      }
    })

    if (!found.dynamic) {
      return { status: 'pass', detail: 'Nothing on this page updates without a page load.' }
    }

    if (!found.regions) {
      return {
        status: 'fail',
        count: found.dynamic,
        sample: found.kinds.join(', '),
        detail:
          `${found.dynamic} widget(s) change the page without reloading it (${found.kinds.join(', ')}), ` +
          `and the page has no live region at all. Nothing they do is announced.`,
      }
    }

    return {
      status: 'manual',
      count: found.dynamic,
      detail:
        `${found.dynamic} updating widget(s) and ${found.regions} live region(s) present. ` +
        `Whether each change is actually announced needs a screen reader to confirm.`,
    }
  },
}
