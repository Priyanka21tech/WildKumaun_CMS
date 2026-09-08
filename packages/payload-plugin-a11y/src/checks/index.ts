import type { Check } from '../types'

import { realButtons } from './real-buttons'
import { tables } from './tables'
import { videoCaptions } from './video-captions'
import { linkText } from './link-text'
import { imageAlt } from './image-alt'
import { zoom } from './zoom'
import { liveRegions } from './live-regions'
import { keyboardReachable, keyboardTrap, focusVisible } from './keyboard'

/**
 * The checks this package runs, on top of axe.
 *
 * Ordered by cost. The ones that only read the DOM come first and finish in
 * milliseconds; the keyboard walk presses Tab up to eighty times and the zoom
 * check resizes the window, so both are left until the cheap answers are in.
 * On a page that fails early this ordering is the difference between a report in
 * seconds and one in minutes.
 *
 * Three of the seventeen checkpoints are deliberately absent: form error
 * announcement, audio description, and reliance on colour or hover. The first is
 * buildable and simply is not built yet; the other two need a person, and the
 * report records them as such rather than leaving them looking finished.
 */
export const CHECKS: Check[] = [
  // Read the DOM once and answer.
  realButtons,
  tables,
  videoCaptions,
  linkText,
  imageAlt,
  liveRegions,
  // Drive the browser.
  keyboardReachable,
  keyboardTrap,
  focusVisible,
  zoom,
]

export {
  realButtons,
  tables,
  videoCaptions,
  linkText,
  imageAlt,
  liveRegions,
  keyboardReachable,
  keyboardTrap,
  focusVisible,
  zoom,
}
