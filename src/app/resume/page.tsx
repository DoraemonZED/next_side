"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Download, Mail, Phone, MapPin, Github, Twitter, Linkedin, 
  MessageCircle, ExternalLink, Code2, Briefcase, Globe, Monitor, 
  Smartphone, Database, Layout, Layers, User, ChevronDown, Edit,
  Image as ImageIcon
} from "lucide-react"
import { Carousel, CarouselItem } from "@/components/ui/carousel"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/useAuthStore"
import { useUIStore } from "@/store/useUIStore"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Skill {
  name: string
  level: number
}

interface Skills {
  basics: Skill[]
  expand: Skill[]
  frameworks: Skill[]
  crossPlatform: Skill[]
}

interface HistoryItem {
  title: string
  date: string
  description: string
  type: string
}

export default function ResumePage() {
  const [mounted, setMounted] = useState(false)
  const [skills, setSkills] = useState<Skills>({
    basics: [],
    expand: [],
    frameworks: [],
    crossPlatform: []
  })
  const [otherSkills, setOtherSkills] = useState<string[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editJson, setEditJson] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const { isAuthenticated } = useAuthStore()
  const { showToast } = useUIStore()

  // 从API获取resume数据
  useEffect(() => {
    const fetchResumeData = async () => {
      try {
        const response = await fetch('/api/resume')
        if (response.ok) {
          const data = await response.json()
          if (data.skills) setSkills(data.skills)
          if (data.otherSkills) setOtherSkills(data.otherSkills)
          if (data.history) setHistory(data.history)
        }
      } catch (error) {
        console.error('Failed to fetch resume data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchResumeData()
  }, [])

  // 当弹窗打开时锁定背景滚动
  useEffect(() => {
    if (isEditDialogOpen) {
      // 保存当前滚动位置
      const scrollY = window.scrollY
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      // 防止内容偏移（因为滚动条消失）
      document.body.style.paddingRight = `${scrollbarWidth}px`
      
      return () => {
        // 先恢复样式
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        document.body.style.paddingRight = ''
        
        // 使用requestAnimationFrame确保DOM更新完成后再恢复滚动位置
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollY)
        })
      }
    }
  }, [isEditDialogOpen])

  useEffect(() => {
    setMounted(true)
    
    // 优化后的滚动观察器 - 使用 requestAnimationFrame 确保动画流畅
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 使用 requestAnimationFrame 确保在下一帧添加动画类
          requestAnimationFrame(() => {
            // 联系表单区域只使用淡入动画，避免滑动导致溢出
            const isContactSection = entry.target.classList.contains('contact-section')
            if (isContactSection) {
              entry.target.classList.add('animate-in', 'fade-in', 'duration-700')
            } else {
              entry.target.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-10', 'duration-700')
            }
            entry.target.classList.remove('opacity-0')
          })
          observer.unobserve(entry.target) // 动画只触发一次
        }
      })
    }, { 
      threshold: 0.05, // 降低阈值，减少计算
      rootMargin: '0px 0px -30px 0px'
    })

    // 只给除了第一屏以外的 section 添加观察
    const sections = document.querySelectorAll('section:not(.hero-section)')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // 打开编辑对话框
  const handleEditClick = () => {
    const resumeData = {
      skills,
      otherSkills,
      history
    }
    setEditJson(JSON.stringify(resumeData, null, 2))
    setIsEditDialogOpen(true)
  }

  // 保存编辑
  const handleSave = async () => {
    try {
      setIsSaving(true)
      let parsedData
      try {
        parsedData = JSON.parse(editJson)
      } catch (e) {
        showToast('JSON格式错误，请检查后重试', 'error')
        return
      }

      const response = await fetch('/api/resume', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(parsedData),
      })

      if (response.ok) {
        // 更新本地状态
        if (parsedData.skills) setSkills(parsedData.skills)
        if (parsedData.otherSkills) setOtherSkills(parsedData.otherSkills)
        if (parsedData.history) setHistory(parsedData.history)
        setIsEditDialogOpen(false)
        showToast('保存成功', 'success')
      } else {
        const error = await response.json()
        showToast(`保存失败: ${error.message || '未知错误'}`, 'error')
      }
    } catch (error: any) {
      console.error('Error saving resume data:', error)
      showToast(`保存失败: ${error.message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden overflow-y-hidden">
      {/* Background blobs - 使用 transform 进行 GPU 加速，减少模糊强度 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 will-change-auto">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[80px] transform-gpu"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[60px] transform-gpu"></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-16 overflow-x-hidden will-change-scroll">
        <div className="flex flex-col lg:flex-row gap-12 relative overflow-x-hidden">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-card border border-border dark:border-border rounded-[40px] overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.15)] dark:shadow-2xl group transition-shadow duration-500 hover:shadow-primary/10 transform-gpu">
                <div className="p-10 text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-border group-hover:border-primary/40 transition-colors duration-500 mx-auto relative z-10">
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <User className="w-20 h-20 text-muted-foreground/20" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 w-5 h-5 bg-primary rounded-full border-4 border-card z-20 shadow-lg"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight text-card-foreground">杨伟 - 前端开发</h1>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold">A Front-end Engineer</p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full my-8"></div>

                  <div className="flex justify-center gap-5">
                    {[MessageCircle, Mail, Phone, Github].map((Icon, i) => (
                      <button key={i} className="p-3 text-primary bg-muted hover:text-primary-foreground hover:bg-primary rounded-2xl transition-colors duration-300 hover:scale-110 transform-gpu">
                        <Icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full my-8"></div>

                  <div className="space-y-5 text-sm px-4">
                    {[
                      { label: "City", value: "成都市 武侯区" },
                      { label: "Age", value: "24" },
                      { label: "Post", value: "WEB" },
                    ].map((info, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-black">{info.label}:</span>
                        <span className="font-bold text-card-foreground tracking-wide">{info.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-8 space-y-4">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-7 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl group">
                      <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                      Download PDF
                    </Button>
                    {isAuthenticated && (
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            className="w-full rounded-2xl py-7 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl group border-2"
                            onClick={handleEditClick}
                          >
                            <Edit className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                            更改数据
                          </Button>
                        </DialogTrigger>
                        <DialogContent 
                          className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                          onWheel={(e) => {
                            // 阻止滚动事件冒泡到背景页面
                            e.stopPropagation()
                          }}
                          onTouchMove={(e) => {
                            // 阻止触摸滚动事件冒泡
                            e.stopPropagation()
                          }}
                        >
                          <DialogHeader className="flex-shrink-0">
                            <DialogTitle>编辑简历数据</DialogTitle>
                            <DialogDescription>
                              编辑以下JSON数据来更新简历内容。请确保JSON格式正确。
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="json-editor">JSON数据</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  try {
                                    const parsed = JSON.parse(editJson)
                                    setEditJson(JSON.stringify(parsed, null, 2))
                                    showToast('JSON格式化成功', 'success')
                                  } catch (e) {
                                    showToast('JSON格式错误，无法格式化', 'error')
                                  }
                                }}
                              >
                                格式化JSON
                              </Button>
                            </div>
                            <Textarea
                              id="json-editor"
                              value={editJson}
                              onChange={(e) => setEditJson(e.target.value)}
                              className="font-mono text-sm min-h-[500px] resize-none"
                              placeholder='{"skills": {...}, "otherSkills": [...], "history": [...]}'
                              onWheel={(e) => {
                                // 确保textarea内的滚动正常工作
                                e.stopPropagation()
                              }}
                            />
                          </div>
                          <DialogFooter className="flex-shrink-0">
                            <Button
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                              disabled={isSaving}
                            >
                              取消
                            </Button>
                            <Button
                              onClick={handleSave}
                              disabled={isSaving}
                            >
                              {isSaving ? '保存中...' : '保存'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-24 lg:space-y-32 overflow-x-hidden transform-gpu">
            
            {/* Hero Section - 初始可见，自带入场动画 */}
            <section className="hero-section relative min-h-[60vh] flex flex-col justify-center space-y-12 animate-in fade-in duration-1000">
              <div className="relative">
                <div className="space-y-8 max-w-2xl">
                  <p className="text-[11px] uppercase tracking-[0.4em] font-black text-primary">Hi My New Friend!</p>
                  <h2 className="text-6xl lg:text-8xl font-black leading-[1.1] tracking-tight">
                    Discover my <br />
                    <span className="text-primary italic relative">
                      skills
                      <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                        <path d="M0 5 Q 25 0, 50 5 T 100 5" stroke="currentColor" strokeWidth="4" fill="none" />
                      </svg>
                    </span> space!
                  </h2>
                  <div className="pt-6">
                    <Button variant="outline" className="rounded-full px-10 py-7 uppercase tracking-[0.3em] text-[11px] font-black border-2 hover:bg-primary hover:text-[#0f2537] hover:border-primary transition-colors duration-300 shadow-xl">
                      RESUME
                    </Button>
                  </div>
                </div>

                <div className="absolute right-0 top-1/2 -translate-y-1/2 hidden xl:flex flex-col items-center gap-12 group">
                  <div className="w-6 h-12 rounded-full border-2 border-foreground/20 flex justify-center p-1.5">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.5em] font-black whitespace-nowrap rotate-90 origin-center text-foreground/40">
                    SCROLL DOWN
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { value: "74 +", label: "技术文档", sub: "TECHNICAL" },
                  { value: "24 +", label: "项目参与", sub: "PROJECT" },
                  { value: "356 +", label: "开发时间", sub: "TIME" },
                ].map((stat, i) => (
                  <div key={i} className="bg-card border border-border dark:border-white/5 p-10 rounded-3xl text-center space-y-3 hover:bg-card transition-colors duration-300 group shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-xl hover:-translate-y-2 transform-gpu will-change-transform">
                    <div className="text-5xl font-black text-primary group-hover:scale-110 transition-transform duration-300 transform-gpu">{stat.value}</div>
                    <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent w-12 mx-auto my-4"></div>
                    <div className="text-base font-black tracking-tight">{stat.label}</div>
                    <div className="text-[10px] tracking-[0.3em] text-muted-foreground uppercase font-black">{stat.sub}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* 其他 Section 初始透明，由 Observer 触发动画 */}
            <section className="space-y-10 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">关于我 ABOUT</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">01</span>
              </div>
              <div className="relative group">
                <div className="bg-card p-10 lg:p-14 rounded-[40px] italic text-muted-foreground text-lg leading-[1.8] relative border border-border dark:border-white/5 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-2xl transform-gpu">
                  <span className="text-7xl text-primary font-serif absolute -top-8 -left-4 opacity-20 pointer-events-none">"</span>
                  2020年毕业于山东英才学院信息工程系，主修课程计算机网络、操作系统、.NET技术。毕业后从事软件开发，主要工作为WEB前端开发，技术栈包括JavaScript、NodeJS、Vue和React框架等，以及跨平台解决方案uniapp、React Native、Flutter。工作期间曾担任前端组长，熟悉Git版本管理。喜欢编程，常做一些算法和数据结构，在个人网站和论坛分享一些学习文档，致力能为开发社区做出贡献。
                  <span className="text-7xl text-primary font-serif absolute -bottom-16 right-8 opacity-20 pointer-events-none">"</span>
                </div>
              </div>
            </section>

            {/* 我的作品轮播图 */}
            <section className="space-y-10 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">我的作品 WORKS</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">02</span>
              </div>
              <Carousel autoPlay autoPlayInterval={5000} showDots showArrows>
                {[1, 2, 3, 4].map((item) => (
                  <CarouselItem key={item}>
                    <div className="relative w-full h-full bg-muted flex items-center justify-center">
                      {/* 占位图片区域 */}
                      <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                          <ImageIcon className="w-7 h-7 text-primary/40" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">作品 {item}</span>
                      </div>
                      {/* 底部渐变遮罩和标题 */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 lg:p-6">
                        <div className="space-y-1">
                          <h4 className="text-base lg:text-lg font-black text-white tracking-tight">项目名称 {item}</h4>
                          <p className="text-xs lg:text-sm text-white/70 font-medium">项目简介描述文字</p>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </Carousel>
            </section>

            <section className="space-y-16 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">技术栈 TECHNOLOGY</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">03</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-20">
                {[
                  { title: "基础 BASICS", skills: skills.basics },
                  { title: "拓展 EXPAND", skills: skills.expand },
                  { title: "框架 FRAME", skills: skills.frameworks },
                  { title: "跨端 CROSS-PLATFORM", skills: skills.crossPlatform }
                ].map((block, i) => (
                  <div key={i} className="space-y-8">
                    <h4 className="text-[11px] font-black tracking-[0.3em] uppercase text-muted-foreground/60 border-b border-white/5 pb-3">{block.title}</h4>
                    <div className="space-y-8">
                      {Array.from({ length: Math.ceil(block.skills.length / 3) }).map((_, groupIndex) => {
                        const groupSkills = block.skills.slice(groupIndex * 3, (groupIndex + 1) * 3);
                        return (
                          <div key={groupIndex} className="bg-card border border-border dark:border-white/5 rounded-2xl p-8 hover:bg-card transition-colors duration-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-xl transform-gpu">
                            <div className="space-y-6">
                              {groupSkills.map((skill, si) => (
                                <div key={si} className="space-y-3 group">
                                  <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                                    <span className="group-hover:text-primary transition-colors">{skill.name}</span>
                                    <span className="text-primary/60">{skill.level}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-muted/50 dark:bg-white/5 rounded-full overflow-hidden p-0.5 relative">
                                    <div 
                                      className="absolute top-0 left-0 h-full bg-primary rounded-full transition-[width] duration-1000 ease-out transform-gpu" 
                                      style={{ width: `${skill.level}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-12 border-t border-dashed border-white/10">
                <div className="flex flex-wrap gap-4">
                  {otherSkills.map((skill, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3 bg-card rounded-2xl border border-border dark:border-white/5 text-[11px] font-black uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-colors duration-300 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="space-y-16 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">经历 HISTORY</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">04</span>
              </div>
              <div className="relative space-y-16">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent hidden sm:block"></div>
                {history.map((item, i) => (
                  <div key={i} className="relative sm:pl-12 group">
                    <div className="absolute left-0 top-2 w-5 h-5 rounded-full border-[5px] border-border/50 dark:border-border bg-card z-10 hidden sm:block group-hover:bg-primary transition-colors duration-300"></div>
                    <div className={cn(
                      "p-10 rounded-[35px] border transition-transform duration-300 hover:-translate-y-2 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-2xl transform-gpu will-change-transform",
                      i % 2 === 0 ? 'bg-card border-border dark:border-white/5' : 'bg-card/90 border-border/50 dark:border-transparent'
                    )}>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-6">
                        <h4 className="text-xl font-black tracking-tight">{item.title}</h4>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-5 py-2 rounded-full border border-primary/20">
                          {item.date}
                        </span>
                      </div>
                      <p className="text-base text-muted-foreground leading-[1.8] font-medium">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-16 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">服务 SERVICES</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">05</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="group bg-card border border-border dark:border-border p-12 rounded-[45px] space-y-8 hover:-translate-y-3 transition-transform duration-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-xl transform-gpu will-change-transform">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Smartphone className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-card-foreground">移动应用</h4>
                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">包括移动端跨平台APP应用和微信小程序开发</p>
                  </div>
                </div>
                <div className="group bg-card border border-border dark:border-border p-12 rounded-[45px] space-y-8 hover:-translate-y-3 transition-transform duration-300 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-xl transform-gpu will-change-transform">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                    <Monitor className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-card-foreground">PC应用或网站</h4>
                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">包括Web网页搭建，基于Electron框架的桌面应用</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-16 opacity-0 pb-20 overflow-x-hidden overflow-y-visible contact-section">
              <div className="flex items-center gap-6 overflow-x-hidden">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">联系我 CONTACT</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">06</span>
              </div>
              <div className="bg-card border border-border dark:border-border p-10 lg:p-16 rounded-[50px] space-y-12 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.12)] dark:shadow-2xl overflow-x-hidden transform-gpu">
                <form className="space-y-10" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground">您的称呼</Label>
                      <Input placeholder="Name" className="bg-muted/50 border-border rounded-2xl py-8 px-6 text-foreground focus:border-primary/50" />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground">您的联系方式</Label>
                      <Input placeholder="Email / Phone / WeChat" className="bg-muted/50 border-border rounded-2xl py-8 px-6 text-foreground focus:border-primary/50" />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[11px] uppercase tracking-[0.4em] font-black text-muted-foreground">要发送的消息...</Label>
                    <Textarea placeholder="Message content..." className="min-h-[200px] bg-muted/50 border-border rounded-[30px] p-8 text-foreground focus:border-primary/50 resize-none overflow-hidden" />
                  </div>
                  <Button className="bg-primary hover:bg-primary/90 text-[#0f2537] rounded-2xl px-16 py-8 font-black uppercase tracking-[0.3em] text-[11px] transition-transform duration-200 hover:scale-105 shadow-2xl transform-gpu">
                    发送留言
                  </Button>
                </form>
              </div>
            </section>

          </main>
        </div>
      </div>
    </div>
  )
}
