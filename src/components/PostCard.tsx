"use client";

import Link from "next/link";
import { Trash2, Settings2, Eye, ArrowUpRight, CalendarDays, Share2, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useUIStore } from "@/store/useUIStore";
import { PostMeta } from "@/lib/blogService";
import { formatViews } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PostFormDialog } from "./PostFormDialog";

// 格式化修改时间为相对时间
function formatUpdatedAt(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  return `${Math.floor(diffDays / 365)}年前`;
}

interface PostCardProps {
  article: PostMeta;
}

export function PostCard({ article }: PostCardProps) {
  const { isAuthenticated } = useAuthStore();
  const { showConfirm, showToast, setLoading } = useUIStore();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const router = useRouter();
  const date = new Date(article.date);
  const year = Number.isNaN(date.getTime()) ? '—' : String(date.getFullYear());
  const issue = Number.isNaN(date.getTime()) ? 'NOTE' : `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    showConfirm({
      title: "删除文章",
      message: "确定要删除这篇文章吗？此操作不可撤销。",
      onConfirm: async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/blog/posts?category=${article.category}&id=${article.id}`, {
            method: "DELETE",
          });
          if (res.ok) {
            showToast("文章删除成功", "success");
            router.refresh();
          } else {
            showToast("文章删除失败", "error");
          }
        } catch (error) {
          showToast("网络错误", "error");
          console.error("Failed to delete post", error);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  return (
    <article className="blog-post-card group">
      <div className="blog-post-card__index" aria-hidden="true">
        <span>{year}</span><strong>{issue}</strong><i />
      </div>
      <div className="blog-post-card__body">
        <div className="blog-post-card__top">
          <div className="blog-post-card__labels">
            <span className="blog-post-card__category text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap shrink-0">
              {article.categoryName}
            </span>
            {article.tags && article.tags.split(',').map(tag => (
              <span key={tag} className="blog-post-card__tag text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium whitespace-nowrap shrink-0">
                {tag.trim()}
              </span>
            ))}
          </div>

          {isAuthenticated && (
            <div className="blog-post-card__admin">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditDialogOpen(true);
                }}
              >
                <Settings2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        <h2 className="blog-post-card__title text-xl md:text-2xl font-bold group-hover:text-primary transition-colors leading-tight">
          <Link href={`/blog/${article.category}/${article.id}`}>{article.title}</Link>
        </h2>

        <p className="blog-post-card__summary text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-3">
          {article.summary}
        </p>

        <div className="blog-post-card__footer">
          <Button variant="link" className="blog-post-card__read w-fit p-0 h-auto text-primary" asChild>
            <Link href={`/blog/${article.category}/${article.id}`}>阅读全文 <ArrowUpRight className="h-3.5 w-3.5" /></Link>
          </Button>
          <div className="blog-post-card__meta">
            <span className="flex items-center gap-1" title="点赞" aria-label={`点赞 ${formatViews(article.likes)}`}>
              <ThumbsUp className="h-3 w-3" />
              {formatViews(article.likes)}
            </span>
            <span className="flex items-center gap-1" title="观看" aria-label={`观看 ${formatViews(article.views)}`}>
              <Eye className="h-3 w-3" />
              {formatViews(article.views)}
            </span>
            <span className="flex items-center gap-1" title="分享" aria-label={`分享 ${formatViews(article.shares)}`}>
              <Share2 className="h-3 w-3" />
              {formatViews(article.shares)}
            </span>
            <span className="flex items-center gap-1" title="更新" aria-label={`更新于 ${formatUpdatedAt(article.updatedAt)}`}>
              <CalendarDays className="h-3 w-3" />
              {formatUpdatedAt(article.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <PostFormDialog
        mode="edit"
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={article.category}
        article={article}
      />
    </article>
  );
}
