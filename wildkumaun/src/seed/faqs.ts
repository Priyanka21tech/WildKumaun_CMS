import type { Payload } from 'payload'
import { convertMarkdownToLexical, editorConfigFactory } from '@payloadcms/richtext-lexical'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Put the extracted questions into the FAQs collection.
 *
 * The extraction split each answer into three pieces — an opening line, a
 * numbered list, and sometimes a closing line — because that is the shape the
 * origin's markup happened to have. The collection stores rich text instead, so
 * they are stitched back into one document here: the pieces were an artefact of
 * how the page was read, not of what an answer is.
 *
 * Markdown is the intermediate step rather than Lexical JSON written by hand.
 * Lexical's node format is verbose and version-specific, and getting a detail
 * wrong produces a document that saves but renders as nothing;
 * convertMarkdownToLexical is Payload's own converter and stays correct across
 * versions.
 *
 * Creates only. A question already in the collection has been through an editor's
 * hands and is left exactly as it is.
 */

const dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(dirname, '../../..')

type ExtractedFaq = {
  id: string
  question: string
  answer?: string
  points?: string[]
  closing?: string
}

/**
 * One answer as markdown.
 *
 * The list is numbered because the origin renders `<ol>`. Blank lines between
 * blocks are what makes them separate blocks rather than one run-on paragraph.
 */
function toMarkdown(faq: ExtractedFaq): string {
  const blocks: string[] = []

  if (faq.answer?.trim()) blocks.push(faq.answer.trim())

  if (faq.points?.length) {
    blocks.push(faq.points.map((point, i) => `${i + 1}. ${point.trim()}`).join('\n'))
  }

  if (faq.closing?.trim()) blocks.push(faq.closing.trim())

  return blocks.join('\n\n')
}

export async function seedFaqs(payload: Payload): Promise<{ created: number; skipped: number }> {
  const doc = JSON.parse(fs.readFileSync(path.join(REPO, 'content/faqs.json'), 'utf8'))
  const faqs = (doc.faqs ?? []) as ExtractedFaq[]

  const existing = await payload.count({ collection: 'faqs' })
  if (existing.totalDocs >= faqs.length) return { created: 0, skipped: existing.totalDocs }

  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  let created = 0
  let skipped = 0

  for (const [index, faq] of faqs.entries()) {
    const found = await payload.find({
      collection: 'faqs',
      where: { slug: { equals: faq.id } },
      limit: 1,
      pagination: false,
      depth: 0,
    })

    if (found.docs.length) {
      skipped++
      continue
    }

    const markdown = toMarkdown(faq)
    if (!markdown) {
      skipped++
      continue
    }

    await payload.create({
      collection: 'faqs',
      data: {
        question: faq.question,
        slug: faq.id,
        // Tens rather than ones, so a question can be slotted between two others
        // without renumbering the ones after it.
        order: (index + 1) * 10,
        answer: convertMarkdownToLexical({ editorConfig, markdown }),
      },
    })
    created++
  }

  return { created, skipped }
}
