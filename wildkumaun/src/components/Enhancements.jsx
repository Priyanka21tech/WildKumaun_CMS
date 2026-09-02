'use client'
import { useEffect } from 'react'
import { createCarousel } from '@/lib/carousel'

/**
 * Runs the behaviour the mirrored markup needs but cannot do on its own, without
 * pulling in jQuery, Elementor and Owl Carousel to get it.
 *
 *   1. Sina content slider — the page hero. Owl's stylesheet hides it outright
 *      (.owl-carousel{display:none} until .owl-loaded is added by script), which
 *      is why the hero reads as a tall empty band.
 *   2. Elementor image carousels — slides are present but unsized, so the track
 *      collapses.
 *   3. Scroll-in sections — marked .elementor-invisible (visibility:hidden) and
 *      revealed by script when they scroll into view.
 *
 * Each adapter only locates elements and reads the configuration the markup
 * already carries; the movement itself is lib/carousel.js. When this data moves
 * into the CMS, the adapters are what get replaced.
 */

const num = (v, fallback) => {
  const n = Number(v)
  return Number.isFinite(n) && v !== '' && v !== null ? n : fallback
}

const yes = (v) => v === 'yes' || v === 'true' || v === '1'

function readJson(value) {
  try {
    return JSON.parse(value ?? '{}')
  } catch {
    return {}
  }
}

/**
 * Sina content slider — the hero. Configuration lives in data-* attributes and
 * the slides are the element's own children, so a track has to be introduced
 * for them to move as one.
 */
function initSinaSlider(root, teardown) {
  const slides = Array.from(root.children).filter((el) =>
    el.classList.contains('sina-cs-item'),
  )
  if (!slides.length) return

  const d = root.dataset

  // Owl wraps slides in .owl-stage inside .owl-stage-outer; recreating that
  // structure keeps the stylesheet's own rules applying as they were written.
  const outer = document.createElement('div')
  outer.className = 'owl-stage-outer'
  const stage = document.createElement('div')
  stage.className = 'owl-stage'
  outer.appendChild(stage)
  slides.forEach((s) => stage.appendChild(s))
  root.appendChild(outer)

  // The stylesheet keeps .owl-carousel hidden until this class appears.
  root.classList.add('owl-loaded', 'owl-drag')

  let prevBtn = null
  let nextBtn = null
  if (yes(d.nav)) {
    const nav = document.createElement('div')
    nav.className = 'owl-nav'
    prevBtn = document.createElement('button')
    prevBtn.type = 'button'
    prevBtn.className = 'owl-prev'
    prevBtn.setAttribute('aria-label', 'Previous slide')
    prevBtn.innerHTML = '<span aria-hidden="true">‹</span>'
    nextBtn = document.createElement('button')
    nextBtn.type = 'button'
    nextBtn.className = 'owl-next'
    nextBtn.setAttribute('aria-label', 'Next slide')
    nextBtn.innerHTML = '<span aria-hidden="true">›</span>'
    nav.append(prevBtn, nextBtn)
    root.appendChild(nav)
  }

  let dotsHost = null
  if (yes(d.dots)) {
    dotsHost = document.createElement('div')
    dotsHost.className = 'owl-dots'
    root.appendChild(dotsHost)
  }

  const destroy = createCarousel(
    {
      viewport: outer,
      track: stage,
      slides,
      prevBtn,
      nextBtn,
      dotsHost,
      dotClass: 'owl-dot',
      dotActiveClass: 'active',
    },
    {
      perView: {
        lg: num(d.itemLg, 1),
        md: num(d.itemMd, 1),
        sm: num(d.itemSm, 1),
      },
      arrows: yes(d.nav),
      dots: yes(d.dots),
      autoplay: yes(d.autoplay),
      autoplaySpeed: num(d.delay, 5000),
      pauseOnHover: yes(d.pause),
      pauseOnInteraction: false, // Owl keeps autoplaying after a nav click
      infinite: yes(d.loop),
      speed: num(d.speed, 500),
      drag: yes(d.mouseDrag) || yes(d.touchDrag),
    },
  )

  teardown.push(() => {
    destroy()
    root.classList.remove('owl-loaded', 'owl-drag')
    slides.forEach((s) => root.appendChild(s))
    outer.remove()
    root.querySelector('.owl-nav')?.remove()
    root.querySelector('.owl-dots')?.remove()
  })
}

/** Elementor image carousel — configuration is one JSON blob on the widget. */
function initImageCarousel(widget, teardown) {
  const viewport = widget.querySelector('.swiper-container')
  const track = widget.querySelector('.swiper-wrapper')
  if (!viewport || !track) return

  const slides = Array.from(track.children)
  if (!slides.length) return

  const raw = readJson(widget.dataset.settings)
  const show = num(raw.slides_to_show, 1)
  const scope = widget.querySelector('.elementor-widget-container') ?? widget
  const nav = raw.navigation ?? 'none'

  // Tells the stylesheet the carousel is running, switching off Elementor's
  // "not yet initialised" fallback width rule.
  viewport.classList.add('swiper-container-initialized')

  const destroy = createCarousel(
    {
      viewport,
      track,
      slides,
      prevBtn: scope.querySelector('.elementor-swiper-button-prev'),
      nextBtn: scope.querySelector('.elementor-swiper-button-next'),
      dotsHost: scope.querySelector('.swiper-pagination'),
    },
    {
      // Elementor's own responsive defaults for this widget.
      perView: { lg: show, md: Math.min(2, show), sm: 1 },
      slidesToScroll: num(raw.slides_to_scroll, 1),
      arrows: nav === 'arrows' || nav === 'both',
      dots: nav === 'dots' || nav === 'both',
      autoplay: yes(raw.autoplay),
      autoplaySpeed: num(raw.autoplay_speed, 5000),
      pauseOnHover: yes(raw.pause_on_hover),
      pauseOnInteraction: yes(raw.pause_on_interaction),
      infinite: yes(raw.infinite),
      speed: num(raw.speed, 500),
      spacing: num(raw.image_spacing_custom?.size, 0),
    },
  )

  teardown.push(() => {
    destroy()
    viewport.classList.remove('swiper-container-initialized')
  })
}

/** Sections Elementor hides until they scroll into view. */
function initReveals(teardown) {
  const hidden = document.querySelectorAll('.elementor-invisible')
  if (!hidden.length) return

  // The animation names are Elementor's own and the keyframes are already in the
  // stylesheet, so revealing is: drop the hiding class, add the animation one.
  const reveal = (el) => {
    const { animation } = readJson(el.dataset.settings)
    el.classList.remove('elementor-invisible')
    if (animation) el.classList.add('animated', animation)
  }

  if (!('IntersectionObserver' in window)) {
    hidden.forEach(reveal)
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        reveal(entry.target)
        observer.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  )
  hidden.forEach((el) => observer.observe(el))
  teardown.push(() => observer.disconnect())
}

/**
 * Essential Addons accordions — the FAQs page.
 *
 * The stylesheet hides every answer (`.eael-accordion-content{display:none}`) and
 * shows it again only when `.active` is added, which the plugin's script does on
 * click. Without that script the page is a list of questions that do nothing when
 * you press them, and the answers are unreachable.
 *
 * One question open at a time, matching data-accordion-type="accordion"; a
 * "toggle" accordion lets several be open, so that type is left to behave that
 * way. Pressing an open question closes it.
 */
function initAccordions(teardown) {
  for (const root of document.querySelectorAll('.eael-adv-accordion')) {
    const exclusive = root.dataset.accordionType !== 'toggle'
    const headers = [...root.querySelectorAll('.eael-accordion-header')]

    const setOpen = (header, open) => {
      const content = document.getElementById(header.getAttribute('aria-controls'))
      header.classList.toggle('active', open)
      header.setAttribute('aria-expanded', String(open))
      if (content) content.classList.toggle('active', open)
    }

    for (const header of headers) {
      header.setAttribute('role', 'button')
      header.setAttribute('aria-expanded', 'false')

      const toggle = () => {
        const open = !header.classList.contains('active')
        if (exclusive) for (const other of headers) setOpen(other, false)
        setOpen(header, open)
      }

      // The markup gives headers tabindex="0" but no key handling, so a keyboard
      // could focus a question and never open it.
      const onKeyDown = (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        toggle()
      }

      header.addEventListener('click', toggle)
      header.addEventListener('keydown', onKeyDown)
      teardown.push(() => {
        header.removeEventListener('click', toggle)
        header.removeEventListener('keydown', onKeyDown)
      })
    }

    // The first answer opens on load, so the page does not read as empty.
    if (headers[0]) setOpen(headers[0], true)
  }
}

/**
 * Send an enquiry.
 *
 * The page reaches the browser as one string of markup rather than as React
 * components, so there is no onSubmit to attach — the handler has to find the
 * form in the DOM the same way the carousels do.
 *
 * It posts to the enquiries endpoint the form-builder plugin creates. The field
 * names are the plugin's own, so a submission arrives already matched to the
 * questions it answers.
 *
 * A failure leaves the form filled in and says so. Clearing what somebody typed
 * because the network dropped is the worst thing a form can do.
 */
function initForms(teardown) {
  for (const form of document.querySelectorAll('form[data-form-id]')) {
    const error = form.querySelector('.wpforms-error-container')
    const confirmation = form.parentElement?.querySelector('.wpforms-confirmation-container-full')
    const submit = form.querySelector('.wpforms-submit')

    const onSubmit = async (event) => {
      event.preventDefault()

      // The browser's own validation, used rather than reimplemented — `novalidate`
      // is on the form so this runs when we ask, not on the browser's terms.
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }

      const data = new FormData(form)
      const submissionData = [...data.entries()].map(([field, value]) => ({
        field,
        value: String(value),
      }))

      if (error) error.hidden = true
      if (submit) {
        submit.disabled = true
        // WPForms puts the "sending" wording on the button itself, so the origin's
        // own attribute is what this reads rather than a string invented here.
        if (submit.dataset.altText) submit.textContent = submit.dataset.altText
      }

      try {
        const response = await fetch('/api/enquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ form: form.dataset.formId, submissionData }),
        })

        if (!response.ok) throw new Error(String(response.status))

        form.hidden = true
        if (confirmation) confirmation.hidden = false
      } catch {
        if (error) {
          error.textContent = 'Sorry — that did not send. Please try again.'
          error.hidden = false
        }
      } finally {
        if (submit) {
          submit.disabled = false
          if (submit.dataset.submitText) submit.textContent = submit.dataset.submitText
        }
      }
    }

    form.addEventListener('submit', onSubmit)
    teardown.push(() => form.removeEventListener('submit', onSubmit))
  }
}

export default function Enhancements({ route }) {
  useEffect(() => {
    const teardown = []

    for (const root of document.querySelectorAll('.sina-content-slider.owl-carousel')) {
      initSinaSlider(root, teardown)
    }
    for (const widget of document.querySelectorAll('[data-widget_type^="image-carousel"]')) {
      initImageCarousel(widget, teardown)
    }
    initAccordions(teardown)
    initReveals(teardown)
    initForms(teardown)

    return () => teardown.forEach((fn) => fn())
  }, [route])

  return null
}
