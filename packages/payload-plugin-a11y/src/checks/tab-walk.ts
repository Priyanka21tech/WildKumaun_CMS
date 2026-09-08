import type { A11yPage } from '../types'

/** What the page looked like at one stop along the tab order. */
export interface TabStop {
  /** Index in the tab order, from 0. */
  order: number
  tag: string
  /** A short selector, enough to find the element again. */
  selector: string
  /** The name a screen reader would announce, as far as the DOM can say. */
  name: string
  /** Whether anything visibly marks this element as focused. */
  hasIndicator: boolean
  outline: string
  boxShadow: string
}

export interface TabWalk {
  stops: TabStop[]
  /** Elements a mouse can activate that the tab order never reached. */
  unreachable: { selector: string; name: string }[]
  /** True if focus stopped moving before the walk ended — a trap. */
  trapped: boolean
  /** Where it got stuck, when it did. */
  trappedAt?: string
}

/**
 * Press Tab through the page and record where focus lands.
 *
 * Three checkpoints need this and all three need the same data, so it runs once
 * and is cached against the page. Without the cache a scan would walk every page
 * three times, which on twenty-six pages is most of the run spent pressing the
 * same key.
 *
 * Real Tab presses rather than calling .focus() in script, because they are not
 * the same thing. A programmatic focus does not always trigger :focus-visible,
 * and it reaches elements the tab order skips — so it would report a keyboard
 * experience nobody can actually have.
 */
const cache = new WeakMap<A11yPage, Promise<TabWalk>>()

/** Long enough for the pages here; a stop beyond this is a menu, not a page. */
const MAX_STOPS = 80

export function tabWalk(page: A11yPage): Promise<TabWalk> {
  const existing = cache.get(page)
  if (existing) return existing

  const walk = collect(page)
  cache.set(page, walk)
  return walk
}

async function collect(page: A11yPage): Promise<TabWalk> {
  // Start from the very top of the document so the first Tab lands on the first
  // stop rather than wherever the browser happened to leave focus.
  await page.evaluate(() => {
    const body = document.body as HTMLElement & { focus?: () => void }
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    body.focus?.()
    window.scrollTo(0, 0)
  })

  const stops: TabStop[] = []
  const seen = new Set<string>()
  let trapped = false
  let trappedAt: string | undefined

  for (let index = 0; index < MAX_STOPS; index++) {
    await page.keyboard.press('Tab')

    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null
      if (!el || el === document.body) return null

      /**
       * The framework's own development overlay is not part of the site.
       *
       * Next renders an error and route indicator into a <nextjs-portal> element
       * that only exists while `next dev` is running. It takes focus, has no
       * focus ring, and would be reported on every page of every scan — a
       * permanent failure about something no visitor will ever see.
       */
      if (el.closest('nextjs-portal, #__next-build-watcher, [data-nextjs-toast]')) return null

      const style = window.getComputedStyle(el)

      /**
       * "Visible" means something actually changed, not that a property is set.
       * `outline-style: none`, a zero width, or a transparent colour are all ways
       * a stylesheet takes the indicator away while leaving the property there.
       */
      const outlineWidth = parseFloat(style.outlineWidth || '0')
      const hasOutline =
        style.outlineStyle !== 'none' &&
        outlineWidth > 0 &&
        style.outlineColor !== 'transparent' &&
        !/rgba\([^)]*,\s*0\s*\)/.test(style.outlineColor)

      const hasShadow = style.boxShadow !== 'none' && style.boxShadow.trim() !== ''

      /**
       * Enough to tell two elements apart, not just two kinds of element.
       *
       * The tag alone is not: a page of plain links all describe themselves as
       * `a`, and comparing those made three ordinary links in a row look like
       * focus stuck on one. The href is what separates them.
       */
      const base =
        el.id
          ? `#${el.id}`
          : el.className && typeof el.className === 'string' && el.className.trim()
            ? `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
            : el.tagName.toLowerCase()

      const href = el.getAttribute('href')
      const selector = href ? `${base}[href="${href.slice(0, 60)}"]` : base

      const name =
        el.getAttribute('aria-label') ??
        (el as HTMLInputElement).labels?.[0]?.textContent ??
        el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 60) ??
        ''

      return {
        tag: el.tagName.toLowerCase(),
        selector,
        name,
        hasIndicator: hasOutline || hasShadow,
        outline: `${style.outlineStyle} ${style.outlineWidth} ${style.outlineColor}`,
        boxShadow: style.boxShadow.slice(0, 80),
      }
    })

    if (!stop) break

    const key = `${stop.selector}|${stop.name}`

    /**
     * Focus that does not move is a trap.
     *
     * Checked as three consecutive presses landing on the same element rather
     * than one, because a single repeat can be an element that legitimately
     * holds focus for a moment. Three is the browser telling us Tab does nothing
     * here.
     */
    const keyOf = (s: TabStop) => `${s.selector}|${s.name}`
    const last = stops[stops.length - 1]
    const secondLast = stops[stops.length - 2]
    if (last && secondLast && keyOf(last) === key && keyOf(secondLast) === key) {
      trapped = true
      trappedAt = stop.selector
      break
    }

    stops.push({ order: index, ...stop })

    // Back at the first stop means the tab order has come full circle, which is
    // the normal end of a walk rather than a problem.
    if (index > 0 && key === `${stops[0].selector}|${stops[0].name}`) break
    seen.add(key)
  }

  /**
   * Things a mouse can use that Tab never reached.
   *
   * Only elements that look interactive and are visible — a hidden menu item is
   * meant to be out of the tab order until its menu opens, and reporting those
   * would bury the real findings under every dropdown on the site.
   */
  const unreachable = await page.evaluate((reached: string[]) => {
    const reachedSet = new Set(reached)

    /**
       * The visibility test is written inline rather than as a helper: esbuild
       * wraps a function declared inside an evaluate callback with a `__name`
       * helper that does not exist in the browser, and the check dies there.
       */
    const candidates = Array.from(
      document.querySelectorAll(
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"], [onclick]',
      ),
    ).filter((el) => {
      // The dev overlay again — see the note in the walk above.
      if (el.closest('nextjs-portal, #__next-build-watcher, [data-nextjs-toast]')) return false
      const style = window.getComputedStyle(el)
      if (style.visibility === 'hidden' || style.display === 'none') return false
      if (parseFloat(style.opacity || '1') === 0) return false
      const box = el.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) return false
      if (el.getAttribute('tabindex') === '-1') return false
      if ((el as HTMLButtonElement).disabled) return false
      return true
    })

    return candidates
      .map((el) => {
        // Built exactly as the walk builds it, href included — the two are
        // compared as strings, so any difference in shape reads as a miss.
        const base = el.id
          ? `#${el.id}`
          : el.className && typeof el.className === 'string' && el.className.trim()
            ? `${el.tagName.toLowerCase()}.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
            : el.tagName.toLowerCase()

        const href = el.getAttribute('href')
        const selector = href ? `${base}[href="${href.slice(0, 60)}"]` : base

        const name =
          el.getAttribute('aria-label') ??
          el.textContent?.replace(/\s+/g, ' ').trim().slice(0, 60) ??
          ''

        return { selector, name }
      })
      .filter((item) => !reachedSet.has(`${item.selector}|${item.name}`))
  }, [...seen])

  return { stops, unreachable, trapped, trappedAt }
}
