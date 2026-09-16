import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { blogService, postSortField, postSortOrder } from "@/lib/blogService"
import { NewCategoryButton } from "@/components/NewCategoryButton"
import { NewPostButton } from "@/components/NewPostButton"
import { BlogGitSyncButton } from "@/components/BlogGitSyncButton"
import { CategoryList } from "@/components/CategoryList"
import { PostCard } from "@/components/PostCard"
import { PostFilters } from "@/components/PostFilters"
import { BlogParticleField } from "@/components/BlogParticleField"
import { BookOpen, FolderTree } from "lucide-react"

export default async function BlogRootPage(props: {
  searchParams: Promise<{ 
    page?: string, 
    q?: string, 
    sortBy?: string, 
    sortOrder?: string 
  }>
}) {
  const { 
    page: pageStr, 
    q: searchQuery = '', 
    sortBy = 'date', 
    sortOrder = 'desc' 
  } = await props.searchParams
  
  const currentPage = parseInt(pageStr || '1', 10)
  
  // 获取所有分类和所有文章
  const categories = await blogService.getCategories()
  const { posts, totalPages } = await blogService.getAllPosts(
    currentPage, 
    10,
    searchQuery,
    postSortField(sortBy),
    postSortOrder(sortOrder)
  )
  const totalPostCount = categories.reduce((total, category) => total + category.count, 0)

  return (
    <>
      <BlogParticleField />
      <div className="site-page blog-page">
      <div className="blog-page__layout">
        <aside className="blog-sidebar">
          <div className="blog-sidebar__sticky">
            <CategoryList categories={categories} currentCategory="all" />
            <div className="blog-sidebar__primary-actions">
              <NewCategoryButton />
              <NewPostButton category="all" />
            </div>
            <BlogGitSyncButton />
            <div className="blog-sidebar__protocol">
              <BookOpen aria-hidden="true" />
              <span>READER&apos;S PROTOCOL</span>
              <p>不追逐碎片化收藏，只记录经过验证、可以迁移的工作方法。</p>
              <div><FolderTree /> <small>CONTENT / GIT / MD</small></div>
            </div>
          </div>
        </aside>

        <main id="post-index" className="blog-feed">
          <div className="blog-feed__masthead">
            <div>
              <span>THE INDEX / 01</span>
              <p>{searchQuery ? `检索：${searchQuery}` : "最新文章与实践记录"}</p>
            </div>
            <small>{String(totalPostCount).padStart(2, "0")} / ENTRIES</small>
          </div>
          <PostFilters />
          
          <div className="blog-feed__list grid gap-6">
            {posts.length > 0 ? (
              posts.map((article) => (
                <PostCard key={`${article.category}-${article.id}`} article={article} />
              ))
            ) : (
              <div className="site-empty blog-feed__empty py-20 text-center border border-dashed">
                <p className="text-muted-foreground">
                  {searchQuery ? `未找到与 "${searchQuery}" 相关的文章` : "暂无文章"}
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
