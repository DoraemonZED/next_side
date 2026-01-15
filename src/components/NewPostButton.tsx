'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
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
import { Plus } from 'lucide-react';

interface NewPostButtonProps {
  category: string;
}

export function NewPostButton({ category }: NewPostButtonProps) {
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          id,
          meta: { title, author: 'Admin', date: new Date().toISOString().split('T')[0] },
          content: '# ' + title + '\n\n新文章内容...'
        }),
      });
      
      if (res.ok) {
        setOpen(false);
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.message || '创建失败');
      }
    } catch (err) {
      alert('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> 新建文章
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新建文章</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreate} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!id) setId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
              }}
              placeholder="文章标题"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id">ID (URL 路径)</Label>
            <Input
              id="id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="my-new-post"
              required
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? '创建中...' : '创建文章'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
