import { amenityGroup, imagesFor, packages } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'

export const metadata = { title: 'Work from Hills' }

export default function WorkFromHillsPage() {
  const facilities = amenityGroup('wfh-facilities')
  const activities = amenityGroup('wfh-activities')
  const pkg = packages.find((p) => p.id === 'work-from-hills')
  const shots = imagesFor('/work-from-hills').filter((i) => !i.includes('logo'))

  return (
    <>
      <PageHero title="Work from Hills" kicker="Accommodate yourself in the Nature of Sattal" image={shots[0] ? `/${shots[0]}` : undefined} />

      <Section>
        <SectionHeading>Wild Kumaon — An Eco-Resort at Sattal</SectionHeading>
        <p className="mx-auto mt-8 max-w-4xl text-body leading-body">{pkg?.blurb}</p>
        <p className="mx-auto mt-4 max-w-4xl text-body leading-body">
          Accommodation is surrounded by Naturally grown forest and is connected to the Reserve forest of Sattal.
          The Premises has Oak, Bay Berry and Rhododendron. The location provides good access to the market and
          necessary things in an emergency but also to the Wildlife, Nature and Birds of Sattal on another side.
        </p>
      </Section>

      <Section tone="surface">
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <SectionHeading align="left">{facilities.title}</SectionHeading>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {facilities.items.map((f) => (
                <li key={f.label} className="rounded border border-rule bg-paper px-4 py-3 text-center text-sm text-ink">
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <SectionHeading align="left">{activities.title}</SectionHeading>
            <ul className="mt-8 grid grid-cols-2 gap-3">
              {activities.items.map((a) => (
                <li key={a.label} className="rounded border border-rule bg-paper px-4 py-3 text-center text-sm text-ink">
                  {a.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {shots.length > 1 ? (
        <Section>
          <SectionHeading>Image Gallery</SectionHeading>
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {shots.slice(1, 13).map((im) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={im} src={`/${im}`} alt="" loading="lazy" className="aspect-square w-full rounded object-cover" />
            ))}
          </div>
        </Section>
      ) : null}

      <Section tone="dark">
        <SectionHeading>Duration</SectionHeading>
        <ul className="mt-10 flex flex-wrap justify-center gap-4">
          {pkg?.durations.map((d) => (
            <li key={d} className="rounded border border-brand px-8 py-4 font-roboto text-on-dark">{d}</li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Button href="/contact-us">{pkg?.detailCta.label}</Button>
        </div>
      </Section>
    </>
  )
}
