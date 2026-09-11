/**
 * The embedded video, actually embedded — WCAG 4.1.2, and plain function.
 *
 * Elementor ships its video widget as an empty `<div class="elementor-video">`
 * with the URL parked in a `data-settings` attribute, and builds the iframe when
 * its own script runs. No origin JavaScript is loaded here, so that div stayed
 * empty on every visit: the section rendered as a blank gap, with no video, no
 * poster, and nothing to say anything had failed.
 *
 * The iframe is written at render time instead. That also settles the
 * accessibility question the widget never answered — an iframe with no `title`
 * is announced as "frame" and nothing else, so a screen-reader user is told
 * there is something here and not what.
 *
 * What this cannot do is caption the video. Captions live on YouTube's side and
 * belong to whoever uploaded it; the same is true of a transcript, which is
 * prose somebody has to write. Both are recorded as outstanding rather than
 * quietly assumed.
 */

/** Elementor's video widget, with its settings and the empty div it never fills. */
const VIDEO_WIDGET =
  /<div\b([^>]*\bclass="[^"]*elementor-widget-video[^"]*"[^>]*)>([\s\S]*?)<div class="elementor-video"><\/div>/gi

/** The youtube_url Elementor stores, escaped as it appears inside the attribute. */
const YOUTUBE_URL = /"youtube_url"\s*:\s*"([^"]+)"/

/**
 * Videos the client has replaced since the mirror was taken.
 *
 * Keyed on the id in the mirror rather than edited into content/mirror, which
 * `npm run mirror:pages` would overwrite. When this page moves onto the CMS the
 * id becomes a field and this map goes away.
 */
const REPLACEMENTS: Record<string, { id: string; title: string }> = {
  // /eco-friendly-enterprises-in-sattal — the original upload was replaced.
  Jfs6ylx7jlQ: {
    id: 'Wtt1ku97WkI',
    /**
     * The name a screen reader reads for the frame, taken from the video itself.
     *
     * An iframe with no title is announced as "frame", which tells the listener
     * something is here and nothing about what. This is the upload's own title,
     * shortened — the full one runs to twelve words and a screen reader reads
     * every one of them before the reader can decide whether to enter the frame.
     */
    title: 'Video: Wild Kumaon Sattal — a birdwatcher’s stay at the eco nature resort',
  },
}

/** The eleven-character id out of any of the URL shapes YouTube uses. */
function youtubeId(url: string): string | null {
  const clean = url.replace(/\\/g, '')
  const match =
    clean.match(/youtube\.com\/embed\/([A-Za-z0-9_-]{11})/) ??
    clean.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/) ??
    clean.match(/youtu\.be\/([A-Za-z0-9_-]{11})/)
  return match?.[1] ?? null
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export function withVideoEmbeds(html: string): string {
  return html.replace(VIDEO_WIDGET, (whole, attrs: string, inner: string) => {
    const settings = attrs.match(/data-settings='([^']*)'/)?.[1] ?? ''
    const url = settings.match(YOUTUBE_URL)?.[1]
    if (!url) return whole

    const originalId = youtubeId(url)
    if (!originalId) return whole

    const replacement = REPLACEMENTS[originalId]
    const id = replacement?.id ?? originalId
    const title = replacement?.title ?? 'Embedded video'

    /**
     * `rel=0` keeps YouTube's "up next" suggestions to the same channel, so the
     * end of the video does not hand the reader four unrelated thumbnails to
     * work out. Everything else is Elementor's own default: controls on,
     * fullscreen allowed.
     */
    const src = `https://www.youtube.com/embed/${id}?rel=0`

    const iframe =
      `<iframe title="${esc(title)}" src="${src}" ` +
      `frameborder="0" allowfullscreen ` +
      `allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" ` +
      `loading="lazy" width="100%" height="100%"></iframe>`

    return `<div${attrs}>${inner}<div class="elementor-video">${iframe}</div>`
  })
}
