import { tour, imagesFor } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'

export const metadata = { title: 'Birding Tours' }

export default function TourPage() {
  const shots = imagesFor('/sattal-5n-6d-birding-tour').filter((i) => !i.includes('logo'))

  return (
    <>
      <PageHero title={tour.title} kicker={tour.duration} image={shots[0] ? `/${shots[0]}` : undefined} />

      <Section>
        <div className="mx-auto max-w-4xl space-y-5">
          {tour.overview.map((p, i) => (
            <p key={i} className="text-body leading-body">{p}</p>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-4xl rounded border border-brand bg-brand/10 p-8">
          <h2 className="font-sans text-h5 font-heading text-ink">Highlights</h2>
          <ul className="mt-4 ml-5 list-disc space-y-2 text-body marker:text-brand">
            {tour.highlights.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>

        <p className="mx-auto mt-8 max-w-4xl text-sm leading-body text-body-muted">{tour.logistics}</p>
      </Section>

      <Section tone="surface">
        <SectionHeading>Itinerary</SectionHeading>
        <ol className="mx-auto mt-12 max-w-4xl space-y-8">
          {tour.itinerary.map((d) => (
            <li key={d.day} className="rounded border border-rule bg-paper p-6 shadow-card md:p-8">
              <div className="flex items-baseline gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand font-roboto text-sm font-medium text-[#060101]">
                  {d.day}
                </span>
                <h3 className="font-display text-h4 text-ink">{d.title}</h3>
              </div>

              {d.intro ? <p className="mt-4 text-body leading-body">{d.intro}</p> : null}

              <div className="mt-6 space-y-6">
                {d.sessions.map((s, i) => (
                  <div key={i} className="border-l-2 border-brand-bronze pl-5">
                    <p className="font-roboto text-sm uppercase tracking-wide text-brand">
                      {s.when}{s.location ? ` — ${s.location}` : ''}
                    </p>
                    <p className="mt-2 text-body leading-body">{s.text}</p>
                    {s.species?.length ? (
                      <div className="mt-3">
                        <p className="font-roboto text-xs uppercase tracking-wide text-body-muted">Possible species</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {s.species.map((sp) => (
                            <li key={sp} className="rounded-full border border-rule bg-surface px-3 py-1 text-xs text-body">
                              {sp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 text-center">
          <Button href="/contact-us" size="lg">{tour.cta.label}</Button>
        </div>
      </Section>
    </>
  )
}
