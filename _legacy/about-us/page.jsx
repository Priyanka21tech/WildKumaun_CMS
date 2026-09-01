import { pageBySlug, imagesFor, site } from '@/lib/content'
import { Section, SectionHeading, PageHero, Button } from '@/components/ui'
import ContentBlocks from '@/components/ContentBlocks'

export const metadata = { title: 'About Us' }

export default function AboutPage() {
  const page = pageBySlug('/about-us')
  const shots = imagesFor('/about-us').filter((i) => !i.includes('logo'))

  return (
    <>
      <PageHero title="About Us" image="/assets/images/forest-view-of-the-property-1024x683.jpg" />
      <Section>
        <div className="mx-auto max-w-4xl">
          <ContentBlocks blocks={page?.content?.blocks || []} />
        </div>
        {shots.length ? (
          <div className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
            {shots.map((im) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={im} src={`/${im}`} alt="" loading="lazy" className="w-full rounded object-cover shadow-card" />
            ))}
          </div>
        ) : null}
      </Section>

      <Section tone="surface">
        <div className="grid gap-12 md:grid-cols-2">
          <div>
            <SectionHeading align="left">Vision</SectionHeading>
            <p className="mt-6 text-body leading-body">
              We want provide best services in such a way to visitor that they feel a connection with Sattal and
              understand the importance of the place, just like we do and desire for a visit again so that this
              place can promoted more for the nature .
            </p>
          </div>
          <div>
            <SectionHeading align="left">Team</SectionHeading>
            <p className="mt-6 text-body leading-body">
              A small group of people who believe in sharing and creating enterprises which is equally beneficial
              for traveller and the environment.
            </p>
          </div>
        </div>
        <div className="mt-12 text-center">
          <Button href="/contact-us">{site.ctas.primary}</Button>
        </div>
      </Section>
    </>
  )
}
