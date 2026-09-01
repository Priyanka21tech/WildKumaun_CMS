import { faqs } from '@/lib/content'
import { Section, PageHero } from '@/components/ui'
import Accordion from '@/components/Accordion'

export const metadata = { title: 'FAQs' }

export default function FaqsPage() {
  return (
    <>
      <PageHero title="FAQs" image="/assets/images/forest-view-of-the-property-1024x683.jpg" />
      <Section>
        <Accordion items={faqs} />
      </Section>
    </>
  )
}
