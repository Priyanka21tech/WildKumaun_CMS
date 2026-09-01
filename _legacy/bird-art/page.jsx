import { birdArt } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'

export const metadata = { title: 'Bird Art' }

export default function BirdArtPage() {
  return (
    <>
      <PageHero title="Bird Art" kicker="Paintings" image={`/${birdArt.artworks[0].image}`} />

      <Section>
        <SectionHeading>{birdArt.title}</SectionHeading>
        <div className="mx-auto mt-8 max-w-measure space-y-4 text-center">
          <p className="font-roboto text-sm uppercase tracking-wide text-body-muted">
            {birdArt.artistStatement.lead}
          </p>
          {birdArt.artistStatement.paragraphs.map((p, i) => (
            <p key={i} className="text-body leading-body">{p}</p>
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
          {birdArt.artworks.map((a) => (
            <figure key={a.id} className="group overflow-hidden rounded border border-rule bg-paper shadow-card">
              <div className="aspect-square overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/${a.image}`}
                  alt={a.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="p-4 text-center font-display text-body-lg text-ink">{a.title}</figcaption>
            </figure>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button href="/contact-us">{birdArt.cta.label}</Button>
        </div>
      </Section>

      <Section>
        <SectionHeading>The Artists</SectionHeading>
        <div className="mx-auto mt-12 flex max-w-2xl flex-wrap justify-center gap-12">
          {birdArt.artists.map((a) => (
            <figure key={a.id} className="text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/${a.image}`} alt={a.fullName || a.name} className="mx-auto h-40 w-40 rounded-full object-cover" />
              <figcaption className="mt-4 font-roboto text-sm uppercase tracking-wide text-ink">
                {a.fullName || a.name}
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  )
}
