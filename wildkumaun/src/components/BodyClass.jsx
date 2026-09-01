'use client'
import { useEffect } from 'react'

/**
 * Astra keys page layout off the <body> class — ast-page-builder-template,
 * ast-plain-container and ast-separate-container lay a page out differently —
 * and the origin sets it from a script on load. The layout renders the origin's
 * server class so first paint matches; this re-applies the per-page class and
 * keeps it correct across client-side navigation.
 */
export default function BodyClass({ value }) {
  useEffect(() => {
    document.body.className = value
  }, [value])
  return null
}
