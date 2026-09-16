'use client'

import React, { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { User, Share2, Heart, Edit2, Eye } from "lucide-react"
import { BlogEditor } from "@/components/BlogEditor"
import { BlogMarkdown } from "@/components/BlogMarkdown"
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'

interface Post {
  id: string
  category: string
  author: string
  content: string
  categoryName: string
  title: string
}

export function PostClientWrapper({ post }: { post: Post }) {
  const [isEditing, setIsEditing] = useState(false)
  const [content, setContent] = useState(post.content)
  const [isSaving, setIsSaving] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { showToast, setLoading: setGlobalLoading } = useUIStore()

  const handleSave = useCallback(async () => {
    if (isSaving) return
    
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
          content
        }),
      })
      if (res.ok) {
        showToast('文章保存成功', 'success')
      } else {
        showToast('文章保存失败', 'error')
      }
    } catch {
      showToast('网络错误', 'error')
    } finally {
      setIsSaving(false)
      setGlobalLoading(false)
    }
  }, [content, isSaving, post.category, post.id, post.title, setGlobalLoading, showToast])

  const recordMetric = useCallback(async (action: 'like' | 'share') => {
    const response = await fetch('/api/blog/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: post.category, id: post.id, action }),
    })
    if (!response.ok) throw new Error('记录指标失败')
  }, [post.category, post.id])

  const handleLike = useCallback(async () => {
    try {
      await recordMetric('like')
      showToast('感谢点赞！', 'success')
    } catch {
      showToast('点赞记录失败', 'error')
    }
  }, [recordMetric, showToast])

  const handleShare = useCallback(async () => {
    try {
      const shareData = { title: post.title, url: window.location.href }
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url)
        showToast('文章链接已复制', 'success')
      } else {
        throw new Error('当前浏览器不支持分享')
      }
      await recordMetric('share')
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      showToast('分享未完成', 'error')
    }
  }, [post.title, recordMetric, showToast])

  return (
    <>
      {/* 文章头部操作区 */}
      <div className="post-detail__authorbar">
        <div className="post-detail__author">
          <div className="post-detail__author-mark">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="post-detail__author-name">{post.author}</div>
            <div className="post-detail__author-role">AUTHOR</div>
          </div>
        </div>
        <div className="post-detail__actions">
          {isAuthenticated && (
            <Button 
              variant="outline" 
              size="icon" 
              className="post-detail__action"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <Eye className="h-4 w-4" />
              ) : (
                <Edit2 className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="outline" size="icon" className="post-detail__action" aria-label="分享文章" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="post-detail__action" aria-label="点赞文章" onClick={handleLike}>
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="post-detail__body">
        {isEditing ? (
          <BlogEditor
            initialValue={content} 
            onChange={setContent}
            onSave={handleSave}
            isSaving={isSaving}
            category={post.category}
            postId={post.id}
          />
        ) : (
          <BlogMarkdown content={content} category={post.category} postId={post.id} />
        )}
      </div>
    </>
  )
}
