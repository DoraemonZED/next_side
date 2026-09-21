import db from '@/lib/db'
import { initialResumeData } from '@/lib/initData'

export type ResumeContent = typeof initialResumeData

const cloneDefault = (): ResumeContent => JSON.parse(JSON.stringify(initialResumeData)) as ResumeContent

/** Validates the fixed resume schema before a form submission becomes live content. */
function isValidResumeContent(value: unknown): value is ResumeContent {
  const matches = (candidate: unknown, template: unknown): boolean => {
    if (template === null) return candidate === null || typeof candidate === 'string'
    if (typeof template === 'string' || typeof template === 'number' || typeof template === 'boolean') return typeof candidate === typeof template
    if (Array.isArray(template)) {
      if (!Array.isArray(candidate)) return false
      // Every existing entry must match one of the known fixed item shapes.
      return candidate.every((item) => template.some((sample) => matches(item, sample)))
    }
    if (!template || typeof template !== 'object' || !candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false
    return Object.entries(template as Record<string, unknown>).every(([key, sample]) => matches((candidate as Record<string, unknown>)[key], sample))
  }
  return matches(value, initialResumeData)
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
  if (!isValidResumeContent(content)) throw new Error('简历数据格式不正确，请通过表单填写必填字段')
  const normalized = content as ResumeContent
  db.prepare(`
    INSERT INTO resume_content (id, content, updated_at) VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = CURRENT_TIMESTAMP
  `).run(JSON.stringify(normalized))
  return normalized
}
