import { notFound } from 'next/navigation'
import { pagesDoc, pageBySlug, imagesFor } from '@/lib/content'
import { Section, PageHero } from '@/components/ui'
import ContentBlocks from '@/components/ContentBlocks'

// Routes that have a hand-built page of their own — this generic renderer
// covers everything else the mirror captured (sattal, location, conservation,
// facilities, restaurant, vision, the bird lists, …).
const BESPOKE = new Set([
  '/', '/about-us', '/team', '/experiences', '/bird-art', '/gallery',
  '/guest-book', '/blog', '/faqs', '/contact-us', '/work-from-hills',
  '/sattal-5n-6d-birding-tour',
])

const routable = pagesDoc.pages.filter(
  (p) => !BESPOKE.has(p.slug) && (p.content?.blocks?.length || p.sections.length),
)

export function generateStaticParams() {
  return routable.map((p) => ({ slug: p.slug.replace(/^\//, '') }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const page = pageBySlug(`/${slug}`)
  if (!page) return {}
  return { title: page.navLabel || page.title.split('|')[0].trim(), description: page.description }
}

export default async function GenericPage({ params }) {
  const { slug } = await params
  const path = `/${slug}`
  if (BESPOKE.has(path)) notFound()

  const page = pageBySlug(path)
  if (!page) notFound()

  const blocks = page.content?.blocks || []
  const images = imagesFor(path).filter((i) => !i.includes('logo') && !i.includes('favicon'))
  const heading = page.navLabel || page.title.split('|')[0].trim()

  // Section headings the extractor found, minus anything already in the blocks.
  const sectionHeads = page.sections
    .flatMap((s) => s.headings || [])
    .map((h) => h.text)
    .filter((t) => !blocks.some((b) => b.text === t))

  return (
    <>
      <PageHero title={heading} image={images[0] ? `/${images[0]}` : undefined} />

      {blocks.length ? (
        <Section>
          <div className="mx-auto max-w-4xl">
            <ContentBlocks blocks={blocks} />
          </div>
        </Section>
      ) : null}

      {sectionHeads.length ? (
        <Section tone={blocks.length ? 'surface' : 'paper'}>
          <ul className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sectionHeads.map((t) => (
              <li key={t} className="rounded border border-rule bg-paper px-5 py-4 text-center text-sm text-ink">
                {t}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {images.length > 1 ? (
        <Section>
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
            {images.slice(1).map((im) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={im}
                src={`/${im}`}
                alt=""
                loading="lazy"
                className="mb-4 w-full break-inside-avoid rounded object-cover shadow-card"
              />
            ))}
          </div>
        </Section>
      ) : null}
    </>
  )
}
