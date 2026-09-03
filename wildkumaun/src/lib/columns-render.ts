import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import { replaceContainer, replaceWidget } from './elementor'
import { COLUMN_TARGETS, targetFor } from './sections'
import type { MediaMap } from './media-map'
import {
  column,
  elementorHeadings,
  headingWidget,
  responsive,
  textWidget,
  widgetCss,
} from './widgets'

/**
 * Put a columns block's entries on the page, one to a column.
 *
 * The same shape every time — there is no `display` field, because the origin
 * draws these one way and the width is the target's, not the editor's. What
 * varies is how many columns there are, and that is how many entries the block
 * holds.
 *
 * Every column renders under the first column's id and the first item's widget
 * hashes, the way every other repeating run here does: within one of these rows
 * Elementor wrote an identical rule for each, so the yellow bar behind "By Air"
 * is the same rule behind "By Road". See src/lib/sections.ts.
 */

type ColumnItem = {
  heading?: string | null
  body?: SerializedEditorState | null
}

export type ColumnsBlockValue = {
  target?: string | null
  heading?: string | null
  items?: ColumnItem[] | null
}

export function replaceColumns(html: string, block: ColumnsBlockValue, map: MediaMap): string {
  const target = targetFor(COLUMN_TARGETS, block.target)
  if (!target?.item) return html

  const items = block.items ?? []
  if (!items.length) return html

  const hashes = target.item

  /**
   * The heading is a widget beside this section rather than a section of its
   * own, so it is replaced on its own. An empty field removes it, which is what
   * makes the field worth having — see replaceWidget.
   */
  const withHeading = target.headingWidget
    ? replaceWidget(
        html,
        target.headingWidget,
        block.heading ? headingWidget(target.headingWidget, block.heading) : '',
      )
    : html

  const columns = items
    .map((item) => {
      const body = item.body
        ? elementorHeadings(convertLexicalToHTML({ data: item.body, disableContainer: true }))
        : ''

      const parts = [
        hashes.label && item.heading ? headingWidget(hashes.label, item.heading) : '',
        hashes.text && body ? textWidget(hashes.text, body) : '',
      ].join('')

      return column(target.span, parts, target.columns?.[0])
    })
    .join('')

  // The typography the origin set inline goes in once for the row, not once per
  // column: every column here renders under the same widget hash, so one rule
  // reaches all of them and three copies of it would reach no more.
  return replaceContainer(
    withHeading,
    target.section,
    responsive(widgetCss(target.css) + columns, map),
  )
}
