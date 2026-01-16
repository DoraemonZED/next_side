"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { PostMeta } from "@/lib/blogService";
import { useRouter } from "next/navigation";

interface PostCardProps {
  article: PostMeta;
}

export function PostCard({ article }: PostCardProps) {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;

    try {
      const res = await fetch(`/api/blog/posts?category=${article.category}&id=${article.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  return (
    <article className="group flex flex-col gap-4 p-5 md:p-6 border rounded-2xl bg-card hover:shadow-md transition-all border-border/40 overflow-hidden relative">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {article.categoryName}
            </span>
            <span className="text-xs text-muted-foreground">{article.date}</span>
          </div>

          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
  );
}
