export interface MarkdownHeading {
  id: string
  text: string
  level: number
  line: number
}

function textFromMarkdown(value: string) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .trim()
}

function slug(value: string) {
  const result = value.toLowerCase().replace(/[^\w\u4e00-\u9fff-]+/g, '-').replace(/^-+|-+$/g, '')
  return result || 'section'
}

/** Extracts visible Markdown headings while ignoring fenced code blocks. */
export function markdownHeadings(markdown: string, maximumLevel = 3): MarkdownHeading[] {
  const seen = new Map<string, number>()
  const result: MarkdownHeading[] = []
  let fence = false

  markdown.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return }
    if (fence) return
    const match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/)
    if (!match) return
    const level = match[1].length
    if (level > maximumLevel) return
    const text = textFromMarkdown(match[2])
    if (!text) return
    const base = slug(text)
    const count = seen.get(base) || 0
    seen.set(base, count + 1)
    result.push({ id: count ? `${base}-${count + 1}` : base, text, level, line: index + 1 })
  })

  return result
}
