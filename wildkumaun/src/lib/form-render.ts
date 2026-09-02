import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from 'lexical'
import { esc } from '../components/SiteHeader'
import { replaceContainer } from './elementor'
import { resolveHref, resolveLabel, type LinkValue } from '../fields/link'
import { FORM_TARGETS, targetFor } from './sections'
import { column, widget } from './widgets'

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
  showAsideButton?: boolean | null
  asideButton?: LinkValue | null
}

export function replaceForm(html: string, block: FormBlockValue): string {
  const target = targetFor(FORM_TARGETS, block.target)
  if (!target?.item) return html

  // An id on its own carries no fields to render, which means depth was too
  // shallow — better to leave the mirror's form than draw an empty one.
  const form = typeof block.form === 'object' && block.form !== null ? block.form : null
  if (!form?.id) return html

  const hashes = target.item

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
          `<h3 class="elementor-heading-title elementor-size-default">${esc(block.asideHeading)}</h3>`,
        )
      : '',
    hashes.text && asideBody ? widget(hashes.text, 'text-editor', asideBody) : '',
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

  return replaceContainer(
    html,
    target.section,
    column(50, left, target.columns?.[0]) + column(50, right, target.columns?.[1]),
  )
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
