import { redirect } from "next/navigation"
import { blogService } from "@/lib/blogService"

export default async function BlogRootPage() {
  const categories = await blogService.getCategories()
  
  if (categories.length > 0) {
    redirect(`/blog/${categories[0].slug}`)
  }
  
  // 如果没有任何分类，可以保持在这个页面或显示提示
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">暂无博客分类</p>
    </div>
  )
}
