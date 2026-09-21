'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }
type JsonObject = { [key: string]: JsonValue }

const fieldLabels: Record<string, string> = {
  site: '站点信息', hero: '首屏信息', profile: '个人资料', capabilities: '核心能力', projects: '代表项目', skillGroups: '技术栈', history: '经历', engineering: '工程总结', otherSkills: '补充技能',
  brandInitials: '品牌缩写', brandName: '品牌名称', brandSuffix: '品牌后缀', contactEmail: '联系邮箱', availability: '求职状态', overline: '职位标识', name: '显示名称', headlineLines: '主标题分行', emphasisLine: '高亮标题', summary: '首屏简介', code: '代码窗内容',
  role: '职位', englishName: '英文身份', bio: '个人简介', phone: '联系电话', displayPhone: '展示电话', location: '所在地', experience: '工作经验', status: '当前状态', statusDetail: '状态说明',
  icon: '图标标识', no: '序号', title: '标题', text: '说明', tags: '标签', label: '标签名称', badge: '角标', note: '补充说明', skills: '技能项', level: '熟练度',
  stack: '技术栈', intro: '项目简介', points: '项目要点', architecture: '架构要点', metric: '指标名称', value: '指标值', date: '时间', type: '类型', eyebrow: '辅助标题', sideInfo: '右侧信息', detail: '职责内容', items: '条目', credential: '证书',
}

const displayLabel = (key: string) => fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').trim()
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function setAtPath(source: JsonObject, path: (string | number)[], nextValue: JsonValue): JsonObject {
  const next = clone(source)
  let target: JsonObject | JsonValue[] = next
  path.slice(0, -1).forEach((part) => { target = target[part as never] as JsonObject | JsonValue[] })
  target[path[path.length - 1] as never] = nextValue as never
  return next
}

function Field({ value, path, onChange }: { value: JsonValue; path: (string | number)[]; onChange: (path: (string | number)[], value: JsonValue) => void }) {
  const key = String(path[path.length - 1] ?? '')
  const id = `resume-${path.join('-')}`
  if (Array.isArray(value)) {
    const primitive = value.every((item) => typeof item === 'string')
    if (primitive) {
      return <div className="grid gap-2"><Label htmlFor={id}>{displayLabel(key)}<span className="ml-2 text-xs font-normal text-muted-foreground">每行一项</span></Label><Textarea id={id} value={(value as string[]).join('\n')} onChange={(event) => onChange(path, event.target.value.split('\n').map((item) => item.trim()).filter(Boolean))} /></div>
    }
    return <fieldset className="grid gap-4 rounded-xl border border-border/70 p-4"><legend className="px-2 text-sm font-semibold">{displayLabel(key)}</legend>{value.map((item, index) => <div className="rounded-lg border border-border/60 bg-muted/20 p-4" key={index}><p className="mb-3 text-xs font-medium text-muted-foreground">{displayLabel(key)} {String(index + 1).padStart(2, '0')}</p><Field value={item} path={[...path, index]} onChange={onChange} /></div>)}</fieldset>
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    const isRoot = path.length === 0
    return <section className={isRoot ? 'grid gap-8' : 'grid gap-4'}>{!isRoot && key && <h2 className="border-b border-border pb-2 text-base font-semibold">{displayLabel(key)}</h2>}{entries.map(([childKey, childValue]) => <Field key={childKey} value={childValue} path={[...path, childKey]} onChange={onChange} />)}</section>
  }
  if (typeof value === 'number') {
    return <div className="grid gap-2"><Label htmlFor={id}>{displayLabel(key)}</Label><Input id={id} type="number" min={0} max={100} value={value} onChange={(event) => onChange(path, Number(event.target.value))} /></div>
  }
  const stringValue = value ?? ''
  const isLongText = typeof stringValue === 'string' && (stringValue.length > 64 || ['bio', 'text', 'intro', 'role'].includes(key))
  return <div className="grid gap-2"><Label htmlFor={id}>{displayLabel(key)}</Label>{isLongText ? <Textarea id={id} value={String(stringValue)} onChange={(event) => onChange(path, event.target.value)} /> : <Input id={id} value={String(stringValue)} onChange={(event) => onChange(path, event.target.value)} />}</div>
}

export default function ResumeEditPage() {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore()
  const { showToast } = useUIStore()
  const [content, setContent] = useState<JsonObject | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { void checkAuth() }, [checkAuth])
  useEffect(() => {
    fetch('/api/resume/content').then((response) => response.json()).then((data) => setContent(data.content as JsonObject)).catch(() => showToast('简历内容读取失败', 'error'))
  }, [showToast])

  const save = async () => {
    if (!content) return
    setSaving(true)
    try {
      const response = await fetch('/api/resume/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || '保存失败')
      setContent(data.content as JsonObject)
      showToast('简历内容已保存，网页和 PDF 会同步更新', 'success')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <main className="site-page py-20 text-center text-muted-foreground">正在验证登录状态…</main>
  if (!isAuthenticated) return <main className="site-page py-20 text-center"><h1 className="text-2xl font-bold">需要管理员登录</h1><p className="mt-3 text-muted-foreground">请先通过 Header 的登录入口完成验证。</p></main>

  return <main className="site-page py-10">
    <div className="mx-auto w-full max-w-5xl">
      <div className="sticky top-20 z-10 mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-border bg-background/95 pb-6 backdrop-blur">
        <div><Link href="/resume" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />返回简历</Link><p className="mt-5 text-xs font-semibold tracking-[.18em] text-primary">RESUME CONTENT SYSTEM</p><h1 className="mt-2 text-3xl font-bold tracking-tight">编辑简历内容</h1><p className="mt-2 text-sm text-muted-foreground">固定字段表单会保护内容结构；标签和条目以每行一项编辑。</p></div>
        <Button onClick={save} disabled={saving || !content}><Save className="mr-2 h-4 w-4" />{saving ? '保存中...' : '保存修改'}</Button>
      </div>
      {content ? <div className="grid gap-8 pb-12">{Object.entries(content).map(([key, value]) => <Field key={key} value={value} path={[key]} onChange={(path, value) => setContent((current) => current ? setAtPath(current, path, value) : current)} />)}</div> : <p className="py-20 text-center text-muted-foreground">正在载入内容…</p>}
    </div>
  </main>
}
