import type { Check } from '../types'

/**
 * Does the page still work when the text is twice the size?
 *
 * Someone with low vision does not use a magnifier for one paragraph and then
 * turn it off. They browse at 200% all day. WCAG asks that nothing be lost at
 * that size — and the usual failure is not subtle: fixed-width columns and
 * absolutely-positioned sections push the page sideways, so every line of text
 * now needs a horizontal scroll to finish reading.
 *
 * Zoom is simulated by halving the viewport rather than by setting a browser
 * zoom level, because the two are equivalent to CSS and only one of them can be
 * driven reliably from a script: at 640px wide, a page laid out for 1280 sees
 * exactly what it would see at 200%.
 *
 * The viewport is put back afterwards. Checks run in sequence on the same page,
 * and one that leaves the window half-size hands the next check a different site
 * from the one it was meant to test.
 */
export const zoom: Check = {
  id: 'zoom-200',
  title: 'Page works at 200% zoom',
  wcag: ['1.4.4', '1.4.10'],

  async run(page) {
    const original = page.viewportSize() ?? { width: 1280, height: 720 }

    try {
      await page.setViewportSize({ width: Math.round(original.width / 2), height: original.height })

      const result = await page.evaluate(() => {
        const doc = document.documentElement

        /**
         * A tolerance of 2px, because sub-pixel rounding on a scaled viewport
         * produces a one-pixel overflow on pages that are perfectly fine. Any
         * real overflow is tens or hundreds of pixels.
         */
        const overflow = doc.scrollWidth - doc.clientWidth
        if (overflow <= 2) return { overflow, culprit: null as string | null, width: doc.clientWidth }

        /**
         * Which element is sticking out.
         *
         * Naming it turns "this page fails" into something a developer can open
         * and fix. The widest offender is almost always the cause rather than a
         * symptom, since one over-wide child stretches every ancestor.
         */
        let culprit: string | null = null
        let worst = 0

        for (const el of Array.from(document.querySelectorAll('body *'))) {
          const box = el.getBoundingClientRect()
          const past = box.right - doc.clientWidth
          if (past > worst && box.width > 0) {
            worst = past
            culprit = el.id
              ? `#${el.id}`
              : el.className && typeof el.className === 'string'
                ? `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : el.tagName.toLowerCase()
          }
        }

        return { overflow, culprit, width: doc.clientWidth }
      })

      if (result.overflow <= 2) return { status: 'pass' }

      return {
        status: 'fail',
        count: result.overflow,
        sample: result.culprit ?? undefined,
        detail:
          `At 200% zoom the page is ${result.overflow}px wider than the window ` +
          `(${result.width}px), so every line needs sideways scrolling to read. ` +
          (result.culprit ? `Widest offender: ${result.culprit}.` : ''),
      }
    } finally {
      await page.setViewportSize(original)
    }
  },
}
