import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { pageIndex, pageBySlugSegments } from '@/lib/pages'
import { splitShell } from '@/lib/shell'
import { getMediaMap } from '@/lib/media-map'
import { responsiveHtml } from '@/lib/responsive-html'
import { replaceAccordion } from '@/lib/faq-accordion'
import { bannerFor, bannerOverride, replaceBannerImage } from '@/lib/page-banner'
import { replaceContentArea } from '@/lib/content-area'
import { replaceHero } from '@/lib/hero-render'
import { replaceText } from '@/lib/text-render'
import { replaceForm } from '@/lib/form-render'
import { replaceAmenities } from '@/lib/amenities-render'
import { replacePackages } from '@/lib/packages-render'
import { replaceGallery } from '@/lib/gallery-render'
import { replacePartners } from '@/lib/partners-render'
import {
  replaceTestimonialGrid,
  replaceTestimonialHeading,
  replaceTestimonialSlides,
} from '@/lib/testimonials-render'
import BodyClass from '@/components/BodyClass'
import Enhancements from '@/components/Enhancements'
import { renderSiteHeader } from '@/components/SiteHeader'
import { renderSiteFooter } from '@/components/SiteFooter'

/**
 * The header and footer now come out of the database on every request, so a save
 * in the admin panel shows on the site immediately. That is the right trade while
 * the content is being migrated and checked. Once the pages themselves are on the
 * CMS this should become ISR with on-demand revalidation, so the site is static
 * again and a publish clears just the pages that changed.
 */
export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return pageIndex.map((p: { route: string }) => ({
    slug: p.route === '/' ? [] : p.route.slice(1).split('/'),
  }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = pageBySlugSegments(slug)
  if (!page) return {}
  return {
    title: page.title,
    description: page.description,
    robots: page.robots,
    alternates: { canonical: page.route },
    openGraph: {
      title: page.og.title,
      description: page.og.description,
      url: page.og.url,
      images: page.og.image ? [page.og.image] : undefined,
    },
    twitter: {
      card: page.twitter.card,
      title: page.twitter.title,
      description: page.twitter.description,
      images: page.twitter.image ? [page.twitter.image] : undefined,
    },
  }
}

export default async function MirrorPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = pageBySlugSegments(slug)
  if (!page) notFound()

  const payload = await getPayload({ config })

  // depth 1 populates the logo upload and the page each menu link points at, so
  // resolveHref has a slug to build a path from rather than a bare id.
  const [settings, header, footer, mediaMap, faqs, testimonials, pageDoc] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
    payload.findGlobal({ slug: 'header', depth: 1 }),
    payload.findGlobal({ slug: 'footer', depth: 1 }),
    getMediaMap(payload),
    // Only the page that shows them; every other route would pay for a query it
    // has no use for.
    page.route === '/faqs'
      ? payload.find({ collection: 'faqs', limit: 0, pagination: false, sort: 'order', depth: 0 })
      : null,
    // The guest book lists every review. Anywhere else, a testimonials block on the
    // page says which to show, so there is nothing to query.
    page.route === '/guest-book'
      ? payload.find({
          collection: 'testimonials',
          limit: 0,
          pagination: false,
          sort: 'order',
          depth: 0,
        })
      : null,
    payload.find({
      collection: 'pages',
      where: { slug: { equals: page.route === '/' ? 'home' : page.route.slice(1) } },
      limit: 1,
      pagination: false,
      // 2, so the reviews a testimonials block points at arrive with their text
      // rather than as ids.
      depth: 2,
    }),
  ])

  /**
   * The header and footer are built as markup and spliced into the mirrored body,
   * rather than rendered as siblings of it. See src/lib/shell.ts: the mirror's
   * opening wrappers are closed after the footer, so the whole page has to reach
   * the browser as one string to keep that nesting intact.
   *
   * responsiveHtml runs first: the mirror asks for full-size originals, and this
   * points those requests at the sizes Payload generated on import.
   */
  const body = responsiveHtml(page.route, page.html, mediaMap)

  // The questions come from the collection now. Everything else on the page is
  // still the mirror's, so only the accordion's items are swapped out.
  /**
   * An empty banner blanks the section rather than falling back to the mirror's
   * own image. A field you can empty and see no change is not a field you control.
   */
  const banner = pageDoc.docs[0]?.banner
  // depth 1 populates it; an id on its own carries no url to point at.
  const bannerUrl = banner && typeof banner === 'object' ? (banner.url ?? null) : null
  const bannerRule = bannerFor(page.html)

  let content = faqs ? replaceAccordion(body, faqs.docs) : body

  if (testimonials) content = replaceTestimonialGrid(content, testimonials.docs)

  /**
   * Blocks take over one section of the mirrored markup each. A page with no
   * blocks renders exactly as it did, which is what makes it safe to move a
   * section at a time.
   */
  for (const block of pageDoc.docs[0]?.layout ?? []) {
    if (block.blockType === 'content') {
      content = replaceContentArea(content, block.content)
      continue
    }

    if (block.blockType === 'hero') {
      content = replaceHero(content, block, mediaMap)
      continue
    }

    if (block.blockType === 'text') {
      content = replaceText(content, block, mediaMap)
      continue
    }

    // These three take a section of the mirror over rather than the page, and
    // each is handed the media map so the pictures it adds get the same srcset
    // treatment the mirror's own images were given before the loop.
    if (block.blockType === 'amenities') {
      content = replaceAmenities(content, block, mediaMap)
      continue
    }

    if (block.blockType === 'packages') {
      content = replacePackages(content, block, mediaMap)
      continue
    }

    if (block.blockType === 'gallery') {
      content = replaceGallery(content, block, mediaMap)
      continue
    }

    if (block.blockType === 'partners') {
      content = replacePartners(content, block, mediaMap)
      continue
    }

    if (block.blockType === 'form') {
      content = replaceForm(content, block)
      continue
    }

    if (block.blockType === 'testimonials') {
      const chosen = (block.items ?? []).filter(
        (item): item is Exclude<typeof item, number> => typeof item === 'object',
      )

      content = replaceTestimonialHeading(content, block.heading)
      content = replaceTestimonialSlides(content, chosen)
    }
  }

  // A page whose lead image is an <img> rather than a CSS background needs the
  // markup changed, not a rule overridden. bannerFor says which kind this is.
  if (bannerRule) content = replaceBannerImage(content, bannerRule, bannerUrl)

  const shell = splitShell(content)

  const bannerStyle = bannerRule ? bannerOverride(bannerRule, bannerUrl) : ''

  const html = shell.ok
    ? shell.before +
      renderSiteHeader({
        settings: settings as never,
        header: header as never,
        currentPath: page.route,
      }) +
      shell.middle +
      renderSiteFooter({ settings: settings as never, footer: footer as never }) +
      shell.after
    : shell.middle

  const document = bannerStyle + html

  return (
    <>
      <BodyClass value={page.bodyClass} />
      {page.ldJson.map((json: string, i: number) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: document }} />
      <Enhancements route={page.route} />
    </>
  )
}
