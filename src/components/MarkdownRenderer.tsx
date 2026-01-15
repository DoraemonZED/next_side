'use client'

import React, { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { useTheme } from 'next-themes'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (previewRef.current) {
      Vditor.preview(previewRef.current, content, {
        mode: resolvedTheme === 'dark' ? 'dark' : 'light',
        anchor: 0,
        theme: {
          current: resolvedTheme === 'dark' ? 'dark' : 'light'
        },
        hljs: {
          style: resolvedTheme === 'dark' ? 'github-dark' : 'github'
        }
      })
    }
  }, [content, resolvedTheme])

  return (
    <div 
      ref={previewRef} 
      className="vditor-reset prose prose-zinc dark:prose-invert max-w-none"
    />
  )
}
