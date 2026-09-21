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

export function LoginDialog() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [stage, setStage] = useState<'credentials' | 'verification'>('credentials');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser, checkAuth } = useAuthStore();
  const { showToast, setLoading: setGlobalLoading } = useUIStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGlobalLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.verificationRequired) {
        setStage('verification');
        setVerificationCode('');
        showToast(data.message, 'success');
      } else {
        setError(data.message || '登录失败');
        showToast(data.message || '登录失败', 'error');
      }
    } catch {
      setError('网络错误');
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleVerification = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setGlobalLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || '验证失败');
        showToast(data.message || '验证失败', 'error');
        return;
      }
      setUser(data.user);
      await checkAuth();
      showToast(`欢迎回来, ${data.user.username}`, 'success');
      setOpen(false);
      setStage('credentials');
      setPassword('');
      setVerificationCode('');
    } catch {
      setError('网络错误');
      showToast('网络错误', 'error');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStage('credentials');
      setError('');
      setVerificationCode('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost">登录</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{stage === 'credentials' ? '管理登录' : '邮箱验证'}</DialogTitle>
        </DialogHeader>
        {stage === 'credentials' ? (
          <form onSubmit={handleLogin} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" autoComplete="username" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" disabled={loading}>{loading ? '验证中...' : '发送验证码'}</Button>
          </form>
        ) : (
          <form onSubmit={handleVerification} className="grid gap-4 py-4">
            <p className="text-sm leading-6 text-muted-foreground">用户名和密码已验证。验证码已发送至配置的管理员邮箱。</p>
            <div className="grid gap-2">
              <Label htmlFor="verification-code">6 位验证码</Label>
              <Input id="verification-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={verificationCode} onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, ''))} autoComplete="one-time-code" placeholder="000000" required autoFocus />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" onClick={handleLogin} disabled={loading}>重新发送</Button>
              <Button type="submit" disabled={loading || verificationCode.length !== 6}>{loading ? '验证中...' : '完成登录'}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
