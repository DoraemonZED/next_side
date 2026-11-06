'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'

export default function ResumeEditPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { showToast } = useUIStore()
  const [rawContent, setRawContent] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { void checkAuth() }, [checkAuth])
  useEffect(() => {
    fetch('/api/resume/content')
      .then((response) => response.json())
      .then((data) => setRawContent(JSON.stringify(data.content, null, 2)))
      .catch(() => setError('简历内容读取失败'))
  }, [])

  const save = async () => {
    let content: unknown
    try {
      content = JSON.parse(rawContent)
    } catch {
      setError('JSON 格式不正确，请检查逗号、引号和括号。')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/resume/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '保存失败')
      setRawContent(JSON.stringify(data.content, null, 2))
      showToast('简历内容已保存，网页和 PDF 会同步更新', 'success')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <main className="site-page py-20 text-center text-muted-foreground">正在验证登录状态…</main>
  if (!isAuthenticated) return <main className="site-page py-20 text-center"><h1 className="text-2xl font-bold">需要管理员登录</h1><p className="mt-3 text-muted-foreground">请先通过 Header 的登录入口完成验证。</p></main>

  return <main className="resume-editor site-page h-full min-h-0 overflow-hidden py-0">
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col px-4 py-4 sm:px-6">
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border pb-4">
        <Link href="/resume" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回简历</Link>
        <Button onClick={save} disabled={saving || !rawContent}><Save className="mr-2 h-4 w-4" />{saving ? '保存中...' : '保存修改'}</Button>
      </div>
      {error && <p className="mt-3 shrink-0 whitespace-pre-wrap rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm leading-6 text-destructive">{error}</p>}
      <div className="min-h-0 flex-1 py-4">
        <Textarea
          aria-label="简历 JSON 内容"
          className="resume-json-editor h-full min-h-0 resize-none overflow-y-auto rounded-xl border-border bg-muted/20 p-5 font-mono text-xs leading-6"
          data-lenis-prevent
          value={rawContent}
          onChange={(event) => { setRawContent(event.target.value); setError('') }}
          spellCheck={false}
        />
      </div>
    </div>
  </main>
}
