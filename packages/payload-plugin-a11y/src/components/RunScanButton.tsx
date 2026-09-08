'use client'

import React, { useState } from 'react'

type Outcome =
  | { state: 'idle' }
  | { state: 'running' }
  | { state: 'done'; pages: number; failed: number; manual: number }
  | { state: 'error'; message: string }

/**
 * The button above the report list.
 *
 * A scan opens a browser and walks every page, so it takes minutes rather than
 * seconds. That shapes the whole component: the button has to say it is working,
 * say it for a long time without looking stuck, and refuse to be pressed twice.
 *
 * No progress bar, because the endpoint writes its rows at the end of the run and
 * has nothing to report until then. A bar that moves on a timer rather than on
 * real progress is a lie that costs trust the first time somebody notices.
 */
export const RunScanButton: React.FC = () => {
  const [outcome, setOutcome] = useState<Outcome>({ state: 'idle' })

  const run = async () => {
    setOutcome({ state: 'running' })

    try {
      const response = await fetch('/api/a11y/scan', {
        method: 'POST',
        // The admin panel authenticates with a cookie; without this the endpoint
        // sees no user and refuses, which reads as a broken button.
        credentials: 'include',
      })

      const body = await response.json()

      if (!response.ok) {
        setOutcome({ state: 'error', message: body?.error ?? `Scan failed (${response.status})` })
        return
      }

      setOutcome({
        state: 'done',
        pages: body.pages ?? 0,
        failed: body.failed ?? 0,
        manual: body.manual ?? 0,
      })
    } catch (error) {
      setOutcome({
        state: 'error',
        message: error instanceof Error ? error.message : 'Scan failed',
      })
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '0 0 1.5rem' }}>
      <button
        type="button"
        onClick={run}
        disabled={outcome.state === 'running'}
        className="btn btn--style-primary btn--size-small"
      >
        {outcome.state === 'running' ? 'Scanning…' : 'Run scan'}
      </button>

      {/**
       * Announced, not just shown. The result arrives minutes after the click,
       * by which time the reader has almost certainly looked away — and a report
       * about accessibility is a poor place to make somebody watch a button.
       */}
      <span role="status" aria-live="polite" style={{ fontSize: '0.9rem' }}>
        {outcome.state === 'running' && 'Opening a browser and visiting every page. This takes a few minutes.'}

        {outcome.state === 'done' &&
          `Scanned ${outcome.pages} page${outcome.pages === 1 ? '' : 's'} — ` +
            `${outcome.failed} failing check${outcome.failed === 1 ? '' : 's'}, ` +
            `${outcome.manual} needing a person. Refresh to see the rows.`}

        {outcome.state === 'error' && outcome.message}
      </span>
    </div>
  )
}

export default RunScanButton
