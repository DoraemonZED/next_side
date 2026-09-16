"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FileArchive, Gamepad2, GitBranch, Loader2, Play, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { GameInfo } from "@/lib/gameService"
import { useAuthStore } from "@/store/useAuthStore"
import { useUIStore } from "@/store/useUIStore"

export default function GamesPage() {
  const [games, setGames] = useState<GameInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [form, setForm] = useState({ name: '', title: '', description: '' })
  const fileRef = useRef<HTMLInputElement>(null)
  const { isAuthenticated } = useAuthStore()
  const { showConfirm, showToast } = useUIStore()

  const fetchGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games')
      if (!response.ok) throw new Error('获取游戏列表失败')
      const data = await response.json()
      setGames(data.games || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchGames() }, 0)
    return () => window.clearTimeout(timer)
  }, [fetchGames])

  const handleStartGame = (gameName: string) => {
    window.open(`/api/game/${encodeURIComponent(gameName)}/`, '_blank', 'noopener,noreferrer')
  }

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return showToast('请选择游戏 ZIP 压缩包', 'error')
    if (!form.name.trim()) return showToast('请填写游戏目录名', 'error')
    const payload = new FormData()
    payload.append('file', file)
    payload.append('name', form.name.trim())
    payload.append('title', form.title.trim())
    payload.append('description', form.description.trim())
    setUploading(true)
    try {
      const response = await fetch('/api/game/upload', { method: 'POST', body: payload })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '上传失败')
      showToast(data.message || '游戏已上传', 'success')
      setUploadOpen(false)
      setForm({ name: '', title: '', description: '' })
      if (fileRef.current) fileRef.current.value = ''
      await fetchGames()
    } catch (uploadError) {
      showToast(uploadError instanceof Error ? uploadError.message : '上传失败', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = (game: GameInfo) => {
    showConfirm({
      title: '删除游戏？',
      message: `将删除“${game.title}”的解压目录和保留的 ${game.name}.zip，此操作不可恢复。`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/game/manage?name=${encodeURIComponent(game.name)}`, { method: 'DELETE' })
          const data = await response.json()
          if (!response.ok) throw new Error(data.message || '删除失败')
          showToast(data.message || '游戏已删除', 'success')
          await fetchGames()
        } catch (deleteError) {
          showToast(deleteError instanceof Error ? deleteError.message : '删除失败', 'error')
        }
      },
    })
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/game/git-sync', { method: 'POST' })
      const data = await response.json()
      showToast(data.message || (response.ok ? '游戏已同步到 GitHub' : 'GitHub 同步失败'), response.ok ? 'success' : 'error')
    } catch {
      showToast('网络错误', 'error')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="site-page games-page container mx-auto max-w-6xl px-4 py-12 md:py-20">
      <div className="site-page__hero mx-auto flex max-w-2xl flex-col items-center gap-4 text-center md:gap-6">
        <div className="site-page__icon p-3 md:p-4"><Gamepad2 className="h-8 w-8 md:h-12 md:w-12" /></div>
        <p className="site-page__eyebrow">02 / PLAYGROUND</p>
        <h1 className="site-page__title">认真，玩点不一样<span>。</span></h1>
        <p className="site-page__description">上传独立网页游戏，保留 ZIP 源包，并通过 GitHub 管理版本。</p>
        {isAuthenticated && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild><Button><Upload className="mr-2 h-4 w-4" />上传游戏</Button></DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-lg">
                <DialogHeader><DialogTitle>上传网页游戏</DialogTitle><DialogDescription>ZIP 内应含 `index.html` 与 `src`、`assets` 等依赖。支持根目录或单层游戏目录。</DialogDescription></DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label htmlFor="game-name">游戏目录名 *</Label><Input id="game-name" placeholder="minesweeper" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} disabled={uploading} /><p className="text-xs text-muted-foreground">只可使用单个目录名；将保存为 `game/{form.name || '名称'}/` 与同级 ZIP。</p></div>
                  <div className="space-y-2"><Label htmlFor="game-title">展示名称</Label><Input id="game-title" placeholder="扫雷" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} disabled={uploading} /></div>
                  <div className="space-y-2"><Label htmlFor="game-description">简介</Label><Textarea id="game-description" placeholder="简短介绍玩法或技术特点" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} disabled={uploading} rows={3} /></div>
                  <div className="space-y-2"><Label htmlFor="game-file">ZIP 文件 *</Label><Input ref={fileRef} id="game-file" type="file" accept=".zip,application/zip" disabled={uploading} /><p className="text-xs text-muted-foreground">最大 50 MB，最多 500 个文件，解压后最大 150 MB。</p></div>
                </div>
                <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>取消</Button><Button onClick={handleUpload} disabled={uploading}>{uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileArchive className="mr-2 h-4 w-4" />}{uploading ? '解压上传中...' : '上传并解压'}</Button></div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={handleSync} disabled={syncing}>{syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GitBranch className="mr-2 h-4 w-4" />}{syncing ? '同步中...' : '同步到 Git'}</Button>
          </div>
        )}
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        : error ? <div className="site-empty py-16 text-center text-red-400">{error}</div>
        : games.length === 0 ? <div className="site-empty py-16 text-center text-muted-foreground">暂无游戏{isAuthenticated ? '，可上传第一个 ZIP 游戏包。' : ''}</div>
        : <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-6">{games.map((game) => (
          <article key={game.name} className="game-card flex min-h-52 flex-col p-6 md:p-8">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="text-2xl font-bold">{game.title}</h2><p className="mt-1 font-mono text-xs text-muted-foreground">/{game.name}/</p></div>{isAuthenticated && <Button variant="ghost" size="icon" className="shrink-0 text-destructive hover:text-destructive" onClick={() => handleDelete(game)} aria-label={`删除 ${game.title}`}><Trash2 className="h-4 w-4" /></Button>}</div>
            <p className="flex-1 text-sm leading-6 text-muted-foreground">{game.description || '独立网页小游戏'}</p>
            <Button className="mt-6 w-full" onClick={() => handleStartGame(game.name)}><Play className="mr-2 h-4 w-4" />开始游戏</Button>
          </article>
        ))}</div>}
    </div>
  )
}
