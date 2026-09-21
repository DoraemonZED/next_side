import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "全栈开发、AI 与工程实践",
  description: "记录全栈开发、AI 应用与软件工程中的方法、实践与复盘。",
}

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
