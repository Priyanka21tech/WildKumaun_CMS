'use client'

import { useState } from 'react'

export default function TestimonialSlider({ items }) {
  const [i, setI] = useState(0)
  const t = items[i]

  return (
    <div className="mt-12">
      <figure className="mx-auto max-w-3xl rounded border border-rule bg-paper p-8 text-center shadow-card md:p-12">
        <span aria-hidden="true" className="font-display text-5xl leading-none text-brand">“</span>
        <blockquote className="mt-4 text-body leading-body">{t.quote}</blockquote>
        <figcaption className="mt-6 font-roboto text-sm font-medium uppercase tracking-wide text-ink">
          {t.name}
          <span className="mt-1 block text-xs font-normal normal-case text-body-muted">{t.source}</span>
        </figcaption>
      </figure>

      <div className="mt-6 flex justify-center gap-2">
        {items.map((item, n) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setI(n)}
            aria-label={`Show testimonial from ${item.name}`}
            aria-current={n === i}
            className={`h-2.5 w-2.5 rounded-full transition-colors ${n === i ? 'bg-brand' : 'bg-rule-strong hover:bg-brand-bronze'}`}
          />
        ))}
      </div>
    </div>
  )
}
