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
    const initVditor = async () => {
      if (previewRef.current) {
        await Vditor.preview(previewRef.current, content, {
          mode: resolvedTheme === 'dark' ? 'dark' : 'light',
          cdn: '/libs/vditor',
          anchor: 0,
          theme: {
            current: resolvedTheme === 'dark' ? 'dark' : 'light'
          },
          hljs: {
            enable: true, // 预览模式必须显式开启
            style: resolvedTheme === 'dark' ? 'github-dark' : 'github',
            lineNumber: true
          },
          after() {
            // 在渲染完成后再次触发，确保代码块被正确着色
            if (previewRef.current) {
              Vditor.highlightRender({
                enable: true,
                style: resolvedTheme === 'dark' ? 'github-dark' : 'github',
                lineNumber: true
              }, previewRef.current, '/libs/vditor')
              Vditor.codeRender(previewRef.current)
            }
          }
        })
      }
    }
    
    initVditor()
  }, [content, resolvedTheme])

  return (
    <div 
      ref={previewRef} 
      className="vditor-reset max-w-none break-words"
    />
  )
}
