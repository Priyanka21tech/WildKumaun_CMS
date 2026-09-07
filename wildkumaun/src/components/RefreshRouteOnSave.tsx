'use client'

import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * The ear on the frontend side of Live Preview.
 *
 * The admin panel renders this page in an iframe and shouts at it with
 * window.postMessage every time the document it is editing changes. Nothing here
 * reads that message's contents — it only needs to know that something changed,
 * and then ask Next to re-run the server component. The page re-queries Payload
 * with `draft: true` and streams back fresh HTML.
 *
 * That roundtrip is the whole reason this project can have Live Preview at all.
 * The pages are built by string-replacing mirrored markup on the server —
 * replaceHero, replaceGallery and the rest of src/lib — so the client-side
 * approach, which hands the document to React and expects React to render it,
 * has nothing to hand it to. Refreshing the route keeps every one of those
 * functions running exactly where it already runs.
 *
 * serverURL is not decoration: the component ignores messages that did not come
 * from that origin. Without it any page that embedded this one could feed it
 * content.
 */
export const RefreshRouteOnSave: React.FC = () => {
  const router = useRouter()

  return (
    <PayloadLivePreview
      refresh={() => router.refresh()}
      serverURL={process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'}
    />
  )
}
