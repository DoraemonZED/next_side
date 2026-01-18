'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { User, Share2, Bookmark, Edit2, Eye } from "lucide-react"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { BlogEditor, BlogEditorRef } from "@/components/BlogEditor"
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'

interface Post {
  id: string
  category: string
  author: string
  content: string
  categoryName: string
  title: string
  // 其他必要的属性
}

export function PostClientWrapper({ post }: { post: Post }) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<BlogEditorRef>(null)
  const { isAuthenticated } = useAuthStore()
  const { showToast, setLoading: setGlobalLoading } = useUIStore()

  const handleSave = useCallback(async () => {
    if (isSaving) return
    
    // 从编辑器获取最新内容
    const currentContent = editorRef.current?.getValue() || content
    
    setIsSaving(true)
    setGlobalLoading(true)
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: post.category,
          id: post.id,
          meta: { title: post.title }, // 保持原有标题
          content: currentContent
        }),
      })
      if (res.ok) {
        setContent(currentContent)
        showToast('文章保存成功', 'success')
      } else {
        showToast('文章保存失败', 'error')
      }
    } catch (error) {
      showToast('网络错误', 'error')
    } finally {
      setIsSaving(false)
      setGlobalLoading(false)
    }
  }, [content, isSaving, post.category, post.id, post.title, setGlobalLoading, showToast])

  return (
    <>
      {/* 文章头部操作区 */}
      <div className="flex items-center justify-between py-6 border-y border-border/40">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-sm font-bold">{post.author}</div>
              <div className="text-xs text-muted-foreground">作者</div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full h-9 w-9 bg-primary/5 border-primary/10 text-primary/70 hover:bg-primary/10 hover:text-primary hover:border-primary/20"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9 bg-amber-500/5 border-amber-500/10 text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/20">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9 bg-green-500/5 border-green-500/10 text-green-500/70 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/20">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mb-16 mt-8">
        {isEditing ? (
          <BlogEditor 
            ref={editorRef}
            initialValue={content} 
            onChange={setContent}
            onSave={handleSave}
            isSaving={isSaving}
          />
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </>
  )
}
