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
  const vditorRef = useRef<Vditor>()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (editorRef.current && !vditorRef.current) {
      const vditorInstance = new Vditor(editorRef.current, {
        minHeight: 300,
        value: initialValue,
        mode: 'ir',
        cdn: '/libs/vditor',
        theme: resolvedTheme === 'dark' ? 'dark' : 'classic',
        toolbarConfig: {
          pin: true
        },
        preview: {
          theme: {
            current: resolvedTheme === 'dark' ? 'dark' : 'light'
          },
          hljs: {
            style: resolvedTheme === 'dark' ? 'github-dark' : 'github'
          }
        },
        cache: {
          enable: false
        },
        input: (value) => {
          onChange?.(value)
        }
      });
      vditorRef.current = vditorInstance;
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
        vditorRef.current = undefined;
      }
    }
  }, []) // 只在挂载时初始化

  useEffect(() => {
    if (vditorRef.current) {
      vditorRef.current.setTheme(
        resolvedTheme === 'dark' ? 'dark' : 'classic',
        resolvedTheme === 'dark' ? 'dark' : 'light',
        resolvedTheme === 'dark' ? 'github-dark' : 'github'
      );
    }
  }, [resolvedTheme]) // 当主题变化时仅更新主题，不重新创建实例

  return <div ref={editorRef} className="mt-4" />
}
