'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle } from 'lucide-react';
import { BlogGitSyncButton } from '@/components/BlogGitSyncButton';

export function NewCategoryButton() {
  const [name, setName] = useState('');
  const [directoryId, setDirectoryId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { showToast, setLoading: setGlobalLoading } = useUIStore();

  if (!isAuthenticated) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading(true);
    
    try {
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, directoryId, description: '' }),
      });
      
      if (res.ok) {
        showToast('分类创建成功', 'success');
        setOpen(false);
        window.location.href = `/blog/${directoryId}`;
      } else {
        const data = await res.json();
        showToast(data.message || '创建失败', 'error');
      }
    } catch {
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-4 gap-2 border-dashed">
            <PlusCircle className="h-4 w-4" /> 新建分类
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>新建分类</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">分类名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：技术笔记"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category-directory-id">目录 ID</Label>
              <Input
                id="category-directory-id"
                value={directoryId}
                onChange={(e) => setDirectoryId(e.target.value.toLowerCase())}
                placeholder="例如：tech-notes（创建后不可修改）"
                pattern="[a-z]+(-[a-z]+)*"
                title="只能包含小写英文字母和连字符"
                required
              />
              <p className="text-xs text-muted-foreground">必填；同时作为分类目录与页面路径，只能包含小写英文字母和连字符。</p>
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建分类'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <BlogGitSyncButton />
    </div>
  );
}
