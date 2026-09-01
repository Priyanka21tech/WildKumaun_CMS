import { experiences, imagesFor } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'

export const metadata = { title: 'Experiences' }

export default function ExperiencesPage() {
  const shots = imagesFor('/experiences').filter((i) => !i.includes('logo'))

  return (
    <>
      <PageHero title="Experiences" kicker="Sattal" image={shots[0] ? `/${shots[0]}` : undefined} />

      {experiences.map((e, i) => {
        const image = shots[(i % Math.max(shots.length - 1, 1)) + 1]
        return (
          <Section key={e.id} tone={i % 2 ? 'surface' : 'paper'}>
            <div className={`grid items-center gap-12 md:grid-cols-2 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div>
                <SectionHeading align="left">{e.title}</SectionHeading>
                <div className="mt-6 space-y-4">
                  {e.body.map((p, n) => (
                    <p key={n} className="text-body leading-body">{p}</p>
                  ))}
                </div>
                {e.details.length ? (
                  <ul className="mt-6 ml-5 list-disc space-y-2 text-body marker:text-brand">
                    {e.details.map((d, n) => <li key={n}>{d}</li>)}
                  </ul>
                ) : null}
                {e.duration || e.groupSize ? (
                  <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-sm">
                    {e.duration ? (
                      <div>
                        <dt className="font-roboto uppercase tracking-wide text-body-muted">Duration</dt>
                        <dd className="mt-1 text-ink">{e.duration}</dd>
                      </div>
                    ) : null}
                    {e.groupSize ? (
                      <div>
                        <dt className="font-roboto uppercase tracking-wide text-body-muted">Group size</dt>
                        <dd className="mt-1 text-ink">{e.groupSize}</dd>
                      </div>
                    ) : null}
                  </dl>
                ) : null}
                {e.cta ? <Button href={e.cta.href || '/contact-us'} className="mt-8">{e.cta.label}</Button> : null}
              </div>
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${image}`} alt={e.title} className="aspect-[4/3] w-full rounded object-cover shadow-card" />
              ) : null}
            </div>
          </Section>
        )
      })}
    </>
  )
}
