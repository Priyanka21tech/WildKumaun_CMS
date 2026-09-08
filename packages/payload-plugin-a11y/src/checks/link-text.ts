import type { Check } from '../types'

/**
 * Links that say nothing on their own.
 *
 * A screen reader can list every link on a page and read that list aloud,
 * separated from the paragraphs around it. "Read more" beside a photograph of a
 * bird is clear; six identical "Read more" entries in a list are not.
 *
 * Checked against the accessible name rather than the visible words, so a link
 * whose text is vague but which carries an aria-label passes — that is the
 * normal way to fix this without changing the design.
 */
const VAGUE = new Set([
  'click here',
  'here',
  'read more',
  'more',
  'learn more',
  'know more',
  'view more',
  'see more',
  'details',
  'continue',
  'link',
  'this page',
  'download',
  'order know',
])

export const linkText: Check = {
  id: 'link-text',
  title: 'Links have meaningful text',
  wcag: ['2.4.4'],

  async run(page) {
    const found = await page.evaluate(() => {
      const vagueWords = [
        'click here', 'here', 'read more', 'more', 'learn more', 'know more',
        'view more', 'see more', 'details', 'continue', 'link', 'this page',
        'download', 'order know',
      ]

      const problems: { kind: string; text: string; href: string }[] = []

      for (const link of Array.from(document.querySelectorAll('a'))) {
        const style = window.getComputedStyle(link)
        if (style.display === 'none' || style.visibility === 'hidden') continue

        const href = link.getAttribute('href') ?? ''

        /**
         * The accessible name, in the order assistive technology builds it:
         * aria-label wins, then the text, then an image's alt, then title.
         */
        const label = link.getAttribute('aria-label')?.trim()
        const text = link.textContent?.replace(/\s+/g, ' ').trim() ?? ''
        const imgAlt = link.querySelector('img')?.getAttribute('alt')?.trim() ?? ''
        const title = link.getAttribute('title')?.trim() ?? ''
        const name = label || text || imgAlt || title

        if (!name) {
          problems.push({ kind: 'empty', text: '', href })
          continue
        }

        // Only when nothing better was supplied — an aria-label is the fix, so a
        // link that has one is not a finding even if its visible words are vague.
        if (!label && vagueWords.includes(name.toLowerCase())) {
          problems.push({ kind: 'vague', text: name, href })
        }
      }

      return problems
    })

    if (!found.length) return { status: 'pass' }

    const empty = found.filter((f) => f.kind === 'empty')
    const vague = found.filter((f) => f.kind === 'vague')
    const first = empty[0] ?? vague[0]

    const parts = [
      empty.length ? `${empty.length} link(s) with no accessible name at all` : null,
      vague.length ? `${vague.length} with text that means nothing on its own` : null,
    ].filter(Boolean)

    return {
      status: 'fail',
      count: found.length,
      sample: first.text ? `"${first.text}" → ${first.href}` : first.href,
      detail: `${parts.join(', ')}. Give each an aria-label naming where it goes.`,
    }
  },
}

export { VAGUE }
