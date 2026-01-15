import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Hash } from "lucide-react"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { blogService } from "@/lib/blogService"

export default async function BlogCategoryPage(props: { 
  params: Promise<{ category: string }> 
}) {
  const { category } = await props.params
  
  // 从后端(文件系统)获取数据
  const categories = await blogService.getCategories()
  const filteredArticles = await blogService.getPostsByCategory(category)

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="flex flex-col gap-4 mb-10">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">博客</h1>
        <p className="text-lg text-muted-foreground">分享关于技术、生活和成长的见闻。</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* 左侧分类列表 - 侧边栏 */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Hash className="h-4 w-4 text-primary" />
                文章分类
              </h3>
              <nav className="flex flex-col gap-1">
                {categories.map((cat) => {
                  const isActive = category === cat.slug
                  return (
                    <Button
                      key={cat.slug}
                      variant={isActive ? "secondary" : "ghost"}
                      className="justify-between h-10 px-4 font-normal transition-all"
                      asChild
                    >
                      <Link href={`/blog/${cat.slug}`}>
                        <span>{cat.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${
                          isActive ? 'bg-primary/20 text-primary border-primary/20' : 'text-muted-foreground bg-background border-border/40'
                        }`}>
                          {cat.count}
                        </span>
                      </Link>
                    </Button>
                  )
                })}
              </nav>
            </div>

            <div className="p-6 border rounded-xl bg-card/50 hidden md:block">
              <h4 className="text-sm font-bold mb-3">订阅邮件</h4>
              <p className="text-xs text-muted-foreground mb-4">第一时间获取最新的文章推送。</p>
              <Button className="w-full h-9 text-xs">立即订阅</Button>
            </div>
          </div>
        </aside>

        {/* 右侧文章列表 - 主内容 */}
        <main className="flex-1 min-w-0">
          <div className="grid gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map((article) => (
                <article key={article.id} className="group flex flex-col gap-4 p-5 md:p-6 border rounded-2xl bg-card hover:shadow-md transition-all border-border/40 overflow-hidden relative">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        {article.categoryName}
                      </span>
                      <span className="text-xs text-muted-foreground">{article.date}</span>
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
                      <Link href={`/blog/${article.category}/${article.id}`}>{article.title}</Link>
                    </h2>
                    
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
                      来自 {article.categoryName} 分类下的精彩内容。
                    </p>
                    
                    <div className="flex items-center justify-between mt-2">
                      <Button variant="link" className="w-fit p-0 h-auto text-primary" asChild>
                        <Link href={`/blog/${article.category}/${article.id}`}>阅读全文 →</Link>
                      </Button>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{article.readTime}</span>
                        <span>{article.views} views</span>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="py-20 text-center border rounded-2xl border-dashed">
                <p className="text-muted-foreground">该分类下暂无文章</p>
              </div>
            )}
          </div>

          {/* 分页按钮 */}
          {filteredArticles.length > 0 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" />
                  </PaginationItem>
                  <PaginationItem className="hidden sm:inline-block">
                    <PaginationLink href="#" isActive>1</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
