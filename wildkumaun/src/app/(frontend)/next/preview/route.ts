import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * The door into draft mode.
 *
 * Live Preview points its iframe here rather than straight at the page, because
 * a page has no way of knowing on its own that it is being previewed. This route
 * sets Next's draft-mode cookie and then sends the browser on to the real path;
 * from that point every request from inside the iframe carries the cookie, the
 * page sees `isEnabled`, and it queries drafts instead of published documents.
 *
 * The auth check is the point of the whole route. Drafts are unpublished work —
 * a half-written page, a price that has not been agreed. Without this anyone who
 * guessed the URL could switch their own browser into draft mode and read all of
 * it. payload.auth reads the same payload-token cookie the admin panel sets, so
 * an editor already signed in at /admin passes without doing anything, and
 * everyone else gets a 401.
 *
 * `path` is a relative path and is checked to be one. Redirecting to whatever a
 * query string asks for is an open redirect: a link to
 * /next/preview?path=https://example.com would send someone off this site with
 * the URL still looking like ours.
 */
export async function GET(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const requested = searchParams.get('path')

  // A single leading slash, and no scheme or protocol-relative prefix.
  const path = requested && /^\/(?!\/)/.test(requested) ? requested : '/'

  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return new Response('Unauthorised — sign in at /admin to preview drafts.', {
      status: 401,
    })
  }

  const draft = await draftMode()
  draft.enable()

  // redirect throws, so nothing after this runs. It is outside the try/catch it
  // would otherwise be swallowed by.
  redirect(path)
}
