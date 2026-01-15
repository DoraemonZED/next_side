'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Moon, Sun, Settings, User, Menu } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/useAuthStore'
import { LoginDialog } from '@/components/LoginDialog'

const navItems = [
  { name: '首页', href: '/' },
  { name: '博客', href: '/blog' },
  { name: '游戏', href: '/games' },
  { name: '简历', href: '/resume' },
]

export function Header() {
  const pathname = usePathname()
  const { setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore()

  React.useEffect(() => {
    checkAuth()
  }, [checkAuth])

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
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-primary/20 hover:border-primary/50 transition-all">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user?.username}</p>
                    <p className="text-sm text-muted-foreground">管理员</p>
                  </div>
                </div>
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
