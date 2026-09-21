import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "全栈开发工程师简历｜杨伟",
  description: "杨伟的全栈开发工程师简历：Node.js、Java、AI Agent、实时通信与多端产品交付。",
}

export default function ResumeLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
