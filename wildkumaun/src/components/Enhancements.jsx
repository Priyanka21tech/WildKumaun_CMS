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
/**
 * The header menu below 1024px — WCAG 2.1.1 Keyboard, 4.1.2 Name, Role, Value.
 *
 * This is a functional fix before it is an accessibility one. site.css hides the
 * menu at the tablet breakpoint and shows it again only for
 * `.hfe-active-menu + .hfe-nav-menu__layout-horizontal`; the class is added by
 * Header Footer Elementor's frontend.js, which this app never loads — no origin
 * JavaScript is loaded at all. So on every screen 1024px and narrower the menu
 * was unreachable for everyone, keyboard or not: the button was there, the CSS
 * was there, and nothing joined them.
 *
 * The class goes on the toggle rather than on the nav because that is the
 * sibling the origin's selector keys on. Matching its shape rather than adding a
 * rule of our own keeps the open state styled by the stylesheet that already
 * knows how to style it — including the inner <ul>, which has its own rule.
 *
 * aria-expanded is written here rather than in the markup's initial state alone,
 * for the same reason it is in initAccordions: it is state, and it changes.
 */
function initMenu(teardown) {
  for (const toggle of document.querySelectorAll('button.hfe-nav-menu__toggle')) {
    const menu = document.getElementById(toggle.getAttribute('aria-controls') ?? '')
    if (!menu) continue

    const setOpen = (open) => {
      toggle.classList.toggle('hfe-active-menu', open)
      toggle.setAttribute('aria-expanded', String(open))
    }

    const onClick = () => setOpen(toggle.getAttribute('aria-expanded') !== 'true')

    /**
     * Escape closes it and puts focus back on the button.
     *
     * Without the focus move the reader is left on a link inside a menu that has
     * just been hidden, which is the same lost-focus problem the form
     * confirmation had. Listening on the wrapper rather than the document so a
     * key pressed elsewhere on the page does nothing.
     */
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return
      if (toggle.getAttribute('aria-expanded') !== 'true') return
      setOpen(false)
      toggle.focus()
    }

    const scope = toggle.parentElement ?? toggle

    toggle.addEventListener('click', onClick)
    scope.addEventListener('keydown', onKeyDown)

    teardown.push(() => {
      toggle.removeEventListener('click', onClick)
      scope.removeEventListener('keydown', onKeyDown)
    })
  }
}

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

    /**
     * No role, no aria-expanded and no key handling set up here any more.
     *
     * src/lib/faq-accordion.ts renders each question as a real <button>, so the
     * role is in the markup and Enter and Space are the browser's job. Patching
     * those on at runtime meant the questions announced as plain text until this
     * ran, and stayed that way if it never did.
     *
     * setOpen still writes aria-expanded, because that is state rather than
     * semantics: it changes every time somebody opens a question.
     */
    for (const header of headers) {
      const toggle = () => {
        const open = !header.classList.contains('active')
        if (exclusive) for (const other of headers) setOpen(other, false)
        setOpen(header, open)
      }

      header.addEventListener('click', toggle)
      teardown.push(() => header.removeEventListener('click', toggle))
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

/** The label's text without the required asterisk, for naming a field in prose. */
function fieldLabel(form, control) {
  const label = form.querySelector(`label[for="${CSS.escape(control.id)}"]`)
  const text = (label?.textContent ?? control.name ?? '').replace('*', '').trim()
  return text || control.name || 'This field'
}

/** Every control that fails constraint validation, in the order they appear. */
function invalidFields(form) {
  return [...form.querySelectorAll('input, textarea, select')]
    .filter((control) => control.willValidate && !control.checkValidity())
    .map((control) => ({
      control,
      label: fieldLabel(form, control),
      /**
       * The browser's own wording, which is already correct for the constraint
       * that failed and already in the reader's language — except for a pattern
       * mismatch, where it is "Please match the requested format" and names
       * neither the format nor how to meet it. Fields that set a pattern carry
       * their own wording for that one case; see FIELD_SEMANTICS in
       * src/lib/form-render.ts.
       */
      message:
        control.validity.patternMismatch && control.dataset.patternMessage
          ? control.dataset.patternMessage
          : control.validationMessage,
    }))
}

/**
 * What the field points at when nothing is wrong with it.
 *
 * A field may already describe itself — the mobile number's "10 digits, numbers
 * only" is a hint rendered beside it — and an error must be added to that rather
 * than written over it. Losing the hint at the exact moment somebody has got the
 * format wrong is the worst time to lose it.
 */
function baseDescribedBy(form, control) {
  return form.querySelector(`#${CSS.escape(control.id)}-hint`) ? `${control.id}-hint` : ''
}

function clearErrors(form) {
  for (const control of form.querySelectorAll('[aria-invalid="true"]')) {
    control.removeAttribute('aria-invalid')
    const base = baseDescribedBy(form, control)
    if (base) control.setAttribute('aria-describedby', base)
    else control.removeAttribute('aria-describedby')
  }
  for (const slot of form.querySelectorAll('.wpforms-error')) {
    slot.textContent = ''
    slot.hidden = true
  }
}

/**
 * Say what went wrong, in both places a reader might be.
 *
 * The summary is for someone who has just pressed submit; the per-field message
 * is for when they get to the field. aria-describedby ties the two together so
 * the message is read as part of the field rather than as loose text near it.
 *
 * Unhidden before it is filled: a role="alert" that gains content while still
 * hidden is not reliably announced.
 */
function showErrors(form, container, problems) {
  clearErrors(form)

  for (const { control, message } of problems) {
    const slot = form.querySelector(`#${CSS.escape(control.id)}-error`)
    if (!slot) continue
    slot.textContent = message
    slot.hidden = false
    control.setAttribute('aria-invalid', 'true')
    // The hint first, then the error: the rule, then how this answer breaks it.
    control.setAttribute(
      'aria-describedby',
      [baseDescribedBy(form, control), `${control.id}-error`].filter(Boolean).join(' '),
    )
  }

  if (!container) return

  container.hidden = false
  const heading = problems.length === 1 ? 'There is a problem' : 'There are problems'
  container.innerHTML =
    `<p class="wpforms-error-heading">${heading}</p><ul>` +
    problems
      .map(
        ({ control, label, message }) =>
          `<li><a href="#${encodeURIComponent(control.id)}">${label}: ${message}</a></li>`,
      )
      .join('') +
    '</ul>'

  // Each entry is a link to the field it names, so the reader can go straight
  // there instead of tabbing back through the form looking for it.
  for (const link of container.querySelectorAll('a[href^="#"]')) {
    link.addEventListener('click', (event) => {
      event.preventDefault()
      const target = form.querySelector(`#${CSS.escape(decodeURIComponent(link.hash.slice(1)))}`)
      target?.focus()
    })
  }

  container.focus()
}

/** A message that is not about any particular field — a failed request. */
function showMessage(container, text) {
  if (!container) return
  container.hidden = false
  container.textContent = text
  container.focus()
}

function initForms(teardown) {
  for (const form of document.querySelectorAll('form[data-form-id]')) {
    const error = form.querySelector('.wpforms-error-container')
    const confirmation = form.parentElement?.querySelector('.wpforms-confirmation-container-full')
    const submit = form.querySelector('.wpforms-submit')

    const onSubmit = async (event) => {
      event.preventDefault()

      /**
       * The constraints are the browser's, the reporting is not.
       *
       * `novalidate` is on the form so validity is checked when we ask rather
       * than on the browser's terms, and this used to call reportValidity() to
       * show the result. That draws a bubble that disappears on the next
       * keystroke, names one field at a time, and is announced inconsistently
       * across screen readers — so someone who could not see it was told
       * nothing. checkValidity() still does the judging; showErrors does the
       * telling, in markup that stays on the page.
       */
      const problems = invalidFields(form)
      if (problems.length) {
        showErrors(form, error, problems)
        return
      }

      clearErrors(form)

      const data = new FormData(form)
      const submissionData = [...data.entries()].map(([field, value]) => ({
        field,
        value: String(value),
      }))

      if (error) {
        error.hidden = true
        error.textContent = ''
      }
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
        if (confirmation) {
          confirmation.hidden = false
          /**
           * Focus has to move, not just the content.
           *
           * The form it was sitting on is now hidden, so leaving focus where it
           * was drops the reader at the top of the document with no idea whether
           * anything happened. Moving it to the confirmation both announces the
           * message and leaves them somewhere real.
           */
          confirmation.focus()
        }
      } catch {
        showMessage(error, 'Sorry — that did not send. Please try again.')
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

/**
 * One adapter failing must not take the rest down with it.
 *
 * Everything here ran in a single try-less sequence, so a carousel that threw on
 * one page silently cost that page its menu, its accordions and its form
 * validation as well — and with no origin JavaScript loaded there is nothing else
 * to fall back to. Nothing announced it either; the page just quietly did less
 * than it should.
 *
 * Logged rather than swallowed, because an adapter that stops working is a bug to
 * fix, not a condition to tolerate.
 */
function run(name, fn) {
  try {
    fn()
  } catch (error) {
    console.error(`[Enhancements] ${name} failed`, error)
  }
}

export default function Enhancements({ route }) {
  useEffect(() => {
    const teardown = []

    /**
     * The menu goes first. Below 1024px it is the only way to reach any other
     * page, so it is the last thing that should depend on a carousel starting.
     */
    run('menu', () => initMenu(teardown))

    for (const root of document.querySelectorAll('.sina-content-slider.owl-carousel')) {
      run('sina-slider', () => initSinaSlider(root, teardown))
    }
    for (const widget of document.querySelectorAll('[data-widget_type^="image-carousel"]')) {
      run('image-carousel', () => initImageCarousel(widget, teardown))
    }
    run('accordions', () => initAccordions(teardown))
    run('reveals', () => initReveals(teardown))
    run('forms', () => initForms(teardown))

    return () => teardown.forEach((fn) => run('teardown', fn))
  }, [route])

  return null
}
