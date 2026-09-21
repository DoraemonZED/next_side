import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "互动实验室",
  description: "AWEI 数字实验室中的互动作品与小游戏。",
}

export default function GamesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children
}
