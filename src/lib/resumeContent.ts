import db from '@/lib/db'
import { initialResumeData } from '@/lib/initData'

export type ResumeContent = typeof initialResumeData

const cloneDefault = (): ResumeContent => JSON.parse(JSON.stringify(initialResumeData)) as ResumeContent

function matchesSchema(candidate: unknown, template: unknown): boolean {
  if (template === null) return candidate === null || typeof candidate === 'string'
  if (typeof template === 'string' || typeof template === 'number' || typeof template === 'boolean') return typeof candidate === typeof template
  if (Array.isArray(template)) {
    return Array.isArray(candidate) && candidate.every((item) => template.some((sample) => matchesSchema(item, sample)))
  }
  if (!template || typeof template !== 'object' || !candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false
  return Object.entries(template as Record<string, unknown>).every(([key, sample]) => matchesSchema((candidate as Record<string, unknown>)[key], sample))
}

/** Validates the fixed resume schema and reports the first actionable field errors. */
export function validateResumeContent(value: unknown): string[] {
  const issues: string[] = []
  const inspect = (candidate: unknown, template: unknown, path: string): void => {
    if (issues.length >= 12) return
    if (template === null) {
      if (candidate !== null && typeof candidate !== 'string') issues.push(`${path} 必须为字符串或 null`)
      return
    }
    if (typeof template === 'string' || typeof template === 'number' || typeof template === 'boolean') {
      if (typeof candidate !== typeof template) issues.push(`${path} 缺失或类型不正确`)
      return
    }
    if (Array.isArray(template)) {
      if (!Array.isArray(candidate)) { issues.push(`${path} 必须为数组`); return }
      if (candidate.length === 0) { issues.push(`${path} 不能为空`); return }
      candidate.forEach((item, index) => {
        if (!template.some((sample) => matchesSchema(item, sample))) issues.push(`${path}[${index}] 的字段结构不正确`)
      })
      return
    }
    if (!template || typeof template !== 'object' || !candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      issues.push(`${path} 必须为对象`)
      return
    }
    Object.entries(template as Record<string, unknown>).forEach(([key, sample]) => {
      const nextPath = path ? `${path}.${key}` : key
      if (!(key in (candidate as Record<string, unknown>))) issues.push(`${nextPath} 缺失`)
      else inspect((candidate as Record<string, unknown>)[key], sample, nextPath)
    })
  }
  inspect(value, initialResumeData, '')
  return issues
}

/** Validates the fixed resume schema before a JSON submission becomes live content. */
function isValidResumeContent(value: unknown): value is ResumeContent {
  return validateResumeContent(value).length === 0
}

/** Reads the administrator-edited data, falling back to the versioned default on first run. */
export function getResumeContent(): ResumeContent {
  const record = db.prepare('SELECT content FROM resume_content WHERE id = 1').get() as { content: string } | undefined
  if (!record) return cloneDefault()
  try {
    const content = JSON.parse(record.content) as unknown
    return isValidResumeContent(content) ? content : cloneDefault()
  } catch {
    return cloneDefault()
  }
}

export function saveResumeContent(content: unknown): ResumeContent {
  const issues = validateResumeContent(content)
  if (!isValidResumeContent(content)) throw new Error(`简历数据格式不正确：${issues.join('；')}`)
  const normalized = content as ResumeContent
  db.prepare(`
    INSERT INTO resume_content (id, content, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
  `).run(JSON.stringify(normalized))
  return normalized
}
