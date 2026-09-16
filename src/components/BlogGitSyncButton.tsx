'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GitBranch, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Input } from '@/components/ui/input';

export function BlogGitSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const { showConfirm, showToast } = useUIStore();
  const router = useRouter();

  if (!isAuthenticated) return null;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/blog/git-sync', { method: 'POST' });
      const data = await response.json();
      showToast(data.message || (response.ok ? '博客已同步到 GitHub' : 'GitHub 同步失败'), response.ok ? 'success' : 'error');
      if (response.ok) router.refresh();
    } catch {
      showToast('网络错误', 'error');
    } finally {
      setIsSyncing(false);
    }
  };
  const confirmSync = () => {
    showConfirm({
      title: '获取 GitHub 博客更新？',
      message: '将扫描文章文件并清理 SQLite 中已删除文章的失效数据，然后从 GitHub 快进获取更新。页面保存时已自动推送，因此此操作不会重复推送。',
      onConfirm: () => void handleSync(),
    });
  };
  const handleUpload = async (file?: File) => {
    if (!file) return;
    setIsUploading(true);
    try {
      const body = new FormData(); body.append('file', file);
      const response = await fetch('/api/blog/upload', { method: 'POST', body });
      const data = await response.json();
      showToast(data.message || (response.ok ? '上传成功' : '上传失败'), response.ok ? 'success' : 'error');
      if (response.ok) window.location.reload();
    } catch { showToast('网络错误', 'error'); } finally { setIsUploading(false); }
  };

  return (
    <div className="blog-git-sync space-y-1">
      <label className="flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent disabled:pointer-events-none">
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{isUploading ? '上传中...' : '上传博客 ZIP'}
        <Input className="sr-only" type="file" accept=".zip,application/zip" disabled={isUploading} onChange={(event) => void handleUpload(event.target.files?.[0])} />
      </label>
      <Button variant="outline" className="w-full gap-2" onClick={confirmSync} disabled={isSyncing}>
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
        {isSyncing ? '获取中...' : '获取 GitHub 更新'}
      </Button>
    </div>
  );
}
