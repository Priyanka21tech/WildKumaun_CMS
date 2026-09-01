import Link from 'next/link'
import { notFound } from 'next/navigation'
import { posts, postBySlug } from '@/lib/content'
import { Section, PageHero } from '@/components/ui'
import ContentBlocks from '@/components/ContentBlocks'

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.id }))
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const post = postBySlug(slug)
  return post ? { title: post.title, description: post.excerpt } : {}
}

export default async function PostPage({ params }) {
  const { slug } = await params
  const post = postBySlug(slug)
  if (!post) notFound()

  return (
    <>
      <PageHero title={post.title} image={post.heroImage ? `/${post.heroImage}` : undefined} />
      <Section>
        <div className="mx-auto max-w-3xl">
          <p className="font-roboto text-xs uppercase tracking-wide text-brand">
            {post.category} / By {post.author}
          </p>
          <ContentBlocks blocks={post.body} className="mt-8" />

          {post.images.length > 1 ? (
            <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3">
              {post.images.slice(1).map((im) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={im} src={`/${im}`} alt="" loading="lazy" className="aspect-square w-full rounded object-cover" />
              ))}
            </div>
          ) : null}

          {post.links.length ? (
            <div className="mt-12 border-t border-rule pt-6">
              <h2 className="font-roboto text-sm uppercase tracking-wide text-body-muted">Links</h2>
              <ul className="mt-3 space-y-1">
                {post.links.map((l) => (
                  <li key={l}>
                    <a href={l} target="_blank" rel="noopener noreferrer" className="text-sm text-link hover:underline">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Link href="/blog" className="mt-12 inline-block font-roboto text-sm text-brand hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </Section>
    </>
  )
}
