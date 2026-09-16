import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { blogService, postSortField, postSortOrder } from "@/lib/blogService"
import { NewPostButton } from "@/components/NewPostButton"
import { NewCategoryButton } from "@/components/NewCategoryButton"
import { CategoryList } from "@/components/CategoryList"
import { PostCard } from "@/components/PostCard"
import { PostFilters } from "@/components/PostFilters"
import { BlogParticleField } from "@/components/BlogParticleField"
import { BookOpen, FolderTree } from "lucide-react"

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
  const { posts, totalPages } = await blogService.getPostsByCategory(
    category, 
    currentPage, 
    10,
    searchQuery,
    postSortField(sortBy),
    postSortOrder(sortOrder)
  )
  const activeCategory = categories.find((item) => item.directoryId === category)

  return (
    <>
      <BlogParticleField />
      <div className="site-page blog-page">
      <div className="blog-page__layout">
        <aside className="blog-sidebar">
          <div className="blog-sidebar__sticky">
            <CategoryList categories={categories} currentCategory={category} />
            <NewCategoryButton />
            <NewPostButton category={category} />
            <div className="blog-sidebar__protocol">
              <BookOpen aria-hidden="true" />
              <span>TOPIC NOTES</span>
              <p>文章与素材以 Markdown 为源，版本演进都留在可追溯的仓库中。</p>
              <div><FolderTree /> <small>{activeCategory?.directoryId ?? category}</small></div>
            </div>
          </div>
        </aside>

        <main id="post-index" className="blog-feed">
          <div className="blog-feed__masthead">
            <div>
              <span>TOPIC INDEX / {String((activeCategory?.order ?? 0) + 1).padStart(2, '0')}</span>
              <p>{searchQuery ? `检索：${searchQuery}` : "本主题的文章与实践记录"}</p>
            </div>
            <div className="blog-feed__masthead-actions">
              <small>{String(activeCategory?.count ?? 0).padStart(2, "0")} ENTRIES</small>
            </div>
          </div>
          <PostFilters />
          
          <div className="blog-feed__list grid gap-6">
            {posts.length > 0 ? (
              posts.map((article) => (
                <PostCard key={article.id} article={article} />
              ))
            ) : (
              <div className="site-empty blog-feed__empty py-20 text-center border border-dashed">
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
    </>
  )
}
