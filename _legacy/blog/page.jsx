import Link from 'next/link'
import { posts } from '@/lib/content'
import { Section, PageHero } from '@/components/ui'

export const metadata = { title: 'Blog' }

export default function BlogPage() {
  return (
    <>
      <PageHero title="Blog" image="/assets/images/forest-view-of-the-property-1024x683.jpg" />
      <Section>
        <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-3">
          {posts.map((p) => (
            <article key={p.id} className="group flex flex-col overflow-hidden rounded border border-rule bg-paper shadow-card">
              <Link href={`/blog/${p.id}`} className="block aspect-[3/2] overflow-hidden bg-surface">
                {p.heroImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/${p.heroImage}`}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : null}
              </Link>
              <div className="flex flex-1 flex-col p-6">
                <p className="font-roboto text-xs uppercase tracking-wide text-brand">
                  {p.category} / By {p.author}
                </p>
                <h2 className="mt-2 font-sans text-h5 font-heading leading-tight text-ink">
                  <Link href={`/blog/${p.id}`} className="transition-colors hover:text-brand">{p.title}</Link>
                </h2>
                <p className="mt-3 flex-1 text-sm leading-body text-body-muted">{p.excerpt}</p>
                <Link href={`/blog/${p.id}`} className="mt-5 font-roboto text-sm text-brand hover:underline">
                  Read More »
                </Link>
              </div>
            </article>
          ))}
        </div>
      </Section>
    </>
  )
}
