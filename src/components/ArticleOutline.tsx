'use client'

import { ListTree } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { markdownHeadings } from '@/lib/markdownHeadings'

export function ArticleOutline({ content }: { content: string }) {
  const headings = useMemo(() => markdownHeadings(content), [content])
  const [activeId, setActiveId] = useState(headings[0]?.id || '')

  useEffect(() => {
    const frame = requestAnimationFrame(() => setActiveId(headings[0]?.id || ''))
    const observer = headings.length ? new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActiveId(visible[0].target.id)
    }, { rootMargin: '-104px 0px -66% 0px', threshold: 0 }) : null
    if (observer) headings.forEach((heading) => {
      const target = document.getElementById(heading.id)
      if (target) observer.observe(target)
    })
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [headings])

  return (
    <aside className="post-detail__outline" aria-label="文章目录">
      <p><ListTree /> ON THIS PAGE</p>
      {headings.length ? <nav>{headings.map((heading) => <a key={heading.id} href={`#${heading.id}`} className={activeId === heading.id ? 'is-active' : ''} data-level={heading.level}><span>{heading.text}</span></a>)}</nav> : <small>本文章暂无标题目录</small>}
    </aside>
  )
}
