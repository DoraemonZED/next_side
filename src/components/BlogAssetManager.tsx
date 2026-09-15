'use client'

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, FileImage, FileText, FolderOpen, Link2, Loader2, Pencil, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useUIStore } from '@/store/useUIStore'

interface Asset { name: string; size: number; updatedAt: string }

interface BlogAssetManagerProps {
  category: string
  postId: string
  markdown: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (markdown: string) => void
  onReplaceReferences: (from: string, to: string) => void
}

const imageName = (name: string) => /\.(?:avif|gif|jpe?g|png|svg|webp)$/i.test(name)
const formatSize = (size: number) => size < 1024 ? `${size} B` : size < 1024 ** 2 ? `${(size / 1024).toFixed(1)} KB` : `${(size / 1024 ** 2).toFixed(1)} MB`
const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const referenceNames = (markdown: string) => {
  const names = new Set<string>()
  const matcher = /!?\[[^\]]*\]\(\s*<?\.\/([^\s)>]+)>?(?:\s+[^)]*)?\s*\)/g
  for (const match of markdown.matchAll(matcher)) {
    try { names.add(decodeURIComponent(match[1])) } catch { names.add(match[1]) }
  }
  return names
}

async function message(response: Response) {
  const payload = await response.json().catch(() => null)
  return payload?.message || '操作失败，请稍后重试'
}

export function BlogAssetManager({ category, postId, markdown, open, onOpenChange, onInsert, onReplaceReferences }: BlogAssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { showToast, setLoading: setGlobalLoading } = useUIStore()
  const references = useMemo(() => referenceNames(markdown), [markdown])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/blog/assets?category=${encodeURIComponent(category)}&id=${encodeURIComponent(postId)}`)
      if (!response.ok) throw new Error(await message(response))
      const payload = await response.json()
      setAssets(payload.assets || [])
    } catch (error) {
      showToast(error instanceof Error ? error.message : '文件列表加载失败', 'error')
    } finally { setLoading(false) }
  }, [category, postId, showToast])

  useEffect(() => { if (open) void load() }, [open, load])

  const run = async (key: string, action: () => Promise<Response>, success: string) => {
    setWorking(key)
    setGlobalLoading(true)
    try {
      const response = await action()
      if (!response.ok) throw new Error(await message(response))
      showToast(success, 'success')
      await load()
      return true
    } catch (error) {
      showToast(error instanceof Error ? error.message : '操作失败', 'error')
      return false
    } finally {
      setWorking(null)
      setGlobalLoading(false)
    }
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const body = new FormData()
    body.set('category', category)
    body.set('id', postId)
    body.set('file', file)
    await run(`upload:${file.name}`, () => fetch('/api/blog/assets', { method: 'POST', body }), '文件已上传')
  }

  const rename = async (name: string) => {
    const nextName = window.prompt('输入新的文件名（不包含路径）', name)?.trim()
    if (!nextName || nextName === name) return
    const done = await run(`rename:${name}`, () => fetch('/api/blog/assets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, id: postId, name, nextName }),
    }), '文件已重命名')
    if (done && references.has(name)) onReplaceReferences(name, nextName)
  }

  const remove = async (name: string) => {
    const referenced = references.has(name)
    const warning = referenced ? `「${name}」仍在文章中被引用，删除后图片会失效。仍要删除吗？` : `确定删除「${name}」吗？`
    if (!window.confirm(warning)) return
    await run(`delete:${name}`, () => fetch('/api/blog/assets', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, id: postId, name }),
    }), '文件已删除')
  }

  const insert = (name: string) => {
    const href = `./${encodeURIComponent(name)}`
    onInsert(imageName(name) ? `![${name}](${href})` : `[${name}](${href})`)
    showToast('引用已插入文章', 'success')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="blog-assets" aria-label="文章文件管理">
        <DialogHeader>
          <DialogTitle className="blog-assets__title"><FolderOpen className="h-5 w-5" />文章文件</DialogTitle>
          <DialogDescription>资源保存于当前文章目录。插入后会使用 <code>./文件名</code>，发布页会自动解析。</DialogDescription>
        </DialogHeader>
        <div className="blog-assets__actions">
          <input ref={inputRef} type="file" className="sr-only" onChange={upload} />
          <Button type="button" size="sm" onClick={() => inputRef.current?.click()} disabled={Boolean(working)}>
            <Upload className="h-3.5 w-3.5" />上传文件
          </Button>
          <span>单文件最大 10 MB</span>
        </div>
        <div className="blog-assets__list" aria-live="polite">
          {loading ? <div className="blog-assets__empty"><Loader2 className="h-4 w-4 animate-spin" />读取文件中…</div> : null}
          {!loading && assets.length === 0 ? <div className="blog-assets__empty">当前目录还没有资源文件</div> : null}
          {!loading && assets.map((asset) => {
            const referenced = references.has(asset.name)
            const busy = Boolean(working)
            return <div key={asset.name} className="blog-assets__item">
              <div className="blog-assets__file">
                {imageName(asset.name) ? <FileImage className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                <div><strong>{asset.name}</strong><span>{formatSize(asset.size)} · {new Date(asset.updatedAt).toLocaleDateString()}</span></div>
              </div>
              <div className="blog-assets__meta">
                <span className={referenced ? 'blog-assets__reference blog-assets__reference--used' : 'blog-assets__reference'}>{referenced ? <Check /> : <Link2 />}{referenced ? '已引用' : '未引用'}</span>
                <Button type="button" variant="ghost" size="icon" title="插入引用" onClick={() => insert(asset.name)} disabled={busy}><Link2 className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" title="重命名" onClick={() => void rename(asset.name)} disabled={busy}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button type="button" variant="ghost" size="icon" title="删除文件" onClick={() => void remove(asset.name)} disabled={busy} className="blog-assets__delete"><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function replaceRelativeAssetReferences(markdown: string, from: string, to: string) {
  const encodedFrom = encodeURIComponent(from)
  const encodedTo = encodeURIComponent(to)
  return markdown
    .replace(new RegExp(`\\.\\/${escaped(from)}(?=[)\\s>])`, 'g'), `./${to}`)
    .replace(new RegExp(`\\.\\/${escaped(encodedFrom)}(?=[)\\s>])`, 'g'), `./${encodedTo}`)
}
