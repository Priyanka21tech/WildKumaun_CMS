import { guides } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'

export const metadata = { title: 'Birding Guides' }

export default function TeamPage() {
  return (
    <>
      <PageHero title="Birding Guides" kicker="Wild Kumaon" image="/assets/images/forest-view-of-the-property-1024x683.jpg" />

      <Section>
        <SectionHeading>{guides.offerings.title}</SectionHeading>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {guides.offerings.items.map((o) => (
            <div key={o.label} className="rounded border border-rule bg-paper p-6 shadow-card">
              <h3 className="font-display text-h4 text-ink">{o.label}</h3>
              <p className="mt-3 text-sm leading-body text-body-muted">{o.text}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section tone="surface">
        <SectionHeading>{guides.pageTitle}</SectionHeading>
        <dl className="mx-auto mt-10 grid max-w-3xl gap-6 sm:grid-cols-2">
          <div>
            <dt className="font-roboto text-sm uppercase tracking-wide text-brand">Location</dt>
            <dd className="mt-2 text-body">{guides.profile.location}</dd>
          </div>
          <div>
            <dt className="font-roboto text-sm uppercase tracking-wide text-brand">Specialization</dt>
            <dd className="mt-2 text-body">{guides.profile.specialization}</dd>
          </div>
        </dl>
      </Section>

      <Section>
        <SectionHeading>{guides.whyChooseUs.title}</SectionHeading>
        <p className="mx-auto mt-8 max-w-measure text-center text-body leading-body">{guides.whyChooseUs.text}</p>
      </Section>

      <Section tone="surface">
        <SectionHeading>The Team</SectionHeading>
        <ul className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guides.team.map((m) => (
            <li key={m.name} className="rounded border border-rule bg-paper p-6 text-center shadow-card">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/${m.image}`} alt={m.name} className="mx-auto h-28 w-28 rounded-full object-cover" />
              ) : (
                <span className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-brand/20 font-display text-h3 text-brand-bronze">
                  {m.name.charAt(0)}
                </span>
              )}
              <p className="mt-4 font-roboto text-sm font-medium uppercase tracking-wide text-ink">{m.name}</p>
              <p className="mt-1 text-sm text-body-muted">{m.role}</p>
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Button href="/contact-us">Make A Booking</Button>
        </div>
      </Section>
    </>
  )
}
