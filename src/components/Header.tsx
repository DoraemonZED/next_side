'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Monitor, Menu, Download } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { useUIStore } from '@/store/useUIStore'
import { LoginDialog } from '@/components/LoginDialog'

const navItems = [
  { name: '首页', href: '/' },
  { name: '博客', href: '/blog' },
  { name: '游戏', href: '/games' },
  { name: '简历', href: '/resume' },
]

interface HeaderProps {
  initialAuthState?: {
    user: { id: number; username: string } | null;
    isAuthenticated: boolean;
  };
}

export function Header({ initialAuthState }: HeaderProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = React.useState(false)
  const [backupInfo, setBackupInfo] = React.useState('')
  const [recipientEmail, setRecipientEmail] = React.useState('')
  const [isBackingUp, setIsBackingUp] = React.useState(false)
  const { user, isAuthenticated, logout, checkAuth, setUser } = useAuthStore()
  const { showToast } = useUIStore()
  const [isMounted, setIsMounted] = React.useState(false)

  // 组件挂载后，完全使用 store 状态（实时更新）
  // 首次渲染时使用 initialAuthState 确保 SSR 和客户端一致
  const displayUser = isMounted ? user : (initialAuthState?.user || user)
  const displayIsAuthenticated = isMounted ? isAuthenticated : (initialAuthState?.isAuthenticated ?? isAuthenticated)

  // 组件挂载后标记为已挂载，之后完全使用 store 状态
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  // 同步服务端状态到 store（仅在首次加载时）
  React.useLayoutEffect(() => {
    if (initialAuthState && !isMounted) {
      setUser(initialAuthState.user)
    }
  }, [initialAuthState, setUser, isMounted])

  React.useEffect(() => {
    // 后台验证登录状态，如果过期会自动更新
    checkAuth()
  }, [checkAuth])

  const handleBackup = async () => {
    if (!recipientEmail) {
      showToast('请输入接收邮箱地址', 'error')
      return
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      showToast('请输入有效的邮箱地址', 'error')
      return
    }

    setIsBackingUp(true)
    try {
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backupInfo: backupInfo || '这是您的博客、游戏和运行数据备份文件。',
          recipientEmail,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showToast(`备份成功！${data.fileSize ? `文件大小: ${data.fileSize}` : ''}`, 'success')
        setIsBackupDialogOpen(false)
        setBackupInfo('')
        setRecipientEmail('')
      } else {
        showToast(data.message || '备份失败', 'error')
      }
    } catch (error) {
      console.error('备份错误:', error)
      showToast(`备份失败: ${error instanceof Error ? error.message : '网络错误'}`, 'error')
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <div className="site-header__inner flex h-16 items-center justify-between">
        {/* Mobile Menu & Logo */}
        <div className="flex items-center gap-4">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">打开菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[240px] sm:w-[300px]">
              <SheetHeader>
                <SheetTitle className="text-left text-primary font-bold">AWEI 导航</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-8">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'text-lg font-medium transition-colors hover:text-primary p-2 rounded-md',
                      (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <Link href="/" className="site-header__brand flex items-center space-x-2">
            <span>AW</span><b>AWEI<i> / DIGITAL LAB</i></b>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'site-header__link transition-colors relative py-1',
                  (item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)) 
                    ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary' 
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="theme-switch" data-theme={theme || 'dark'} role="radiogroup" aria-label="主题选择">
            <button type="button" role="radio" aria-checked={theme === 'dark' || !theme} title="深色" onClick={() => setTheme('dark')}>
              <Moon className="h-3.5 w-3.5" /><span className="sr-only">深色</span>
            </button>
            <button type="button" role="radio" aria-checked={theme === 'system'} title="自动" onClick={() => setTheme('system')}>
              <Monitor className="h-3.5 w-3.5" /><span className="sr-only">自动跟随系统</span>
            </button>
            <button type="button" role="radio" aria-checked={theme === 'light'} title="浅色" onClick={() => setTheme('light')}>
              <Sun className="h-3.5 w-3.5" /><span className="sr-only">浅色</span>
            </button>
          </div>

          {/* User Avatar & Login Dialog */}
          {displayIsAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="header-identity" aria-label="打开用户菜单">
                  <Avatar className="header-identity__avatar">
                    <AvatarFallback className="header-identity__fallback">
                      <span>{displayUser?.username?.slice(0, 2).toUpperCase() || 'AW'}</span>
                    </AvatarFallback>
                  </Avatar>
                  <span className="header-identity__copy">
                    <strong>{displayUser?.username || 'Awei'}</strong>
                    <small>WORKSPACE</small>
                  </span>
                  <i className="header-identity__status" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{displayUser?.username}</p>
                    <p className="text-sm text-muted-foreground">管理员</p>
                  </div>
                </div>
                <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault()
                      setIsBackupDialogOpen(true)
                    }}>
                      <Download className="mr-2 h-4 w-4" />
                      <span>备份数据</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>备份数据</DialogTitle>
                      <DialogDescription>
                        输入备份信息和接收邮箱，系统将压缩博客、游戏和运行数据并发送到您的邮箱。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-email">接收邮箱 *</Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          placeholder="your-email@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                          disabled={isBackingUp}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="backup-info">备份信息（可选）</Label>
                        <Textarea
                          id="backup-info"
                          placeholder="请输入备份说明信息..."
                          value={backupInfo}
                          onChange={(e) => setBackupInfo(e.target.value)}
                          disabled={isBackingUp}
                          rows={4}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsBackupDialogOpen(false)
                          setBackupInfo('')
                          setRecipientEmail('')
                        }}
                        disabled={isBackingUp}
                      >
                        取消
                      </Button>
                      <Button
                        onClick={handleBackup}
                        disabled={isBackingUp || !recipientEmail}
                      >
                        {isBackingUp ? '备份中...' : '开始备份'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <DropdownMenuItem onClick={() => logout()} className="text-red-500 focus:text-red-500">
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <LoginDialog />
          )}
        </div>
      </div>
    </header>
  )
}
