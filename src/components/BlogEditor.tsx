'use client'

import React, { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'

interface BlogEditorProps {
  initialValue: string
  onChange?: (value: string) => void
}

export function BlogEditor({ initialValue, onChange }: BlogEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor>()

  useEffect(() => {
    let vditorInstance: Vditor | undefined;
    
    const initVditor = () => {
      if (editorRef.current) {
        vditorInstance = new Vditor(editorRef.current, {
          height: 600,
          value: initialValue,
          mode: 'ir', // 所见即所得模式
          theme: 'ant-design',
          preview: {
            theme: {
              current: 'ant-design'
            },
            hljs: {
              style: 'dracula'
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
          // 彻底检查 vditor 实例及其内部元素是否存在
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
  }, [])

  return <div ref={editorRef} className="mt-4" />
}
