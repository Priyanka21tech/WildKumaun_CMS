import { esc } from '../components/SiteHeader'
import { resolveHref } from '../fields/link'
import { asMedia, img, responsive, type MediaDoc } from './widgets'
import type { MediaMap } from './media-map'

/**
 * Render the blog archive from the Posts collection.
 *
 * The one page on the site the origin did not build in Elementor. It is Astra's
 * own archive template — `<div class="ast-row">` holding an `<article>` a post —
 * so there is no section to take over and no widget hash to render into, and none
 * of the machinery in src/lib/sections.ts applies. What carries the appearance
 * here is Astra's class names, so those are the contract, the way the Elementor
 * hashes are everywhere else.
 *
 * Two anchors the origin writes are dropped: the category links to
 * /category/general and the author to /author/adminneer, and neither route is in
 * the mirror — both are a 404 today. The stylesheet colours `.entry-meta *`
 * rather than `.entry-meta a`, so the words stay the blue they already are and
 * only stop being a link to nowhere.
 */

export type PostDoc = {
  id?: number | string
  title?: string | null
  page?: unknown
  excerpt?: string | null
  image?: unknown
  category?: string | null
  author?: string | null
}

/** Where a card points — its page, by way of the same resolver the menu uses. */
const hrefFor = (post: PostDoc): string =>
  resolveHref({ type: 'reference', reference: post.page as never })

/**
 * The picture above the card, where there is one.
 *
 * Astra puts `ast-no-thumb` on the wrapper when a post has no featured image, and
 * hangs the spacing off it — `.ast-no-thumb .ast-blog-featured-section{margin-bottom:0}`.
 * So the class has to come and go with the picture, not be written once.
 */
function thumbnail(post: PostDoc, media: MediaDoc | null): string {
  if (!media) return ''

  return `<a class="post-thumb-img-custom-link" href="${esc(hrefFor(post))}">${img(
    { ...media, alt: media.alt || post.title || '' },
    'wp-post-image',
  )}</a>`
}

/** One card. */
function article(post: PostDoc, map: MediaMap): string {
  const media = asMedia(post.image)
  const href = esc(hrefFor(post))
  const title = esc(post.title)
  const id = `post-${post.id ?? 0}`

  // The origin's own class list, with the category folded in the way WordPress
  // writes it and the no-thumb class only where it belongs.
  const category = (post.category ?? '').trim()
  const categoryClass = category ? ` category-${esc(category.toLowerCase().replace(/\s+/g, '-'))}` : ''
  const layout = media ? 'ast-post-format- blog-layout-1' : 'ast-post-format- ast-no-thumb blog-layout-1'

  return `<article class="${id} post type-post status-publish format-standard hentry${categoryClass} ast-grid-common-col ast-full-width ast-article-post" id="${id}" itemscope="itemscope" itemtype="https://schema.org/CreativeWork">
<div class="${layout}">
<div class="post-content ast-grid-common-col">
<div class="ast-blog-featured-section post-thumb ast-grid-common-col ast-float">${responsive(
    thumbnail(post, media),
    map,
  )}</div> <header class="entry-header">
<h2 class="entry-title" itemprop="headline"><a href="${href}" rel="bookmark">${title}</a></h2> <div class="entry-meta"><span class="cat-links">${esc(
    category,
  )}</span> / By <span class="posted-by vcard author" itemprop="author" itemscope="itemscope" itemtype="https://schema.org/Person">
<span class="author-name" itemprop="name">${esc(post.author)}</span>
</span>
</div> </header><!-- .entry-header -->
<div class="entry-content clear" itemprop="text">
<p>${esc(post.excerpt)}</p>
<p class="read-more"> <a class="" href="${href}"> <span class="screen-reader-text">${title}</span> Read More &raquo;</a></p>
</div><!-- .entry-content .clear -->
</div><!-- .post-content -->
</div> <!-- .blog-layout-1 -->
</article><!-- #post-## -->`
}

/**
 * Swap the mirrored cards for the collection's.
 *
 * The `ast-row` wrapper stays: Astra's grid rules are on it, and rebuilding it
 * would mean reproducing them. Only what is inside changes.
 *
 * An empty collection leaves the page alone, the same contract every other
 * renderer has — a blog listing showing the three posts it has always shown is a
 * far smaller problem than an archive with nothing on it.
 */
const ROW = '<div class="ast-row">'
const ROW_END = '</div> </main>'

export function replacePostList(html: string, posts: PostDoc[], map: MediaMap): string {
  if (!posts.length) return html

  const start = html.indexOf(ROW)
  if (start === -1) return html

  const end = html.indexOf(ROW_END, start)
  if (end === -1) return html

  const cards = posts.map((post) => article(post, map)).join('\n')

  return html.slice(0, start + ROW.length) + cards + html.slice(end)
}
