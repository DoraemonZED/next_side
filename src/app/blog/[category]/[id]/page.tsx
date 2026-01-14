import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react"

export default async function BlogPostDetail(props: { 
  params: Promise<{ category: string; id: string }> 
}) {
  const { category, id } = await props.params

  return (
    <article className="container mx-auto px-4 py-10 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 - 链接回到对应的分类列表 */}
        <Button variant="ghost" size="sm" className="mb-8 gap-2 -ml-2 text-muted-foreground hover:text-primary" asChild>
          <Link href={`/blog/${category}`}>
            <ArrowLeft className="h-4 w-4" /> 返回{category === "all" ? "博客列表" : "分类列表"}
          </Link>
        </Button>

        {/* 文章头部信息 */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              2026年1月20日
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              10 min read
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              张三
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            如何使用 Next.js 16 构建现代化应用 #{id}
          </h1>
          
          <div className="flex items-center justify-between py-6 border-y border-border/40">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-sm font-bold">张三</div>
                <div className="text-xs text-muted-foreground">高级前端开发工程师</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-9 w-9">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* 文章正文 (模拟) */}
        <div className="prose prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed space-y-8 text-foreground/90">
          <p>
            在现代 Web 开发的浪潮中，Next.js 始终处于领先地位。随着版本 16 的发布，我们迎来了一系列激动人心的新特性。
          </p>
          
          <h2 className="text-2xl font-bold mt-12 mb-4">服务器组件 (React Server Components)</h2>
          <p>
            React Server Components 是 Next.js 16 的核心。它允许我们在服务器端运行组件，从而大幅减少发送到客户端的 JavaScript 束大小。
          </p>
          
          <div className="p-8 bg-muted/50 border rounded-2xl my-8">
            <p className="italic text-muted-foreground">
              "Next.js 16 不仅仅是一个更新，它是对我们如何构建和交付 React 应用的重新思考。"
            </p>
          </div>
        </div>

        {/* 文章底部标签 */}
        <div className="mt-16 pt-8 border-t flex flex-wrap gap-2">
          {["Next.js", "React", "Frontend", "Performance"].map(tag => (
            <span key={tag} className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
