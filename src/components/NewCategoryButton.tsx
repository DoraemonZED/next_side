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
import { PlusCircle } from 'lucide-react';

export function NewCategoryButton() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch('/api/blog/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, description: '' }),
      });
      
      if (res.ok) {
        setOpen(false);
        window.location.href = `/blog/${slug}`;
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
  );
}
