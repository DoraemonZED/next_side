"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { 
  Download, Mail, Phone, MapPin, Github, Twitter, Linkedin, 
  MessageCircle, ExternalLink, Code2, Briefcase, Globe, Monitor, 
  Smartphone, Database, Layout, Layers, User, ChevronDown
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export default function ResumePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // 优化后的滚动观察器
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // 联系表单区域只使用淡入动画，避免滑动导致溢出
          const isContactSection = entry.target.classList.contains('contact-section')
          if (isContactSection) {
            entry.target.classList.add('animate-in', 'fade-in', 'duration-1000')
          } else {
            entry.target.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-10', 'duration-1000')
          }
          entry.target.classList.remove('opacity-0')
          observer.unobserve(entry.target) // 动画只触发一次
        }
      })
    }, { 
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px' // 提前一点点触发
    })

    // 只给除了第一屏以外的 section 添加观察
    const sections = document.querySelectorAll('section:not(.hero-section)')
    sections.forEach(section => observer.observe(section))

    return () => observer.disconnect()
  }, [])

  // 技能数据
  const skills = {
    basics: [
      { name: "HTML", level: 77 },
      { name: "CSS", level: 70 },
      { name: "JavaScript", level: 90 },
    ],
    expand: [
      { name: "TypeScript", level: 90 },
      { name: "SCSS", level: 88 },
      { name: "NodeJS", level: 65 },
    ],
    frameworks: [
      { name: "VueJS", level: 93 },
      { name: "ReactJS", level: 80 },
      { name: "JQuery", level: 70 },
    ],
    crossPlatform: [
      { name: "Flutter", level: 80 },
      { name: "React Native", level: 60 },
      { name: "Electron", level: 90 },
    ]
  }

  // 其他技能标签
  const otherSkills = [
    "Unreal", "Uniapp", "小程序", "Nginx", 
    "MySQL", "Linux", "MongoDB", "Webpack", "Koa"
  ]

  // 经历数据
  const history = [
    {
      title: "前端组长 - 成都不知其名科技",
      date: "Apr 2021 - Dec 2021",
      description: "担任前端组长，负责组内各个项目的整合及任务分配，帮助同事一起解决项目中遇到的问题。最初开始使用JQuery和Webpack开发项目，后期项目改为Vue的服务端渲染框架NuxtJS进行重构及提升。",
      type: "work"
    },
    {
      title: "移动端跨平台开发 - 中通服",
      date: "Oct 2020 - Apr 2021",
      description: "在公司负责前端跨平台开发，平台包括iOS和Android两端的UI及原生功能统一，使用到的框架有Uniapp和Flutter。在工作期间掌握了跨平台开发，对原生Android和iOS开发有一定的了解。在中通服的时间积极和同事交流，增加技术知识，在此期间从前辈身上学习到很多好的开发习惯，工作中也积极努力独自完成整合项目搭建及开发。",
      type: "work"
    },
    {
      title: "实习 - 在校",
      date: "Nov 2019 - Sep 2020",
      description: "其中参与.NET管理系统使，用WinFrom书写Windows页面，SQL Server数据库，socket实现TCP/IP通讯。和老师同学们相处融洽，工作积极认真，帮助同学，得到老师及其同学们的好评。初次从事软件开发，了解到了行业的竞争，以及各种技术革新的速度使得我们需要不断的学习新技术，作为程序员应时刻保持对探索的兴趣，要有创新精神和探索的勇气。",
      type: "intern"
    },
    {
      title: "大学 - 山东英才学院",
      date: "Sep 2017 - Jun 2020",
      description: "在校主修计算机网络技术，期间学习包括计算机组成原理，操作系统，数据结构，计算机网络等课程。和老师及小组参与一些.NET项目并取得上线，通过C语言课程学习使用EasyX制作flappy bird小游戏。期间参与学生会宣传部，负责学校公众号，校宣传海报设计和PS教学，组织其他部门参与校内活动。",
      type: "education"
    }
  ]

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden overflow-y-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[30%] h-[30%] bg-primary/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      <div className="container mx-auto px-4 py-8 lg:py-16 overflow-x-hidden">
        <div className="flex flex-col lg:flex-row gap-12 relative overflow-x-hidden">
          
          {/* Sidebar */}
          <aside className="w-full lg:w-[340px] shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-card border border-border/30 dark:border-border rounded-[40px] overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-2xl group transition-all duration-500 hover:shadow-primary/10">
                <div className="p-10 text-center space-y-6">
                  <div className="relative inline-block">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-border group-hover:border-primary/40 transition-all duration-700 mx-auto relative z-10">
                      <div className="w-full h-full bg-secondary flex items-center justify-center">
                        <User className="w-20 h-20 text-muted-foreground/20" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 right-4 w-5 h-5 bg-primary rounded-full border-4 border-card z-20 shadow-lg animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2">
                    <h1 className="text-2xl font-black tracking-tight text-card-foreground">杨伟 - 前端开发</h1>
                    <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground font-bold">A Front-end Engineer</p>
                  </div>

                  <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent w-full my-8"></div>

                  <div className="flex justify-center gap-5">
                    {[MessageCircle, Mail, Phone, Github].map((Icon, i) => (
                      <button key={i} className="p-3 text-primary bg-muted hover:text-primary-foreground hover:bg-primary rounded-2xl transition-all duration-500 hover:scale-110">
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

                  <div className="pt-8">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl py-7 font-black uppercase tracking-[0.2em] text-[11px] shadow-xl group">
                      <Download className="w-5 h-5 mr-3 group-hover:animate-bounce" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-24 lg:space-y-32 overflow-x-hidden">
            
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
                    <Button variant="outline" className="rounded-full px-10 py-7 uppercase tracking-[0.3em] text-[11px] font-black border-2 hover:bg-primary hover:text-[#0f2537] hover:border-primary transition-all duration-500 shadow-xl">
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
                  <div key={i} className="bg-card/40 backdrop-blur-md border border-border/30 dark:border-white/5 p-10 rounded-3xl text-center space-y-3 hover:bg-card/60 transition-all duration-500 group shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-xl hover:-translate-y-2">
                    <div className="text-5xl font-black text-primary group-hover:scale-110 transition-transform duration-700">{stat.value}</div>
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
                <div className="bg-card/40 backdrop-blur-md p-10 lg:p-14 rounded-[40px] italic text-muted-foreground text-lg leading-[1.8] relative border border-border/30 dark:border-white/5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-2xl">
                  <span className="text-7xl text-primary font-serif absolute -top-8 -left-4 opacity-20 pointer-events-none">"</span>
                  2020年毕业于山东英才学院信息工程系，主修课程计算机网络、操作系统、.NET技术。毕业后从事软件开发，主要工作为WEB前端开发，技术栈包括JavaScript、NodeJS、Vue和React框架等，以及跨平台解决方案uniapp、React Native、Flutter。工作期间曾担任前端组长，熟悉Git版本管理。喜欢编程，常做一些算法和数据结构，在个人网站和论坛分享一些学习文档，致力能为开发社区做出贡献。
                  <span className="text-7xl text-primary font-serif absolute -bottom-16 right-8 opacity-20 pointer-events-none">"</span>
                </div>
              </div>
            </section>

            <section className="space-y-16 opacity-0">
              <div className="flex items-center gap-6">
                <h3 className="text-sm font-black tracking-[0.3em] uppercase whitespace-nowrap">技术栈 TECHNOLOGY</h3>
                <div className="h-px bg-gradient-to-r from-border/50 to-transparent w-full"></div>
                <span className="text-[11px] text-muted-foreground font-mono font-bold">02</span>
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
                          <div key={groupIndex} className="bg-card/40 backdrop-blur-md border border-border/30 dark:border-white/5 rounded-2xl p-8 hover:bg-card/60 transition-all duration-500 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-xl">
                            <div className="space-y-6">
                              {groupSkills.map((skill, si) => (
                                <div key={si} className="space-y-3 group">
                                  <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.2em]">
                                    <span className="group-hover:text-primary transition-colors">{skill.name}</span>
                                    <span className="text-primary/60">{skill.level}%</span>
                                  </div>
                                  <div className="h-1 w-full bg-muted/50 dark:bg-white/5 rounded-full overflow-hidden p-0.5">
                                    <div className="h-full bg-primary rounded-full transition-all duration-[1.5s]" style={{ width: `${skill.level}%` }}></div>
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
                    <div key={i} className="flex items-center gap-3 px-6 py-3 bg-card/40 rounded-2xl border border-border/30 dark:border-white/5 text-[11px] font-black uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all duration-500">
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
                <span className="text-[11px] text-muted-foreground font-mono font-bold">03</span>
              </div>
              <div className="relative space-y-16">
                <div className="absolute left-[9px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-primary via-white/10 to-transparent hidden sm:block"></div>
                {history.map((item, i) => (
                  <div key={i} className="relative sm:pl-12 group">
                    <div className="absolute left-0 top-2 w-5 h-5 rounded-full border-[5px] border-border/50 dark:border-border bg-card z-10 hidden sm:block group-hover:bg-primary transition-all"></div>
                    <div className={cn(
                      "p-10 rounded-[35px] border transition-all duration-500 hover:-translate-y-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-2xl",
                      i % 2 === 0 ? 'bg-card/50 border-border/30 dark:border-white/5' : 'bg-card/20 border-transparent'
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
                <div className="group bg-card/40 backdrop-blur-md border border-border/30 dark:border-border p-12 rounded-[45px] space-y-8 hover:-translate-y-3 transition-all duration-700 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-xl">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Smartphone className="w-10 h-10" />
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-2xl font-black text-card-foreground">移动应用</h4>
                    <p className="text-base text-muted-foreground/80 leading-relaxed font-medium">包括移动端跨平台APP应用和微信小程序开发</p>
                  </div>
                </div>
                <div className="group bg-card/40 backdrop-blur-md border border-border/30 dark:border-border p-12 rounded-[45px] space-y-8 hover:-translate-y-3 transition-all duration-700 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-xl">
                  <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
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
              <div className="bg-card/40 backdrop-blur-md border border-border/30 dark:border-border p-10 lg:p-16 rounded-[50px] space-y-12 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] dark:shadow-2xl overflow-x-hidden">
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
                  <Button className="bg-primary hover:bg-primary/90 text-[#0f2537] rounded-2xl px-16 py-8 font-black uppercase tracking-[0.3em] text-[11px] transition-all hover:scale-105 shadow-2xl">
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
