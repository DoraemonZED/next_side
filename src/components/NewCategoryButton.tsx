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
import { PlusCircle, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NewCategoryButton() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { showToast, setLoading: setGlobalLoading } = useUIStore();
  const router = useRouter();

  if (!isAuthenticated) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading(true);
    
    try {
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, description: '' }),
      });
      
      if (res.ok) {
        showToast('分类创建成功', 'success');
        setOpen(false);
        window.location.href = `/blog/${slug}`;
      } else {
        const data = await res.json();
        showToast(data.message || '创建失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setGlobalLoading(true);
    try {
      const res = await fetch('/api/blog/sync', {
        method: 'POST',
      });
      if (res.ok) {
        showToast('数据同步成功', 'success');
        router.refresh();
      } else {
        const data = await res.json();
        showToast(data.message || '同步失败', 'error');
      }
    } catch (err) {
      showToast('网络错误', 'error');
    } finally {
      setSyncing(false);
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
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                }}
                placeholder="例如：技术笔记"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slug">路径 (Slug)</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="tech-notes"
                required
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? '创建中...' : '创建分类'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      
      <Button 
        variant="ghost" 
        size="sm" 
        className="w-full gap-2 text-muted-foreground hover:text-primary"
        onClick={handleSync}
        disabled={syncing}
      >
        <RefreshCcw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
        {syncing ? '正在同步...' : '同步本地文件'}
      </Button>
    </div>
  );
}
