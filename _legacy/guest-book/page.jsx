import { testimonials } from '@/lib/content'
import { Section, SectionHeading, PageHero } from '@/components/ui'

export const metadata = { title: 'Testimonials' }

export default function GuestBookPage() {
  return (
    <>
      <PageHero title="Testimonials" kicker="What our guests say" image="/assets/images/open-area-img-1024x683.jpg" />
      <Section>
        <SectionHeading>What Our Guests Say</SectionHeading>
        <div className="mt-12 columns-1 gap-6 md:columns-2 lg:columns-3">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="mb-6 break-inside-avoid rounded border border-rule bg-paper p-6 shadow-card"
            >
              <span aria-hidden="true" className="font-display text-4xl leading-none text-brand">“</span>
              <blockquote className="mt-2 text-sm leading-body text-body">{t.quote}</blockquote>
              <figcaption className="mt-5 border-t border-rule pt-4 font-roboto text-sm font-medium uppercase tracking-wide text-ink">
                {t.name}
                <span className="mt-1 block text-xs font-normal normal-case text-body-muted">{t.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>
    </>
  )
}
