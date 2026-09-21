import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getResumeContent, saveResumeContent } from '@/lib/resumeContent'

export async function GET() {
  return NextResponse.json({ content: getResumeContent() })
}

export async function PUT(request: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ message: '未授权' }, { status: 401 })
  try {
    const { content } = await request.json() as { content?: unknown }
    return NextResponse.json({ message: '简历内容已保存', content: saveResumeContent(content) })
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : '保存失败' }, { status: 400 })
  }
}
