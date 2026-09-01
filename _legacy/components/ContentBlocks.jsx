/** Renders the block list that extract-pages-fallback pulled out of the WordPress content area. */
export default function ContentBlocks({ blocks = [], className = '' }) {
  const out = []
  let list = []

  const flush = (key) => {
    if (!list.length) return
    out.push(
      <ul key={`ul-${key}`} className="ml-5 list-disc space-y-2 text-body leading-body marker:text-brand">
        {list.map((t, i) => <li key={i}>{t}</li>)}
      </ul>,
    )
    list = []
  }

  blocks.forEach((b, i) => {
    if (b.type === 'listItem') { list.push(b.text); return }
    flush(i)
    switch (b.type) {
      case 'heading1':
      case 'heading2':
        out.push(<h2 key={i} className="pt-4 font-sans text-h2 font-heading text-ink">{b.text}</h2>)
        break
      case 'heading3':
        out.push(<h3 key={i} className="pt-3 font-display text-h3 text-ink">{b.text}</h3>)
        break
      case 'heading4':
      case 'heading5':
      case 'heading6':
        out.push(<h4 key={i} className="pt-2 font-sans text-h5 font-heading text-ink">{b.text}</h4>)
        break
      case 'quote':
        out.push(
          <blockquote key={i} className="border-l-4 border-brand pl-5 text-body italic">{b.text}</blockquote>,
        )
        break
      default:
        out.push(<p key={i} className="text-body leading-body">{b.text}</p>)
    }
  })
  flush('end')

  return <div className={`space-y-5 ${className}`}>{out}</div>
}
