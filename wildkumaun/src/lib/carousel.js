/**
 * The carousel engine.
 *
 * Deliberately plain DOM and framework-free. It is handed the elements it should
 * drive — a viewport, a track, and the slides — and it does not care what markup
 * produced them. That is what lets one engine run both sliders on this site:
 *
 *   Elementor image carousel   .swiper-container > .swiper-wrapper > .swiper-slide
 *   Sina content slider        .owl-carousel > .sina-cs-item
 *
 * and, later, a carousel rendered by the CMS block. Only the adapter that finds
 * the elements changes; this file stays the same.
 *
 * Settings match content/carousels.json — see _tools/extract-carousels.mjs.
 */

/**
 * Both sliders drop to fewer slides on narrow screens. Callers pass the three
 * breakpoint values their own markup declares.
 */
function visibleSlides({ lg, md, sm }, width) {
  if (width <= 767) return sm
  if (width <= 1024) return md
  return lg
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * @param {object} els
 * @param {HTMLElement} els.viewport  clips the track; width defines a "page"
 * @param {HTMLElement} els.track     the element that gets translated
 * @param {HTMLElement[]} els.slides  the real slides, already inside the track
 * @param {HTMLElement} [els.prevBtn]
 * @param {HTMLElement} [els.nextBtn]
 * @param {HTMLElement} [els.dotsHost] container the engine fills with bullets
 * @param {string} [els.dotClass]     class name for each bullet
 * @param {string} [els.dotActiveClass]
 */
export function createCarousel(els, settings) {
  const { viewport, track, slides: real } = els
  if (!viewport || !track || !real?.length) return () => {}

  const {
    perView = { lg: 1, md: 1, sm: 1 },
    slidesToScroll = 1,
    arrows = false,
    dots = false,
    autoplay = false,
    autoplaySpeed = 5000,
    pauseOnHover = true,
    pauseOnInteraction = true,
    infinite = true,
    speed = 500,
    spacing = 0,
    drag = true,
  } = settings

  let clones = []
  const cleanupFns = []
  let index = 0
  let shown = visibleSlides(perView, window.innerWidth)
  let slideWidth = 0
  let timer = null
  let interacted = false

  const on = (el, type, fn, opts) => {
    el.addEventListener(type, fn, opts)
    cleanupFns.push(() => el.removeEventListener(type, fn, opts))
  }

  // Looping repeats the first screenful after the last slide, so the track can
  // keep moving forwards and then snap back invisibly.
  const buildClones = () => {
    clones.forEach((c) => c.remove())
    clones = []
    if (!infinite || real.length <= shown) return
    clones = real.slice(0, shown).map((s) => {
      const clone = s.cloneNode(true)
      clone.setAttribute('aria-hidden', 'true')
      clone.dataset.carouselClone = 'true'
      track.appendChild(clone)
      return clone
    })
  }

  const allSlides = () => [...real, ...clones]
  const maxIndex = () => (infinite ? real.length : Math.max(0, real.length - shown))

  const layout = () => {
    shown = visibleSlides(perView, window.innerWidth)
    buildClones()

    slideWidth = (viewport.clientWidth - spacing * (shown - 1)) / shown

    track.style.display = 'flex'
    track.style.willChange = 'transform'
    for (const slide of allSlides()) {
      slide.style.flex = '0 0 auto'
      slide.style.width = `${slideWidth}px`
      slide.style.marginRight = `${spacing}px`
    }

    if (index > maxIndex()) index = maxIndex()
    move(false)
  }

  const move = (animate = true) => {
    const offset = index * (slideWidth + spacing)
    track.style.transitionProperty = 'transform'
    track.style.transitionDuration = animate && !prefersReducedMotion() ? `${speed}ms` : '0ms'
    track.style.transform = `translate3d(${-offset}px, 0, 0)`
    updateDots()
  }

  const goTo = (next, animate = true) => {
    index = next
    move(animate)
  }

  const nextSlide = () => {
    if (index >= maxIndex()) {
      if (!infinite) return goTo(0)
      // Slide onto the clones, then reset to the real first slide once the
      // transition ends — the two frames are identical, so the jump is unseen.
      goTo(index + slidesToScroll)
      const onEnd = () => {
        track.removeEventListener('transitionend', onEnd)
        goTo(0, false)
      }
      track.addEventListener('transitionend', onEnd)
      return
    }
    goTo(Math.min(index + slidesToScroll, maxIndex()))
  }

  const prevSlide = () => {
    if (index <= 0) return goTo(infinite ? maxIndex() : 0)
    goTo(Math.max(index - slidesToScroll, 0))
  }

  // ---- autoplay ----------------------------------------------------------
  const startAuto = () => {
    if (!autoplay || timer || prefersReducedMotion()) return
    timer = setInterval(nextSlide, autoplaySpeed)
  }
  const stopAuto = () => {
    clearInterval(timer)
    timer = null
  }
  const interact = () => {
    if (!pauseOnInteraction || interacted) return
    interacted = true
    stopAuto()
  }

  // ---- navigation --------------------------------------------------------
  if (arrows && els.nextBtn) on(els.nextBtn, 'click', () => { interact(); nextSlide() })
  if (arrows && els.prevBtn) on(els.prevBtn, 'click', () => { interact(); prevSlide() })

  let bullets = []
  if (dots && els.dotsHost) {
    bullets = real.map((_, i) => {
      const dot = document.createElement('span')
      dot.className = els.dotClass ?? 'swiper-pagination-bullet'
      dot.setAttribute('role', 'button')
      dot.setAttribute('aria-label', `Go to slide ${i + 1}`)
      on(dot, 'click', () => { interact(); goTo(i) })
      els.dotsHost.appendChild(dot)
      return dot
    })
    cleanupFns.push(() => bullets.forEach((d) => d.remove()))
  }

  function updateDots() {
    if (!bullets.length) return
    const active = ((index % real.length) + real.length) % real.length
    const cls = els.dotActiveClass ?? 'swiper-pagination-bullet-active'
    bullets.forEach((d, i) => d.classList.toggle(cls, i === active))
  }

  // ---- interaction -------------------------------------------------------
  if (pauseOnHover) {
    on(viewport, 'mouseenter', stopAuto)
    on(viewport, 'mouseleave', () => { if (!interacted) startAuto() })
  }

  if (drag) {
    let startX = null
    on(viewport, 'touchstart', (e) => { startX = e.touches[0].clientX }, { passive: true })
    on(viewport, 'touchend', (e) => {
      if (startX === null) return
      const dx = e.changedTouches[0].clientX - startX
      startX = null
      if (Math.abs(dx) < 40) return
      interact()
      dx < 0 ? nextSlide() : prevSlide()
    })
  }

  on(window, 'resize', () => layout())

  layout()
  startAuto()

  return function destroy() {
    stopAuto()
    cleanupFns.forEach((fn) => fn())
    clones.forEach((c) => c.remove())
    for (const slide of real) {
      slide.style.flex = ''
      slide.style.width = ''
      slide.style.marginRight = ''
    }
    track.style.transform = ''
    track.style.transitionDuration = ''
    track.style.display = ''
  }
}
