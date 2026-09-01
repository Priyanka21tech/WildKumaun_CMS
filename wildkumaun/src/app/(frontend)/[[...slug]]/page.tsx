import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

import { pageIndex, pageBySlugSegments } from '@/lib/pages'
import { splitShell } from '@/lib/shell'
import { getMediaMap } from '@/lib/media-map'
import { responsiveHtml } from '@/lib/responsive-html'
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
  const [settings, header, footer, mediaMap] = await Promise.all([
    payload.findGlobal({ slug: 'site-settings', depth: 1 }),
    payload.findGlobal({ slug: 'header', depth: 1 }),
    payload.findGlobal({ slug: 'footer', depth: 1 }),
    getMediaMap(payload),
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
  const shell = splitShell(responsiveHtml(page.route, page.html, mediaMap))

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

  return (
    <>
      <BodyClass value={page.bodyClass} />
      {page.ldJson.map((json: string, i: number) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <Enhancements route={page.route} />
    </>
  )
}
