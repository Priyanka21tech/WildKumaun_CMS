import type { Check } from '../types'

/**
 * Tables that cannot be read out of order.
 *
 * Someone listening to a table does not see the row and column they are in, so
 * the browser tells them — but only when the markup says which cells are
 * headers. Without `<th scope>` every cell is just a value, and a table of
 * prices becomes a list of numbers.
 *
 * The caption is the other half: it is the table's name, and it is what lets a
 * reader skip a table they do not need instead of listening to all of it.
 *
 * A layout table — one used to position things rather than to relate them —
 * would fail this too, and should: it is the kind of table that belongs in CSS.
 */
export const tables: Check = {
  id: 'table-structure',
  title: 'Tables have captions and header cells',
  wcag: ['1.3.1'],

  async run(page) {
    const found = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table')).map((table, index) => ({
        index,
        caption: Boolean(table.querySelector('caption')?.textContent?.trim()),
        headers: table.querySelectorAll('th').length,
        scoped: table.querySelectorAll('th[scope]').length,
        cls: (table.getAttribute('class') ?? '').split(/\s+/)[0] ?? '',
      }))
    })

    // No tables is not a failure. The checkpoint has nothing to be true about.
    if (!found.length) return { status: 'pass', detail: 'No tables on this page.' }

    const bad = found.filter((t) => !t.caption || t.headers === 0 || t.scoped === 0)
    if (!bad.length) return { status: 'pass', count: found.length }

    const first = bad[0]
    const missing = [
      !first.caption ? 'no <caption>' : null,
      first.headers === 0 ? 'no <th>' : null,
      first.headers > 0 && first.scoped === 0 ? 'no scope on <th>' : null,
    ].filter(Boolean)

    return {
      status: 'fail',
      count: bad.length,
      sample: first.cls ? `table.${first.cls}` : `table:nth-of-type(${first.index + 1})`,
      detail: `${bad.length} of ${found.length} table(s) incomplete — first has ${missing.join(', ')}.`,
    }
  },
}
