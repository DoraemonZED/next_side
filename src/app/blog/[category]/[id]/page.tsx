import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Share2, Bookmark } from "lucide-react"
import { blogService } from "@/lib/blogService"
import { notFound } from "next/navigation"
import { PostClientWrapper } from "@/components/PostClientWrapper"

export default async function BlogPostDetail(props: { 
  params: Promise<{ category: string; id: string }> 
}) {
  const { category, id } = await props.params
  
  const post = await blogService.getPostDetail(category, id)
  
  if (!post) {
    notFound()
  }

  return (
    <article className="container mx-auto px-4 py-10 md:py-20">
      <div className="max-w-4xl mx-auto">
        {/* 返回按钮 */}
        <Button variant="ghost" size="sm" className="mb-8 gap-2 -ml-2 text-muted-foreground hover:text-primary" asChild>
          <Link href={`/blog/${category}`}>
            <ArrowLeft className="h-4 w-4" /> 返回分类列表
          </Link>
        </Button>

        {/* 文章头部信息 */}
        <div className="space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {post.date}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
            <div className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.author}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
            {post.title}
          </h1>
          
          <PostClientWrapper post={post} />
        </div>

        {/* 文章底部标签 */}
        <div className="mt-16 pt-8 border-t flex flex-wrap gap-2">
          <span className="px-3 py-1 bg-secondary text-secondary-foreground text-xs font-medium rounded-full">
            #{post.categoryName}
          </span>
        </div>
      </div>
    </article>
  )
}
