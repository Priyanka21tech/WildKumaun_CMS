import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { FORM_TARGETS, targetFor, type SectionTarget } from './sections'
import { asMedia, column, imageWidget, widget } from './widgets'

/**
 * Put a form on the page.
 *
 * This is the one section that is a rebuild rather than a migration. The origin's
 * form posts to WordPress with a token that expired long ago and a reCAPTCHA key
 * for a site that no longer answers, so there was no working behaviour to
 * preserve — only a shape. The shape is kept: the same fields in the same order,
 * the same labels, the same placeholders.
 *
 * The markup carries WPForms' classes even though WPForms is gone. The origin's
 * stylesheet was flattened into public/wp/site.css when the site was mirrored, and
 * 1,575 of its rules are WPForms' — so those class names are exactly what makes a
 * form on this site look like the rest of it. Writing our own classes instead cost
 * the form its styling, which is what happened on the first attempt here.
 *
 * What is dropped is the machinery, not the appearance: the expired form token,
 * the honeypot, the reCAPTCHA widget for a key that no longer answers, and the
 * hidden `wpforms[id]` fields that told WordPress where to file the answers.
 *
 * Submitting is handled in the browser by src/components/Enhancements.jsx, which
 * posts to the enquiries endpoint. It has to be: the page reaches the browser as
 * one string of markup, so there is no React form component to hang an onSubmit
 * off.
 */

type FormField = {
  blockType?: string
  name?: string
  label?: string | null
  placeholder?: string | null
  required?: boolean | null
  width?: number | null
  defaultValue?: unknown
  message?: SerializedEditorState | null
  options?: { label?: string | null; value?: string | null }[] | null
}

type FormDoc = {
  id?: number | string
  title?: string | null
  submitButtonLabel?: string | null
  confirmationMessage?: SerializedEditorState | null
  fields?: FormField[] | null
}

export type FormBlockValue = {
  target?: string | null
  heading?: string | null
  form?: number | FormDoc | null
  asideHeading?: string | null
  asideBody?: SerializedEditorState | null
  asideImage?: unknown
  showContactDetails?: boolean | null
  showAsideButton?: boolean | null
  asideButton?: LinkValue | null
}

/** Enough of the Site Settings global to render the contact details. */
export type ContactSettings = {
  legalName?: string | null
  name?: string | null
  address?: { full?: string | null } | null
  phones?: { number?: string | null; label?: string | null }[] | null
  social?: { network?: string | null; label?: string | null; url?: string | null }[] | null
}

export function replaceForm(
  html: string,
  block: FormBlockValue,
  settings?: ContactSettings,
): string {
  const target = targetFor(FORM_TARGETS, block.target)
  if (!target?.item) return html

  // An id on its own carries no fields to render, which means depth was too
  // shallow — better to leave the mirror's form than draw an empty one.
  const form = typeof block.form === 'object' && block.form !== null ? block.form : null
  if (!form?.id) return html

  const hashes = target.item
  const asideTag = target.asideTag ?? 'h3'

  const left = [
    hashes.label && block.heading
      ? widget(
          hashes.label,
          'heading',
          `<h2 class="elementor-heading-title elementor-size-default">${esc(block.heading)}</h2>`,
        )
      : '',
    hashes.image ? widget(hashes.image, 'shortcode', formMarkup(form)) : '',
  ].join('')

  const asideBody = block.asideBody
    ? convertLexicalToHTML({ data: block.asideBody, disableContainer: true })
    : ''

  const asideLabel = block.showAsideButton ? resolveLabel(block.asideButton) : ''

  const right = [
    block.asideHeading && hashes.aside
      ? widget(
          hashes.aside,
          'heading',
          `<${asideTag} class="elementor-heading-title elementor-size-default">${esc(block.asideHeading)}</${asideTag}>`,
        )
      : '',
    hashes.text && asideBody ? widget(hashes.text, 'text-editor', asideBody) : '',
    hashes.asideImage && asMedia(block.asideImage)
      ? imageWidget(hashes.asideImage, asMedia(block.asideImage)!)
      : '',
    block.showContactDetails ? contactDetails(hashes, settings) : '',
    // The rule reading "Or" only means anything with something on the other side
    // of it, so it appears with the button rather than on its own.
    asideLabel ? divider() : '',
    asideLabel && hashes.button
      ? widget(
          hashes.button,
          'button',
          `<div class="elementor-button-wrapper"><a class="elementor-button elementor-button-link elementor-size-xs elementor-animation-shrink" href="${esc(resolveHref(block.asideButton))}"><span class="elementor-button-content-wrapper"><span class="elementor-button-icon elementor-align-icon-right"><i aria-hidden="true" class="fas fa-long-arrow-alt-right"></i></span><span class="elementor-button-text">${esc(asideLabel)}</span></span></a></div>`,
          'elementor-tablet-align-center elementor-align-center elementor-mobile-align-center',
        )
      : '',
  ].join('')

  const [first, second] = target.reversed ? [right, left] : [left, right]

  return replaceContainer(
    html,
    target.section,
    column(50, first, target.columns?.[0]) + column(50, second, target.columns?.[1]),
  )
}

/**
 * The address, phone numbers and social links beside the form.
 *
 * Read from Site Settings rather than stored on the block, because they are
 * already there — the footer renders the same numbers from the same place. A
 * copy here would be a second address to update, and the site would eventually
 * be telling people two different things.
 *
 * A social network with no url is skipped rather than linked to nowhere. The
 * origin's own icons had no href either, which is why those fields are empty:
 * there was nothing to import.
 */
function contactDetails(
  hashes: NonNullable<SectionTarget['item']>,
  settings?: ContactSettings,
): string {
  if (!settings) return ''

  const items: string[] = []

  if (settings.address?.full) {
    items.push(iconItem('fas fa-address-book', settings.address.full))
  }

  for (const phone of settings.phones ?? []) {
    if (!phone.number) continue
    const text = phone.label ? `${phone.number} (${phone.label})` : phone.number
    items.push(iconItem('fas fa-mobile-alt', `Mobile No: ${text}`, `tel:+91${phone.number}`))
  }

  /**
   * Every network, linked or not.
   *
   * The origin renders both icons with no href at all — the links were never
   * filled in over there either. Showing only the ones with a url would drop the
   * whole row and the heading above it, which is a visible change to the page for
   * the sake of a link that was never there. An icon without a url renders as an
   * icon; filling the url in Site Settings makes it clickable.
   */
  const links = settings.social ?? []

  return [
    hashes.contactName && settings.legalName
      ? widget(
          hashes.contactName,
          'heading',
          `<h4 class="elementor-heading-title elementor-size-default">${esc(settings.legalName)}</h4>`,
        )
      : '',
    hashes.contactList && items.length
      ? widget(
          hashes.contactList,
          'icon-list',
          `<ul class="elementor-icon-list-items">${items.join('')}</ul>`,
          'elementor-list-item-link-full_width',
        )
      : '',
    hashes.socialHeading && links.length
      ? widget(
          hashes.socialHeading,
          'heading',
          `<h4 class="elementor-heading-title elementor-size-default">SOCIAL NETWORKS</h4>`,
        )
      : '',
    hashes.social && links.length
      ? widget(
          hashes.social,
          'social-icons',
          `<div class="elementor-social-icons-wrapper elementor-grid">${links
            .map((entry) => {
              const network = (entry.network ?? '').toLowerCase()
              const inner = `<span class="elementor-screen-only">${esc(entry.label ?? entry.network ?? '')}</span><i class="fab fa-${esc(network)}"></i>`
              const classes = `elementor-icon elementor-social-icon elementor-social-icon-${esc(network)}`

              return `<span class="elementor-grid-item">${
                entry.url
                  ? `<a class="${classes}" href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
                  : `<span class="${classes}">${inner}</span>`
              }</span>`
            })
            .join('')}</div>`,
        )
      : '',
  ].join('')
}

/** One row of the address list: an icon, some words, sometimes a link round both. */
function iconItem(icon: string, text: string, href?: string): string {
  const inner = `<span class="elementor-icon-list-icon"><i aria-hidden="true" class="${esc(icon)}"></i></span><span class="elementor-icon-list-text">${esc(text)}</span>`

  return `<li class="elementor-icon-list-item">${href ? `<a href="${esc(href)}">${inner}</a>` : inner}</li>`
}

const divider = (): string =>
  widget(
    '0a441b5',
    'divider',
    `<div class="elementor-divider"><span class="elementor-divider-separator"><span class="elementor-divider__text elementor-divider__element">Or</span></span></div>`,
    'elementor-widget-divider--view-line_text elementor-widget-divider--element-align-center',
  )

/**
 * The form itself.
 *
 * `data-form-id` is what the browser posts back with — see Enhancements.jsx. The
 * field's `name` is the plugin's own field name, so a submission can be matched
 * to the question it answers without the markup carrying a second identifier
 * that could disagree with it.
 */
function formMarkup(form: FormDoc): string {
  const fields = (form.fields ?? []).filter((field) => field.name)

  const rendered = fields.map((field) => formField(field)).join('')

  const confirmation = form.confirmationMessage
    ? convertLexicalToHTML({ data: form.confirmationMessage, disableContainer: true })
    : '<p>Thank you — we will be in touch.</p>'

  const id = esc(String(form.id))

  return `<div class="elementor-shortcode"><div class="wpforms-container wpforms-container-full" id="wpforms-${id}">
<form class="wpforms-validate wpforms-form" data-form-id="${id}" id="wpforms-form-${id}" method="post" novalidate>
<div class="wpforms-field-container">${rendered}</div>
<div class="wpforms-error-container" hidden></div>
<div class="wpforms-submit-container">
<button class="wpforms-submit" data-alt-text="Sending..." data-submit-text="${esc(form.submitButtonLabel || 'Send')}" type="submit">${esc(form.submitButtonLabel || 'Send')}</button>
</div>
</form>
<div class="wpforms-confirmation-container-full" hidden>${confirmation}</div>
</div></div>`
}

/**
 * One question, in the markup WPForms' stylesheet expects.
 *
 * `wpforms-field-large` and `-medium` are width classes rather than sizes of
 * text, and which one a field gets is the origin's choice: the single-line
 * answers are large, the number and the message medium.
 *
 * `wpforms-field-required` is a styling hook — it draws the label's asterisk red.
 * The browser's own `required` attribute is what actually enforces it, which is
 * why both are here and neither is redundant.
 */
function formField(field: FormField): string {
  const name = esc(field.name ?? '')
  const label = esc(field.label ?? '')
  const required = field.required ? ' required' : ''
  const placeholder = field.placeholder ? ` placeholder="${esc(field.placeholder)}"` : ''
  const id = `wpforms-field-${name}`

  // A message field is copy the editor placed inside the form, not a question.
  if (field.blockType === 'message') {
    return field.message
      ? `<div class="wpforms-field wpforms-field-html">${convertLexicalToHTML({ data: field.message, disableContainer: true })}</div>`
      : ''
  }

  const width = field.blockType === 'textarea' || field.blockType === 'number' ? 'medium' : 'large'
  const classes = `wpforms-field-${width}${field.required ? ' wpforms-field-required' : ''}`

  const control = (() => {
    switch (field.blockType) {
      case 'textarea':
        return `<textarea class="${classes}" id="${id}" name="${name}"${placeholder}${required}></textarea>`
      case 'select':
        return `<select class="${classes}" id="${id}" name="${name}"${required}>${(field.options ?? [])
          .map(
            (option) =>
              `<option value="${esc(option.value ?? '')}">${esc(option.label ?? option.value ?? '')}</option>`,
          )
          .join('')}</select>`
      case 'checkbox':
        return `<input class="${classes}" id="${id}" name="${name}" type="checkbox"${required}/>`
      default: {
        const type =
          field.blockType === 'email' ? 'email' : field.blockType === 'number' ? 'number' : 'text'
        return `<input class="${classes}" id="${id}" name="${name}" type="${type}"${placeholder}${required}/>`
      }
    }
  })()

  return `<div class="wpforms-field wpforms-field-${esc(field.blockType ?? 'text')}" id="${id}-container">
<label class="wpforms-field-label" for="${id}">${label}${field.required ? ' <span class="wpforms-required-label">*</span>' : ''}</label>
${control}
</div>`
}
