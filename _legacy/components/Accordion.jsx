'use client'

import { useState } from 'react'

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0)

  return (
    <div className="mx-auto max-w-4xl divide-y divide-rule border-y border-rule">
      {items.map((f, i) => {
        const isOpen = open === i
        return (
          <div key={f.id}>
            <h2>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                aria-controls={`faq-${f.id}`}
                className="flex w-full items-start justify-between gap-6 py-5 text-left transition-colors hover:text-brand"
              >
                <span className="font-sans text-body-lg font-heading text-ink">{f.question}</span>
                <span aria-hidden="true" className="mt-1 shrink-0 font-roboto text-h5 leading-none text-brand">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
            </h2>
            <div id={`faq-${f.id}`} hidden={!isOpen} className="pb-7">
              {f.answer ? <p className="text-body leading-body">{f.answer}</p> : null}
              {f.points?.length ? (
                <ul className="mt-4 ml-5 list-disc space-y-3 text-body leading-body marker:text-brand">
                  {f.points.map((p, n) => <li key={n}>{p}</li>)}
                </ul>
              ) : null}
              {f.closing ? <p className="mt-4 text-body leading-body">{f.closing}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
