import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'
import { markdownHeadings } from '@/lib/markdownHeadings'

interface BlogMarkdownProps {
  content: string
  category: string
  postId: string
}

const assetUrl = (src: string, category: string, postId: string) => {
  if (!src.startsWith('./')) return src
  const filename = src.slice(2)
  if (!filename || filename.includes('/')) return src
  return `/blog/${encodeURIComponent(category)}/${encodeURIComponent(postId)}/${filename}`
}

/** Renders blog Markdown as a fully styleable React tree. */
export function BlogMarkdown({ content, category, postId }: BlogMarkdownProps) {
  const headingIds = new Map<number, string>(markdownHeadings(content).map((heading) => [heading.line, heading.id]))
  const heading = (tag: 'h1' | 'h2' | 'h3') => ({ node, children, ...props }: { node?: { position?: { start?: { line?: number } } }; children?: React.ReactNode }) => {
    const line = node?.position?.start?.line
    return React.createElement(tag, { ...props, id: line === undefined ? undefined : headingIds.get(line) }, children)
  }

  return (
    <div className="article-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, subset: ['bash', 'css', 'html', 'java', 'javascript', 'json', 'sql', 'typescript'] }]]}
        components={{
          a: ({ href, children, ...props }) => (
            <a href={typeof href === 'string' ? assetUrl(href, category, postId) : href} {...(typeof href === 'string' && href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})} {...props}>
              {children}
            </a>
          ),
          table: ({ children, ...props }) => (
            <div className="article-markdown__table-wrap">
              <table {...props}>{children}</table>
            </div>
          ),
          h1: heading('h1'),
          h2: heading('h2'),
          h3: heading('h3'),
          img: ({ src, alt = '', ...props }) => <img src={typeof src === 'string' ? assetUrl(src, category, postId) : undefined} alt={alt} {...props} />,
          code: ({ className, children, ...props }) => {
            const language = /language-([\w-]+)/.exec(className || '')?.[1]
            return <code className={className} data-language={language} {...props}>{children}</code>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
