/**
 * Remove columns left behind by fields that no longer exist, before Payload boots.
 *
 * Payload syncs the database to the config on start. When a field is removed and
 * another added in the same change, that sync cannot tell a new column from a
 * renamed one, so it stops and asks — which is a question about this project's
 * history that nobody starting a dev server should have to answer.
 *
 * Two changes left orphans behind:
 *
 *   header         a call-to-action button was added and then removed, the live
 *                  header having none, and a `ticker` added for the line it does
 *                  scroll. Seven `cta_*` columns were left over, and the sync
 *                  asked whether `ticker` was one of them renamed.
 *
 *   site_settings  `intro`, `positioning` and `how_to_reach` were page content
 *                  filed under a global by mistake, and were removed once that was
 *                  clear. `address_map_url` was added in the same change, and the
 *                  sync asked whether it was `intro` renamed.
 *
 * In both cases the answer is no, so the leftovers are dropped here before the
 * question can be asked. That includes the two tables `positioning` and
 * `how_to_reach` became — dropping those does not raise a rename question, but it
 * does raise a data-loss warning, which is another prompt to answer.
 *
 * Nothing is lost. Every one of these was seeded from content/site-settings.json
 * and is still there: positioning and how-to-reach are page content waiting for
 * the blocks that will render them, and intro now lives on as the header's ticker.
 *
 * Runs before every dev start and does nothing once the columns are gone. It also
 * does nothing, quietly, if the database is not reachable or the table does not
 * exist yet — a first run on an empty database has no orphans to clear, and this
 * must never be the reason a dev server fails to start.
 */
import pg from 'pg'

/**
 * Columns belonging to fields the config no longer has, by table. `prefix` covers
 * a whole field group; `columns` names them one at a time.
 *
 * Array fields are not listed: those live in tables of their own, and a dropped
 * table with no new one beside it is unambiguous, so the sync removes it silently.
 */
const ORPHANS = [
  { table: 'header', prefix: 'cta_' },
  { table: 'site_settings', columns: ['intro'] },
]

/** Tables an array field left behind. Dropped whole. */
const ORPHAN_TABLES = ['site_settings_positioning', 'site_settings_how_to_reach']

const connectionString = process.env.DATABASE_URL
if (!connectionString) process.exit(0)

const client = new pg.Client({ connectionString })

try {
  await client.connect()

  for (const { table, prefix, columns } of ORPHANS) {
    // Asking the database which of them are actually there keeps this safe to run
    // against a fresh install, where none of them ever existed.
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
         AND (($2::text IS NOT NULL AND column_name LIKE $2) OR column_name = ANY($3::text[]))`,
      [table, prefix ? `${prefix}%` : null, columns ?? []],
    )

    for (const { column_name: column } of rows) {
      // Identifiers cannot be parameterised, and these came from
      // information_schema rather than from anything a user typed.
      await client.query(`ALTER TABLE "${table}" DROP COLUMN IF EXISTS "${column}"`)
    }

    if (rows.length) {
      console.log(`dropped ${rows.length} orphaned column(s) from "${table}"`)
    }
  }

  for (const table of ORPHAN_TABLES) {
    const { rows } = await client.query(
      `SELECT 1 FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1`,
      [table],
    )
    if (!rows.length) continue

    // The name is from information_schema, not from anything a user typed.
    await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`)
    console.log(`dropped orphaned table "${table}"`)
  }
} catch {
  // Not reachable, not created yet, or no permission — all fine. The sync will
  // ask its question in that case, which is where this started, but a database
  // that cannot be cleaned is not a reason to refuse to start.
} finally {
  await client.end().catch(() => {})
}
