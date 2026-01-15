'use client'

import React, { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const previewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (previewRef.current) {
      Vditor.preview(previewRef.current, content, {
        mode: 'dark', 
        anchor: 1,
        theme: {
          current: 'ant-design'
        },
        hljs: {
          style: 'dracula'
        }
      })
    }
  }, [content])

  return (
    <div 
      ref={previewRef} 
      className="vditor-reset prose prose-zinc dark:prose-invert max-w-none"
    />
  )
}
