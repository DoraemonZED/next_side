'use client';

import { type ChangeEvent, type DragEvent, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileArchive, FileUp, GitBranch, Loader2, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const MAX_ZIP_SIZE = 30 * 1024 * 1024;
const formatFileSize = (size: number) => `${(size / 1024 / 1024).toFixed(size >= 10 * 1024 * 1024 ? 0 : 1)} MB`;

export function BlogGitSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const selectFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.zip')) {
      setSelectedFile(null); setUploadError('请选择 .zip 格式的博客压缩包。'); return;
    }
    if (file.size > MAX_ZIP_SIZE) {
      setSelectedFile(null); setUploadError('ZIP 文件不能超过 30 MB。'); return;
    }
    const signature = new Uint8Array(await file.slice(0, 2).arrayBuffer());
    if (signature[0] !== 0x50 || signature[1] !== 0x4b) {
      setSelectedFile(null); setUploadError('该文件不是有效的 ZIP 压缩包。'); return;
    }
    setSelectedFile(file);
    setUploadError('');
  };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    void selectFile(event.target.files?.[0]);
    event.target.value = '';
  };
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void selectFile(event.dataTransfer.files?.[0]);
  };
  const closeUploadDialog = (open: boolean) => {
    if (isUploading) return;
    setUploadOpen(open);
    if (!open) { setSelectedFile(null); setUploadError(''); setIsDragging(false); }
  };
  const handleUpload = async () => {
    if (!selectedFile) { setUploadError('请先选择 ZIP 文件。'); return; }
    setIsUploading(true);
    try {
      const body = new FormData(); body.append('file', selectedFile);
      const response = await fetch('/api/blog/upload', { method: 'POST', body });
      const data = await response.json();
      showToast(data.message || (response.ok ? '上传成功' : '上传失败'), response.ok ? 'success' : 'error');
      if (response.ok) { setUploadOpen(false); window.location.reload(); }
    } catch { showToast('网络错误', 'error'); } finally { setIsUploading(false); }
  };

  return (
    <div className="blog-git-sync space-y-1">
      <Button variant="outline" className="blog-sidebar__action w-full gap-2" onClick={() => setUploadOpen(true)} disabled={isUploading}>
        <Upload className="h-4 w-4" /> 导入博客 ZIP
      </Button>
      <Button variant="outline" className="blog-sidebar__action w-full gap-2" onClick={confirmSync} disabled={isSyncing}>
        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <GitBranch className="h-4 w-4" />}
        {isSyncing ? '获取中...' : '获取 GitHub 更新'}
      </Button>
      <Dialog open={uploadOpen} onOpenChange={closeUploadDialog}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>导入博客 ZIP</DialogTitle>
            <DialogDescription>先选择并校验 ZIP，确认后才会上传并导入。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/35 p-4 text-sm leading-6 text-muted-foreground">
              <p><strong className="text-foreground">目录格式：</strong>分类 ID/文章 ID/文件；每篇必须包含 <code>index.md</code>。</p>
              <p className="mt-2"><strong className="text-foreground">导入流程：</strong>前端先检查 ZIP 格式与大小；服务端再校验目录结构、补全 Markdown 头信息，并初始化浏览、点赞、分享数据。</p>
            </div>
            <div role="button" tabIndex={0} className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 text-center transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/60 hover:bg-muted/40'}`} onClick={() => fileInputRef.current?.click()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); fileInputRef.current?.click(); } }} onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop}>
              <FileUp className="mb-3 h-7 w-7 text-primary" />
              <p className="font-medium text-foreground">点击选择 ZIP，或拖拽文件到这里</p>
              <p className="mt-1 text-xs text-muted-foreground">仅支持 ZIP，最大 30 MB</p>
              <Input ref={fileInputRef} className="sr-only" type="file" accept=".zip,application/zip" onChange={handleFileChange} />
            </div>
            {uploadError && <p className="text-sm text-destructive" role="alert">{uploadError}</p>}
            {selectedFile && <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3"><FileArchive className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{selectedFile.name}</p><p className="text-xs text-muted-foreground">已通过前端校验 · {formatFileSize(selectedFile.size)}</p></div><Button type="button" variant="ghost" size="icon" onClick={() => setSelectedFile(null)} aria-label="移除选择的文件"><X className="h-4 w-4" /></Button></div>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => closeUploadDialog(false)} disabled={isUploading}>取消</Button>
            <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading}>{isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{isUploading ? '正在上传…' : '确认上传'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
