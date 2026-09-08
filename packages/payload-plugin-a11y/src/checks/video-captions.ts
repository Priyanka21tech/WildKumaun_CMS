import type { Check } from '../types'

/**
 * Video that a deaf viewer cannot follow.
 *
 * A `<video>` needs a `<track kind="captions">`, and that much is checkable from
 * the markup. An embedded YouTube or Vimeo player is not: the captions live on
 * the other service, behind an iframe this page cannot see into.
 *
 * So an embed is reported as `manual` rather than guessed either way. Calling it
 * a pass because captions might exist is how a checklist starts lying; calling
 * it a failure when the uploader did caption it is how people learn to ignore
 * the report. Somebody opens the video and says.
 *
 * Either kind still needs a transcript, and a transcript is prose somewhere on
 * the page — no rule can tell it apart from the rest of the copy. That part
 * stays with the person too.
 */
const EMBED = /youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com/i

export const videoCaptions: Check = {
  id: 'video-captions',
  title: 'Video has captions and a transcript',
  wcag: ['1.2.1', '1.2.2'],

  async run(page) {
    const found = await page.evaluate(() => {
      const native = Array.from(document.querySelectorAll('video')).map((v) => ({
        kind: 'video' as const,
        src: v.getAttribute('src') ?? v.querySelector('source')?.getAttribute('src') ?? '',
        captions: v.querySelectorAll('track[kind="captions"], track[kind="subtitles"]').length > 0,
      }))

      const embeds = Array.from(document.querySelectorAll('iframe')).map((f) => ({
        kind: 'iframe' as const,
        src: f.getAttribute('src') ?? '',
        captions: false,
      }))

      /**
       * A player that has not been built yet.
       *
       * Elementor stores the video URL in a settings attribute and creates the
       * iframe when somebody clicks the poster. Looking only for <iframe> misses
       * every one of those and reports a page full of video as having none —
       * which is how this check first passed a page carrying a YouTube film.
       *
       * Attribute values rather than page text, so a URL merely written in the
       * copy is not mistaken for a player.
       */
      const HOST = /(youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i
      const deferred: { kind: 'deferred'; src: string; captions: boolean }[] = []

      for (const el of Array.from(document.querySelectorAll('[data-settings], [data-video], [data-src]'))) {
        if (el.querySelector('iframe, video')) continue
        for (const attr of Array.from(el.attributes)) {
          const match = attr.value.match(
            /(?:https?:)?\\?\/\\?\/[^"'\\\s]*(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)[^"'\\\s]*/i,
          )
          if (match && HOST.test(match[0])) {
            deferred.push({ kind: 'deferred', src: match[0].replace(/\\/g, ''), captions: false })
            break
          }
        }
      }

      return [...native, ...embeds, ...deferred]
    })

    const players = found.filter((f) => f.kind === 'video' || EMBED.test(f.src))
    if (!players.length) return { status: 'pass', detail: 'No video on this page.' }

    const uncaptioned = players.filter((p) => p.kind === 'video' && !p.captions)
    if (uncaptioned.length) {
      return {
        status: 'fail',
        count: uncaptioned.length,
        sample: uncaptioned[0].src.slice(0, 120),
        detail: `${uncaptioned.length} <video> element(s) have no captions track.`,
      }
    }

    const embeds = players.filter((p) => p.kind === 'iframe' || p.kind === 'deferred')
    if (embeds.length) {
      const deferred = embeds.filter((p) => p.kind === 'deferred').length
      return {
        status: 'manual',
        count: embeds.length,
        sample: embeds[0].src.slice(0, 120),
        detail:
          `${embeds.length} embedded player(s). Open each one and confirm it has captions, ` +
          `then confirm a transcript exists on the page.` +
          (deferred
            ? ` ${deferred} of them is configured in markup but has no iframe on the page — ` +
              `check it renders at all before checking its captions.`
            : ''),
      }
    }

    return { status: 'manual', detail: 'Captions present. A transcript still needs checking.' }
  },
}
