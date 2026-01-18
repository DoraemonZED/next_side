'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Settings, User, Menu, Download, Database } from 'lucide-react'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  const { setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const [isBackupDialogOpen, setIsBackupDialogOpen] = React.useState(false)
  const [backupInfo, setBackupInfo] = React.useState('')
  const [recipientEmail, setRecipientEmail] = React.useState('')
  const [isBackingUp, setIsBackingUp] = React.useState(false)
  const [isMigrationDialogOpen, setIsMigrationDialogOpen] = React.useState(false)
  const [migrationStatus, setMigrationStatus] = React.useState<any>(null)
  const [isMigrating, setIsMigrating] = React.useState(false)
  const { user, isAuthenticated, logout, checkAuth, setUser } = useAuthStore()
  const { showToast } = useUIStore()
  const [isMounted, setIsMounted] = React.useState(false)

  // 组件挂载后，完全使用 store 状态（实时更新）
  // 首次渲染时使用 initialAuthState 确保 SSR 和客户端一致
  const displayUser = isMounted ? user : (initialAuthState?.user || user)
  const displayIsAuthenticated = isMounted ? isAuthenticated : (initialAuthState?.isAuthenticated ?? isAuthenticated)

  // 组件挂载后标记为已挂载，之后完全使用 store 状态
  React.useEffect(() => {
    setIsMounted(true)
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

  // 获取迁移状态
  const fetchMigrationStatus = async () => {
    try {
      const response = await fetch('/api/db/migrations')
      if (response.ok) {
        const data = await response.json()
        setMigrationStatus(data)
      } else {
        showToast('获取迁移状态失败', 'error')
      }
    } catch (error) {
      showToast('网络错误', 'error')
    }
  }

  // 执行迁移
  const handleRunMigrations = async () => {
    setIsMigrating(true)
    try {
      const response = await fetch('/api/db/migrations', { method: 'POST' })
      const data = await response.json()
      if (response.ok) {
        showToast(data.message, 'success')
        await fetchMigrationStatus()
      } else {
        showToast(data.message || '迁移失败', 'error')
      }
    } catch (error) {
      showToast('网络错误', 'error')
    } finally {
      setIsMigrating(false)
    }
  }

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
          backupInfo: backupInfo || '这是您的content目录备份文件。',
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
    } catch (error: any) {
      console.error('备份错误:', error)
      showToast(`备份失败: ${error.message || '网络错误'}`, 'error')
    } finally {
      setIsBackingUp(false)
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between mx-auto px-4">
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
                <SheetTitle className="text-left text-primary font-bold">MySite 导航</SheetTitle>
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
          
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-primary">MySite</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium ml-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-primary relative py-1',
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
          {/* Theme Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
                <span className="sr-only">切换主题</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>浅色</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>深色</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>系统默认</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Avatar & Login Dialog */}
          {displayIsAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/50 transition-all">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {displayUser?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                        输入备份信息和接收邮箱，系统将压缩content目录并发送到您的邮箱。
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
                <Dialog open={isMigrationDialogOpen} onOpenChange={(open) => {
                  setIsMigrationDialogOpen(open)
                  if (open) fetchMigrationStatus()
                }}>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => {
                      e.preventDefault()
                      setIsMigrationDialogOpen(true)
                    }}>
                      <Database className="mr-2 h-4 w-4" />
                      <span>数据库迁移</span>
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>数据库迁移</DialogTitle>
                      <DialogDescription>
                        查看和管理数据库迁移状态
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      {migrationStatus ? (
                        <>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">当前版本</span>
                            <span className="font-medium">{migrationStatus.current}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">总迁移数</span>
                            <span className="font-medium">{migrationStatus.total}</span>
                          </div>
                          {migrationStatus.pending?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-orange-500">待执行迁移:</p>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {migrationStatus.pending.map((m: any) => (
                                  <li key={m.version} className="pl-2 border-l-2 border-orange-500">
                                    {m.version}_{m.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {migrationStatus.applied?.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-green-500">已执行迁移:</p>
                              <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                                {migrationStatus.applied.slice().reverse().map((m: any) => (
                                  <li key={m.version} className="pl-2 border-l-2 border-green-500">
                                    {m.version}_{m.name}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">加载中...</p>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsMigrationDialogOpen(false)}
                        disabled={isMigrating}
                      >
                        关闭
                      </Button>
                      <Button
                        onClick={handleRunMigrations}
                        disabled={isMigrating || !migrationStatus?.pending?.length}
                      >
                        {isMigrating ? '迁移中...' : '执行迁移'}
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
