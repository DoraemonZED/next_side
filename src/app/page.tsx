import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Code2, Rocket, Sparkles } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-6 md:mb-8">
          <Sparkles className="h-4 w-4" />
          <span>全新版本现已发布</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6 md:mb-8">
          构建您的 <span className="text-primary">数字世界</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 md:mb-12">
          记录全栈开发、实时通信与 AI Agent 实践，也收录可直接游玩的浏览器小游戏。
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base gap-2" asChild>
            <Link href="/blog">
              开始探索 <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base" asChild>
            <Link href="/resume">查看简历</Link>
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="p-8 border rounded-2xl bg-card space-y-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">极速响应</h3>
            <p className="text-muted-foreground">基于 Next.js App Router 的流式渲染，确保用户感知性能最佳。</p>
          </div>
          <div className="p-8 border rounded-2xl bg-card space-y-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">现代化架构</h3>
            <p className="text-muted-foreground">采用 Tailwind v4、TypeScript 和 Shadcn UI，代码结构清晰易维护。</p>
          </div>
          <div className="p-8 border rounded-2xl bg-card space-y-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">精美 UI</h3>
            <p className="text-muted-foreground">精心调校的浅色与深色主题配色方案，提供舒适的视觉体验。</p>
          </div>
        </div>
      </section>
    </div>
  )
}
