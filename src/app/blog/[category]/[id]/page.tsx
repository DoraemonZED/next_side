import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Calendar, Clock, User, Eye } from "lucide-react"
import { blogService } from "@/lib/blogService"
import { formatViews } from "@/lib/utils"
import { notFound } from "next/navigation"
import { PostClientWrapper } from "@/components/PostClientWrapper"
import { BackToTop } from "@/components/BackToTop"
import { ArticleOutline } from "@/components/ArticleOutline"
import { ReadingProgress } from "@/components/ReadingProgress"
import { BlogParticleField } from "@/components/BlogParticleField"

export default async function BlogPostDetail(props: { 
  params: Promise<{ category: string; id: string }> 
}) {
  const { category, id } = await props.params
  
  // 增加浏览量
  await blogService.incrementViews(category, id)
  
  const post = await blogService.getPostDetail(category, id)
  
  if (!post) {
    notFound()
  }

  return (
    <>
      <BlogParticleField />
      <article className="site-page post-detail">
      <ReadingProgress />
      <div className="post-detail__frame">
        <Button variant="ghost" size="sm" className="post-detail__back" asChild>
          <Link href={`/blog/${category}`}>
            <ArrowLeft className="h-4 w-4" /> 返回分类列表
          </Link>
        </Button>

        <header className="post-detail__head">
          <p className="site-page__eyebrow">ARTICLE / {post.categoryName}</p>
          <div className="post-detail__meta">
            <div className="post-detail__meta-item">
              <Calendar className="h-4 w-4" />
              {post.date}
            </div>
            <div className="post-detail__meta-item">
              <Clock className="h-4 w-4" />
              {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString('zh-CN') : post.date} 更新
            </div>
            <div className="post-detail__meta-item">
              <Eye className="h-4 w-4" />
              {formatViews(post.views)} 次浏览
            </div>
            <div className="post-detail__meta-item">
              <User className="h-4 w-4" />
              {post.author}
            </div>
          </div>
          <h1 className="post-detail__title text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
            {post.title}
          </h1>
          <div className="post-detail__lead">{post.summary}</div>
          <div className="post-detail__tags post-detail__head-tags" aria-label="文章标签">
            <span className="post-detail__tag post-detail__tag--category">#{post.categoryName}</span>
            {post.tags && post.tags.split(',').filter(Boolean).map((tag) => <span key={tag} className="post-detail__tag">#{tag.trim()}</span>)}
          </div>
        </header>

        <div className="post-detail__reading-grid">
          <ArticleOutline content={post.content} />
          <div className="post-detail__article">
            <PostClientWrapper post={post} />
          </div>
        </div>
      </div>
      <BackToTop />
      </article>
    </>
  )
}
