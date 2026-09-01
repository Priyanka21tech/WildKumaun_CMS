'use client'

import { useState } from 'react'

const FIELDS = [
  { name: 'name', label: 'Name', type: 'text', required: true },
  { name: 'persons', label: 'Numbers of Persons', type: 'number', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'mobile', label: 'Mobile', type: 'tel', required: true },
]

export default function EnquiryForm() {
  const [sent, setSent] = useState(false)

  // No backend is wired up — the original site posts to a WordPress form plugin.
  // This validates and shows a confirmation so the flow is testable end to end.
  function onSubmit(e) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex items-center justify-center rounded border border-brand bg-brand/10 p-10 text-center">
        <p className="text-body">
          Thanks — your enquiry is ready to send.
          <span className="mt-2 block text-sm text-body-muted">
            No mail backend is connected yet; wire this form to your provider to go live.
          </span>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded border border-rule bg-paper p-6 shadow-card md:p-8">
      {FIELDS.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className="block font-roboto text-sm text-ink">
            {f.label} {f.required ? <span className="text-brand">*</span> : null}
          </label>
          <input
            id={f.name}
            name={f.name}
            type={f.type}
            required={f.required}
            className="mt-1.5 w-full rounded border border-rule bg-paper px-3 py-2.5 text-body outline-none transition-colors focus:border-brand"
          />
        </div>
      ))}
      <div>
        <label htmlFor="message" className="block font-roboto text-sm text-ink">Message</label>
        <textarea
          id="message"
          name="message"
          rows={4}
          className="mt-1.5 w-full rounded border border-rule bg-paper px-3 py-2.5 text-body outline-none transition-colors focus:border-brand"
        />
      </div>
      <button
        type="submit"
        className="rounded-brand bg-brand px-6 py-3 font-roboto text-[0.9rem] font-button text-[#060101] transition-all duration-300 hover:bg-brand-bright"
      >
        Send
      </button>
    </form>
  )
}
