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
    let vditorInstance: Vditor | undefined;
    
    const initVditor = () => {
      if (editorRef.current) {
        // 如果已经有实例，获取当前内容
        const currentValue = vditorRef.current ? vditorRef.current.getValue() : initialValue;

        vditorInstance = new Vditor(editorRef.current, {
          minHeight: 300,
          value: currentValue,
          mode: 'ir',
          theme: resolvedTheme === 'dark' ? 'dark' : 'classic',
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
    };

    initVditor();

    return () => {
      if (vditorInstance) {
        try {
          if (vditorInstance && vditorInstance.vditor && vditorInstance.vditor.element) {
            vditorInstance.destroy();
          }
        } catch (e) {
          console.warn('Vditor destroy cleanup:', e);
        }
        vditorInstance = undefined;
        vditorRef.current = undefined;
      }
    }
  }, [resolvedTheme]) // 当主题变化时重新初始化以应用新的代码高亮主题

  return <div ref={editorRef} className="mt-4" />
}
