'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { User, Share2, Bookmark, Edit2, Eye } from "lucide-react"
import { MarkdownRenderer } from "@/components/MarkdownRenderer"
import { BlogEditor } from "@/components/BlogEditor"
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
  const [loading, setLoading] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { showToast, setLoading: setGlobalLoading } = useUIStore()

  const handleSave = async () => {
    setLoading(true)
    setGlobalLoading(true)
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: post.category,
          id: post.id,
          meta: { title: post.title }, // 保持原有标题
          content: content
        }),
      })
      if (res.ok) {
        setIsEditing(false)
        showToast('文章保存成功', 'success')
      } else {
        showToast('文章保存失败', 'error')
      }
    } catch (error) {
      showToast('网络错误', 'error')
    } finally {
      setLoading(false)
      setGlobalLoading(false)
    }
  }

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
            {/* 你要求的编辑按钮 - 仅登录可见 */}
            {isAuthenticated && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <>
                    <Eye className="h-4 w-4" /> 预览模式
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4" /> 编辑模式
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button size="sm" onClick={handleSave} disabled={loading}>
              {loading ? '保存中...' : '保存修改'}
            </Button>
          )}
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="mb-16 mt-8">
        {isEditing ? (
          <BlogEditor initialValue={content} onChange={setContent} />
        ) : (
          <MarkdownRenderer content={content} />
        )}
      </div>
    </>
  )
}
