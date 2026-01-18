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
import { NewPostButton } from "@/components/NewPostButton"
import { NewCategoryButton } from "@/components/NewCategoryButton"
import { CategoryList } from "@/components/CategoryList"
import { PostCard } from "@/components/PostCard"
import { PostFilters } from "@/components/PostFilters"

export default async function BlogCategoryPage(props: { 
  params: Promise<{ category: string }>,
  searchParams: Promise<{ 
    page?: string, 
    q?: string, 
    sortBy?: string, 
    sortOrder?: string 
  }>
}) {
  const { category } = await props.params
  const { 
    page: pageStr, 
    q: searchQuery = '', 
    sortBy = 'date', 
    sortOrder = 'desc' 
  } = await props.searchParams
  
  const currentPage = parseInt(pageStr || '1', 10)
  
  // 从后端(文件系统)获取数据
  const categories = await blogService.getCategories()
  const { posts, totalPages, total } = await blogService.getPostsByCategory(
    category, 
    currentPage, 
    10,
    searchQuery,
    sortBy as any,
    sortOrder as any
  )

  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">博客</h1>
          <p className="text-lg text-muted-foreground">分享关于技术、生活和成长的见闻。</p>
        </div>
        {/* 大屏时显示在标题右侧 */}
        <div className="hidden md:block">
          <NewPostButton category={category} />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* 左侧分类列表 - 侧边栏 */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <CategoryList categories={categories} currentCategory={category} />
            <NewCategoryButton />
            

            <div className="p-6 border rounded-xl bg-card/50 hidden md:block">
              <h4 className="text-sm font-bold mb-3">订阅邮件</h4>
              <p className="text-xs text-muted-foreground mb-4">第一时间获取最新的文章推送。</p>
              <Button className="w-full h-9 text-xs">立即订阅</Button>
            </div>
          </div>
        </aside>

        {/* 小屏时显示在分类列表和新建分类按钮下方、搜索框上方 */}
        <div className="md:hidden flex justify-end">
          <NewPostButton category={category} />
        </div>

        {/* 右侧文章列表 - 主内容 */}
        <main className="flex-1 min-w-0">
          <PostFilters />
          
          <div className="grid gap-6">
            {posts.length > 0 ? (
              posts.map((article) => (
                <PostCard key={article.id} article={article} />
              ))
            ) : (
              <div className="py-20 text-center border rounded-2xl border-dashed">
                <p className="text-muted-foreground">
                  {searchQuery ? `未找到与 "${searchQuery}" 相关的文章` : "该分类下暂无文章"}
                </p>
              </div>
            )}
          </div>

          {/* 分页按钮 */}
          {totalPages > 1 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href={currentPage > 1 ? `?page=${currentPage - 1}${searchQuery ? `&q=${searchQuery}` : ""}${sortBy !== 'date' ? `&sortBy=${sortBy}` : ""}${sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ""}` : "#"} 
                      className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  
                  {/* 小屏下显示当前页/总页数 */}
                  <PaginationItem className="sm:hidden">
                    <span className="flex items-center justify-center px-4 py-2 text-sm text-muted-foreground">
                      {currentPage} / {totalPages}
                    </span>
                  </PaginationItem>
                  
                  {/* 大屏下显示所有页码 */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <PaginationItem key={pageNum} className="hidden sm:inline-block">
                      <PaginationLink 
                        href={`?page=${pageNum}${searchQuery ? `&q=${searchQuery}` : ""}${sortBy !== 'date' ? `&sortBy=${sortBy}` : ""}${sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ""}`} 
                        isActive={currentPage === pageNum}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext 
                      href={currentPage < totalPages ? `?page=${currentPage + 1}${searchQuery ? `&q=${searchQuery}` : ""}${sortBy !== 'date' ? `&sortBy=${sortBy}` : ""}${sortOrder !== 'desc' ? `&sortOrder=${sortOrder}` : ""}` : "#"} 
                      className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                    />
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
