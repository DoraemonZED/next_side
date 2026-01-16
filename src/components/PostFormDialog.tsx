"use client";

import { useState } from "react";
import { useUIStore } from "@/store/useUIStore";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PostMeta } from "@/lib/blogService";

interface PostFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  article?: PostMeta; // 如果有，则是编辑模式
  mode: "create" | "edit";
}

export function PostFormDialog({
  open,
  onOpenChange,
  category,
  article,
  mode,
}: PostFormDialogProps) {
  const [title, setTitle] = useState(article?.title || "");
  const [tags, setTags] = useState(article?.tags || "");
  const [summary, setSummary] = useState(article?.summary || "");
  const { showToast, setLoading } = useUIStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let id = article?.id;
    if (mode === "create") {
      id = title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      
      if (!id) id = Date.now().toString();
    }

    try {
      const res = await fetch("/api/blog/posts", {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          id,
          meta: { 
            title, 
            tags, 
            summary,
            // 编辑模式下不改变原有日期和作者，新建时由后端或这里处理
            ...(mode === "create" ? { 
              author: "Admin", 
              date: new Date().toISOString().split("T")[0] 
            } : {})
          },
          // 如果是新建，传一个初始内容
          ...(mode === "create" ? { content: "# " + title + "\n\n新文章内容..." } : {}),
        }),
      });

      if (res.ok) {
        showToast(mode === "create" ? "文章创建成功" : "文章已更新", "success");
        onOpenChange(false);
        if (mode === "create") {
          window.location.reload();
        } else {
          router.refresh();
        }
      } else {
        const data = await res.json();
        showToast(data.message || "操作失败", "error");
      }
    } catch (err) {
      showToast("网络错误", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "新建文章" : "编辑文章信息"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          <div className="grid gap-2">
            <Label htmlFor="post-title">标题</Label>
            <Input
              id="post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入文章标题"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="post-tags">标签 (Tags)</Label>
            <Input
              id="post-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="例如：React, Nextjs (用逗号分隔)"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="post-summary">简介 (Summary)</Label>
            <Textarea
              id="post-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="请输入文章简介..."
              className="h-24 resize-none"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">
              {mode === "create" ? "创建文章" : "保存修改"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
