import { notFound } from 'next/navigation'
import { pageIndex, pageBySlugSegments } from '@/lib/pages'
import BodyClass from '@/components/BodyClass'
import Enhancements from '@/components/Enhancements'

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

  return (
    <>
      <BodyClass value={page.bodyClass} />
      {page.ldJson.map((json: string, i: number) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
      ))}
      <div dangerouslySetInnerHTML={{ __html: page.html }} />
      <Enhancements route={page.route} />
    </>
  )
}
