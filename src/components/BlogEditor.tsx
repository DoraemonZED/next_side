'use client'

import React, { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { useTheme } from 'next-themes'

interface BlogEditorProps {
  initialValue: string
  onChange?: (value: string) => void
}

export function BlogEditor({ initialValue, onChange }: BlogEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (editorRef.current && !vditorRef.current) {
      // 检测是否为移动端小屏
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      const toolbar = isMobile
        ? [
            'emoji',
            'headings',
            'bold',
            'italic',
            'strike',
            'link',
            '|',
            'check',
            'list',
            'ordered-list',
            '|',
            'undo',
            'redo',
            '|',
            {
              name: 'more',
              toolbar: [
                'outdent',
                'indent',
                'quote',
                'line',
                'code',
                'inline-code',
                'table',
                'export',
              ],
            },
          ]
        : [
            'emoji',
            'headings',
            'bold',
            'italic',
            'strike',
            'link',
            '|',
            'list',
            'ordered-list',
            'check',
            'outdent',
            'indent',
            '|',
            'quote',
            'line',
            'code',
            'inline-code',
            '|',
            'undo',
            'redo',
            '|',
            'table',
            'export',
            'outline',
          ]

      const vditorInstance = new Vditor(editorRef.current, {
        minHeight: 300,
        value: initialValue,
        mode: 'ir',
        cdn: '/libs/vditor',
        theme: resolvedTheme === 'dark' ? 'dark' : 'classic',
        toolbar,
        toolbarConfig: {
          pin: true,
        },
        preview: {
          theme: {
            current: resolvedTheme === 'dark' ? 'dark' : 'light',
          },
          hljs: {
            style: resolvedTheme === 'dark' ? 'github-dark' : 'github',
          },
        },
        cache: {
          enable: false,
        },
        input: (value) => {
          onChange?.(value)
        },
      })
      vditorRef.current = vditorInstance
    }

    return () => {
      if (vditorRef.current) {
        try {
          if (vditorRef.current.vditor && vditorRef.current.vditor.element) {
            vditorRef.current.destroy();
          }
        } catch (e) {
          console.warn('Vditor destroy cleanup:', e);
        }
        vditorRef.current = null;
      }
    }
  }, []) // 只在挂载时初始化

  useEffect(() => {
    // 确保 vditor 实例及其内部对象已初始化
    if (vditorRef.current && (vditorRef.current as any).vditor) {
      vditorRef.current.setTheme(
        resolvedTheme === 'dark' ? 'dark' : 'classic',
        resolvedTheme === 'dark' ? 'dark' : 'light',
        resolvedTheme === 'dark' ? 'github-dark' : 'github'
      );
    }
  }, [resolvedTheme]) // 当主题变化时仅更新主题，不重新创建实例

  return <div ref={editorRef} className="mt-4" />
}
