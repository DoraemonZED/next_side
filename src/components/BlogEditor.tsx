'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { useTheme } from 'next-themes'

interface BlogEditorProps {
  initialValue: string
  onChange?: (value: string) => void
  onSave?: () => void
  isSaving?: boolean
}

export interface BlogEditorRef {
  getValue: () => string
}

export const BlogEditor = forwardRef<BlogEditorRef, BlogEditorProps>(
  function BlogEditor({ initialValue, onChange, onSave, isSaving }, ref) {
  const editorRef = useRef<HTMLDivElement>(null)
  const vditorRef = useRef<Vditor | null>(null)
  const onSaveRef = useRef(onSave)
  const { resolvedTheme } = useTheme()

  // 保持 onSave 回调最新
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getValue: () => vditorRef.current?.getValue() || ''
  }), [])

  useEffect(() => {
    if (editorRef.current && !vditorRef.current) {
      // 检测是否为移动端小屏
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

      // 自定义保存按钮
      const saveButton = {
        name: 'save',
        tip: '保存 (Ctrl+S)',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>',
        click: () => {
          onSaveRef.current?.()
        },
      }

      const toolbar = isMobile
        ? [
            saveButton,
            '|',
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
            saveButton,
            '|',
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

  // 添加 Ctrl+S 快捷键保存
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        onSaveRef.current?.()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return <div ref={editorRef} className="mt-4" />
})
