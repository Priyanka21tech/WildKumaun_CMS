/**
 * Finds the nearest accessible version of a colour.
 *
 * Darkens (or lightens) in HSL while holding hue and saturation, so the result
 * still reads as the same brand colour rather than an arbitrary substitute, and
 * stops at the first step that clears the target ratio.
 */

const srgb = (c) => {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
const hex2rgb = (h) => {
  const s = h.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16))
}
const rgb2hex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  const d = max - min
  if (d) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h, s, l]
}
function hsl2rgb([h, s, l]) {
  if (!s) { const v = l * 255; return [v, v, v] }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  const f = (t) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]
}

function fix(fgHex, bgHex, target = 4.5) {
  const bg = hex2rgb(bgHex)
  const [h, s, l0] = rgb2hsl(hex2rgb(fgHex))
  const bgLighter = lum(bg) > 0.5
  for (let step = 0; step <= 100; step++) {
    const l = bgLighter ? l0 - step / 100 : l0 + step / 100
    if (l < 0 || l > 1) break
    const cand = hsl2rgb([h, s, l])
    if (ratio(cand, bg) >= target) {
      return { hex: rgb2hex(cand), ratio: +ratio(cand, bg).toFixed(2), steps: step }
    }
  }
  return null
}

const CASES = [
  ['#dcb415', '#ffffff', 'gold links + nav menu on white', 41],
  ['#7a7a7a', '#ffffff', 'muted body text on white', 6],
  ['#3a3a3a', '#11202a', 'form labels on dark navy', 5],
]

console.log('\n  current                        ->  accessible (same hue)\n')
for (const [fg, bg, label, count] of CASES) {
  const now = ratio(hex2rgb(fg), hex2rgb(bg)).toFixed(2)
  const f = fix(fg, bg)
  console.log(
    `  ${fg} on ${bg}  ${String(now).padStart(5)}:1  ->  ` +
      `${f ? `${f.hex}  ${String(f.ratio).padStart(5)}:1` : 'no same-hue fix — needs a different colour'}`,
  )
  console.log(`      ${label}  (x${count})\n`)
}

// The dark-navy case is worth checking against white too, since a label on a
// dark panel is normally light rather than a darker grey.
const white = ratio(hex2rgb('#ffffff'), hex2rgb('#11202a')).toFixed(2)
const gold = ratio(hex2rgb('#dcb415'), hex2rgb('#11202a')).toFixed(2)
console.log(`  on #11202a:  white = ${white}:1    brand gold #dcb415 = ${gold}:1\n`)
