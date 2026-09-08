import type { Check } from '../types'

/**
 * Images described by nobody, and images described by their filename.
 *
 * axe checks that an `alt` attribute exists. It cannot check that the attribute
 * says anything, and that is where this fails in practice: an empty `alt` is
 * valid markup meaning "decorative, skip me", so a page of undescribed
 * photographs scans perfectly clean. This site had 200 of them, on the pages
 * that exist to show photographs.
 *
 * The second half is subtler. `alt="work from hills 1024x683"` passes every
 * automated rule ever written and is read aloud, word by word, to somebody who
 * cannot see the picture.
 *
 * What no check can tell is whether a real sentence is the *right* sentence.
 * That stays a person's job, and the report says so rather than implying the
 * page is finished.
 */
export const imageAlt: Check = {
  id: 'image-alt',
  title: 'Images have useful alt text',
  wcag: ['1.1.1'],

  async run(page) {
    const found = await page.evaluate(() => {
      /**
       * The tests are written out where they are used rather than pulled into a
       * helper, and the same is true in the other checks that run in the page.
       *
       * A function declared inside an evaluate callback is transpiled with a
       * `__name` wrapper by esbuild, and that helper does not exist in the
       * browser the function is serialised into — the whole check then dies with
       * `ReferenceError: __name is not defined`, which reads like a bug in the
       * page rather than in the tooling.
       */
      const SIZE = /\b\d{2,4}\s*[x×]\s*\d{2,4}\b/i
      const EXTENSION = /\.(jpe?g|png|gif|webp|svg)$/i
      const SLUG = /[-_]/
      const NUMBERED = /^(img|dsc|image|photo|pic|bird|banner)\s*\d+$/i

      let total = 0
      const empty: string[] = []
      const filename: { alt: string; src: string }[] = []

      for (const img of Array.from(document.querySelectorAll('img'))) {
        const style = window.getComputedStyle(img)
        if (style.display === 'none' || style.visibility === 'hidden') continue

        // Explicitly marked decorative in a way that says so on purpose.
        if (img.getAttribute('role') === 'presentation' || img.getAttribute('role') === 'none') continue
        if (img.getAttribute('aria-hidden') === 'true') continue

        total++

        const alt = img.getAttribute('alt')
        const src = (img.getAttribute('src') ?? '').split('/').pop() ?? ''

        if (alt === null) continue // axe reports a missing attribute; not this check's job.

        const text = alt.trim()
        if (text === '') {
          empty.push(src)
          continue
        }

        const derived =
          SIZE.test(text) ||
          EXTENSION.test(text) ||
          // Hyphens or underscores with no spaces: a slug, not a sentence.
          (SLUG.test(text) && !text.includes(' ')) ||
          // "IMG 2043", "bird 4", "DSC 0912".
          NUMBERED.test(text)

        if (derived) filename.push({ alt: text, src })
      }

      return { total, empty, filename }
    })

    if (!found.total) return { status: 'pass', detail: 'No images on this page.' }

    const problems = found.empty.length + found.filename.length
    if (!problems) {
      return {
        status: 'manual',
        count: found.total,
        detail:
          `All ${found.total} image(s) carry written alt text. Whether each one describes ` +
          `its picture correctly needs somebody who can see them.`,
      }
    }

    const parts = [
      found.empty.length
        ? `${found.empty.length} marked decorative with an empty alt`
        : null,
      found.filename.length
        ? `${found.filename.length} described by their filename`
        : null,
    ].filter(Boolean)

    /**
     * The consequence, matched to what was actually found.
     *
     * Both are failures but they fail differently, and a reader who is told
     * "an empty alt is skipped entirely" about a page whose alts are all
     * present learns to distrust the next sentence too.
     */
    const consequence = found.empty.length
      ? 'An empty alt tells a screen reader to skip the image entirely.'
      : 'Filename text is read out word by word and describes nothing.'

    return {
      status: 'fail',
      count: problems,
      sample: found.filename[0]?.alt ?? found.empty[0],
      detail: `${parts.join(', ')}, out of ${found.total} image(s). ${consequence}`,
    }
  },
}
