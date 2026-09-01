import { site } from '@/lib/content'
import { Section, SectionHeading, PageHero } from '@/components/ui'
import EnquiryForm from '@/components/EnquiryForm'

export const metadata = { title: 'Contact Us' }

export default function ContactPage() {
  return (
    <>
      <PageHero title="Contact Us" image="/assets/images/open-area-img-1024x683.jpg" />
      <Section>
        <div className="grid gap-14 md:grid-cols-2">
          <div>
            <SectionHeading align="left">Address</SectionHeading>
            <h3 className="mt-6 font-display text-h4 text-ink">{site.legalName}</h3>
            <p className="mt-2 text-body">{site.address.full}</p>

            <ul className="mt-8 space-y-3">
              {site.contact.phones.map((p, i) => (
                <li key={`${p.number}-${i}`} className="text-sm">
                  <a href={`tel:${p.number}`} className="font-roboto text-ink transition-colors hover:text-brand">
                    {p.number}
                  </a>
                  <span className="ml-2 text-body-muted">{p.label}</span>
                </li>
              ))}
              <li className="text-sm">
                <span className="font-roboto text-ink">WhatsApp {site.contact.whatsapp}</span>
              </li>
              <li className="text-sm">
                <a href={`mailto:${site.contact.email}`} className="font-roboto text-ink transition-colors hover:text-brand">
                  {site.contact.email}
                </a>
              </li>
            </ul>

            <h3 className="mt-10 font-roboto text-sm uppercase tracking-wide text-brand">How to reach</h3>
            <dl className="mt-4 space-y-4">
              {site.howToReach.map((r) => (
                <div key={r.mode}>
                  <dt className="font-roboto text-sm font-medium text-ink">{r.mode}</dt>
                  <dd className="mt-1 text-sm leading-body text-body-muted">{r.text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <SectionHeading align="left">{site.forms.enquiry.title}</SectionHeading>
            <div className="mt-6">
              <EnquiryForm />
            </div>
          </div>
        </div>
      </Section>
    </>
  )
}
