"use client"

import { useEffect, useState, type FormEvent } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BookOpen,
  Boxes,
  Braces,
  BriefcaseBusiness,
  Check,
  CloudCog,
  Cpu,
  Download,
  Edit3,
  Eye,
  Fingerprint,
  GraduationCap,
  Layers3,
  Mail,
  MapPin,
  Network,
  Phone,
  Radio,
  Send,
  ServerCog,
  Sparkles,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Carousel, CarouselItem } from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store/useAuthStore"
import { useUIStore } from "@/store/useUIStore"
import "./resume.css"

type Skill = { name: string; level: number }
type Skills = {
  basics: Skill[]
  expand: Skill[]
  frameworks: Skill[]
  crossPlatform: Skill[]
}
type HistoryItem = {
  title: string
  date: string
  description: string
  type: string
}

const fallbackSkills: Skills = {
  basics: [
    { name: "TypeScript", level: 92 },
    { name: "Node.js", level: 90 },
    { name: "Python", level: 78 },
  ],
  expand: [
    { name: "NestJS / 微服务", level: 90 },
    { name: "Redis / RabbitMQ", level: 86 },
    { name: "Docker / Nginx", level: 84 },
  ],
  frameworks: [
    { name: "React / Next.js", level: 88 },
    { name: "Vue 3", level: 88 },
    { name: "Spring Boot", level: 74 },
  ],
  crossPlatform: [
    { name: "Electron", level: 85 },
    { name: "React Native", level: 76 },
    { name: "Three.js / Cesium", level: 72 },
  ],
}

const fallbackHistory: HistoryItem[] = [
  {
    title: "容联云 · 全栈开发工程师",
    date: "2025.10 — 至今",
    type: "work",
    description:
      "参与企业通信云产品的全栈研发，使用 Node.js 与 Spring Boot 交付业务服务和接口；使用 React 构建管理端，完成状态管理、组件封装、联调与版本迭代。",
  },
  {
    title: "中国电子科技十所（外协）· 高级 Web / 全栈开发工程师",
    date: "2022.11 — 2025.09",
    type: "work",
    description:
      "负责算法训练、实时数据与可视化场景的服务端及前端研发。以 NestJS、gRPC、RabbitMQ、Redis 构建模块化服务，处理大模型 SSE 流式响应与 WebSocket 高频数据渲染。",
  },
  {
    title: "不知其鸣科技 · 前后端开发负责人",
    date: "2021.04 — 2022.11",
    type: "work",
    description:
      "负责海外 ACG 内容平台及企业业务系统，推进 Node.js 服务、鉴权与资源管理、视频处理链路、Vue 3 PC/H5 页面及 Docker 化上线交付。",
  },
  {
    title: "中国通行服务有限公司 · 前端开发工程师",
    date: "2020.09 — 2021.04",
    type: "work",
    description:
      "参与通信基础设施共建共享与智慧交通管理平台，交付动态路由、RBAC 权限、复杂表单、GIS 场景及 ECharts 数据大屏。",
  },
]

const projects = [
  {
    code: "AGENT / 01",
    title: "实时数据与 AI Agent 服务平台",
    stack: ["NestJS", "SSE", "WebSocket", "Redis", "Python", "Vue 3"],
    intro: "面向算法结果与大模型输出的实时传输、Agent 交互和高频数据可视化平台。",
    points: [
      "设计 SSE 流式响应状态机，覆盖分片解析、增量 Markdown、取消与异常恢复。",
      "以 requestAnimationFrame 分片渲染和可视区更新控制高频数据压力。",
    ],
    metric: "REAL-TIME",
    value: "< 16ms",
  },
  {
    code: "SERVICE / 02",
    title: "Spring Boot 智能客服聊天平台",
    stack: ["Spring Boot", "Node.js", "React", "Redis", "RabbitMQ"],
    intro: "覆盖会话、坐席、路由和服务质检的企业多租户实时聊天平台。",
    points: [
      "设计会话路由、坐席状态、消息顺序与离线补偿机制。",
      "以 RabbitMQ 解耦分发与质检任务，管理端提供实时监控。",
    ],
    metric: "DELIVERY",
    value: "99.9%",
  },
  {
    code: "SOCKET / 03",
    title: "WebSocket 在线客服与消息系统",
    stack: ["NestJS", "WebSocket", "Redis", "RabbitMQ", "PostgreSQL"],
    intro: "围绕会话、坐席、消息、未读状态与连接生命周期构建实时通信服务。",
    points: [
      "实现心跳、ACK、断线重连与多实例会话映射。",
      "通过队列削峰、幂等消费和索引优化应对突发流量。",
    ],
    metric: "CONNECTION",
    value: "MULTI-NODE",
  },
  {
    code: "CLIENT / 04",
    title: "Electron 桌面端与 React Native 移动端",
    stack: ["Electron", "React", "React Native", "TypeScript", "WebSocket"],
    intro: "复用领域模型、接口层和状态逻辑，统一桌面、移动端与后端服务的交付链路。",
    points: [
      "封装 Electron 进程通信、本地能力接入及自动化打包发布。",
      "统一 REST / WebSocket 协议处理，降低多端维护成本。",
    ],
    metric: "PLATFORM",
    value: "3 ENDS",
  },
  {
    code: "MEDIA / 05",
    title: "海外 ACG 资源平台",
    stack: ["Node.js", "MongoDB", "JWT", "Vue 3", "HLS", "FFmpeg"],
    intro: "覆盖鉴权、内容管理、视频播放和 PC/H5 响应式访问的资源平台。",
    points: [
      "分层设计 API、权限模型及内容数据结构，保障安全与可维护性。",
      "完成视频链路、SSR / SEO 及 200 QPS 场景压测调优。",
    ],
    metric: "LOAD TEST",
    value: "200 QPS",
  },
]

const capabilities = [
  { icon: ServerCog, no: "01", title: "后端与微服务", text: "NestJS / Spring Boot / Nacos", tags: ["模块化", "gRPC", "REST API"] },
  { icon: Radio, no: "02", title: "实时通信", text: "SSE / WebSocket / 消息队列", tags: ["流式响应", "ACK", "重连"] },
  { icon: Layers3, no: "03", title: "多端产品", text: "Web / Electron / React Native", tags: ["响应式", "桌面端", "移动端"] },
  { icon: CloudCog, no: "04", title: "交付与运维", text: "Docker / Nginx / Linux / CI/CD", tags: ["容器化", "监控", "部署"] },
]

const skillLabels: Record<keyof Skills, string> = {
  basics: "LANGUAGE / RUNTIME",
  expand: "BACKEND / INFRA",
  frameworks: "FRAMEWORK",
  crossPlatform: "CROSS PLATFORM",
}

function SectionHeader({
  index,
  eyebrow,
  title,
  note,
}: {
  index: string
  eyebrow: string
  title: string
  note: string
}) {
  return (
    <header className="resume-section-head">
      <div className="resume-section-index">{index}</div>
      <div>
        <p>{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      <span>{note}</span>
    </header>
  )
}

type Project = (typeof projects)[number]

function ProjectCard({ project, index, onOpen }: { project: Project; index: number; onOpen: () => void }) {
  return (
    <CarouselItem className="resume-project">
      <div className="resume-project__grid" />
      <div className="resume-project__topline">
        <span>{project.code}</span>
        <span className="resume-project__signal"><i /> SYSTEM ONLINE</span>
      </div>
      <div className="resume-project__body">
        <div>
          <p className="resume-project__eyebrow">SELECTED CASE · 0{index + 1}</p>
          <h3>{project.title}</h3>
          <p className="resume-project__intro">{project.intro}</p>
          <div className="resume-project__tags">
            {project.stack.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          <button
            className="resume-project__open"
            onClick={(event) => {
              event.stopPropagation()
              onOpen()
            }}
            type="button"
          >
            <Eye />查看项目详情<ArrowUpRight />
          </button>
        </div>
        <div className="resume-project__metric">
          <span>{project.metric}</span>
          <strong>{project.value}</strong>
          <small>CORE INDICATOR</small>
        </div>
      </div>
      <div className="resume-project__points">
        {project.points.map((point) => (
          <p key={point}><Check />{point}</p>
        ))}
      </div>
    </CarouselItem>
  )
}

export default function ResumePage() {
  const [skills, setSkills] = useState<Skills>(fallbackSkills)
  const [otherSkills, setOtherSkills] = useState([
    "PostgreSQL", "MinIO", "gRPC", "Nacos", "Linux", "Git", "Codex", "Cursor",
  ])
  const [history, setHistory] = useState<HistoryItem[]>(fallbackHistory)
  const [editOpen, setEditOpen] = useState(false)
  const [editJson, setEditJson] = useState("")
  const [saving, setSaving] = useState(false)
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [contactTouched, setContactTouched] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { isAuthenticated } = useAuthStore()
  const { showToast } = useUIStore()

  useEffect(() => {
    fetch("/api/resume")
      .then(async (response) => {
        if (!response.ok) return
        const data = await response.json()
        if (data.skills) setSkills(data.skills)
        if (data.otherSkills) setOtherSkills(data.otherSkills)
        if (data.history) setHistory(data.history)
      })
      .catch(() => undefined)
  }, [])

  const openEditor = () => {
    setEditJson(JSON.stringify({ skills, otherSkills, history }, null, 2))
    setEditOpen(true)
  }

  const save = async () => {
    try {
      const data = JSON.parse(editJson)
      setSaving(true)
      const response = await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error((await response.json()).message)
      if (data.skills) setSkills(data.skills)
      if (data.otherSkills) setOtherSkills(data.otherSkills)
      if (data.history) setHistory(data.history)
      setEditOpen(false)
      showToast("简历内容已更新", "success")
    } catch (error) {
      showToast(error instanceof Error ? error.message : "保存失败，请检查 JSON", "error")
    } finally {
      setSaving(false)
    }
  }

  const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(contactEmail.trim())
  const messageIsValid = contactMessage.trim().length >= 10

  const handleContactSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setContactTouched(true)
    if (!emailIsValid || !messageIsValid) return

    /*
     * TODO(contact-message): 接入真正的邮件发送接口。
     * 1. 服务端重新严格校验并规范化邮箱；前端校验不能作为安全边界。
     * 2. 浏览器端生成稳定指纹并仅上传哈希；服务端对指纹哈希、IP 哈希、邮箱哈希分别限流。
     * 3. IP 必须从可信反向代理/运行平台读取，禁止信任客户端自行提交的 X-Forwarded-For。
     * 4. 按 Asia/Shanghai 自然日建立唯一限制：任一指纹、IP 或邮箱每天最多成功发送一次。
     * 5. 数据库只存加盐哈希、发送日期和审计状态，避免长期保存原始 IP 与浏览器指纹。
     * 6. 加入 CSRF、蜜罐字段、正文长度限制、HTML 转义、邮件服务超时和统一错误响应。
     * 7. 只有邮件服务确认成功后才消耗当日额度；并使用事务避免并发重复发送。
     */
    showToast("留言界面已完成，邮件发送功能即将开放", "success")
  }

  const experienceHistory = history.filter((item) =>
    item.type?.toLowerCase() !== "education" &&
    !/山东英才学院|大学\s*[-·]|教育经历/.test(item.title)
  )

  return (
    <div className="resume-shell">
      <div className="resume-noise" />
      <div className="resume-wrap">
        <nav className="resume-nav" aria-label="简历导航">
          <a className="resume-brand" href="#top"><span>YW</span><b>WAYNE.<i>DEV</i></b></a>
          <div className="resume-nav__links">
            <a href="#projects">项目</a>
            <a href="#stack">技术栈</a>
            <a href="#experience">经历</a>
          </div>
          <a className="resume-nav__contact" href="mailto:2433255732@qq.com">LET&apos;S TALK <ArrowUpRight /></a>
        </nav>

        <header className="resume-hero" id="top">
          <div className="resume-hero__mesh" />
          <div className="resume-hero__main">
            <div className="resume-availability"><i /> OPEN TO WORK · CHENGDU</div>
            <p className="resume-hero__overline">AGENT FULL-STACK ENGINEER / 2026</p>
            <h1><span>杨伟</span>构建可靠的<br /><em>AI 原生产品。</em></h1>
            <p className="resume-hero__summary">
              以 Node.js / NestJS 为核心，覆盖 AI Agent、实时通信、微服务及 Web、桌面、移动端开发。
              从架构设计到容器部署，独立推进复杂产品落地。
            </p>
            <div className="resume-hero__actions">
              <a href="#projects">查看代表项目 <ArrowDownRight /></a>
              <button onClick={() => window.print()} type="button"><Download />下载简历</button>
            </div>
          </div>

          <div className="resume-hero__console" aria-label="个人能力概览">
            <div className="resume-console__bar"><span><i /><i /><i /></span><b>profile.ts</b><em>● LIVE</em></div>
            <div className="resume-console__code">
              <p><span>const</span> engineer = {"{"}</p>
              <p className="indent">name: <b>&quot;Wayne Yang&quot;</b>,</p>
              <p className="indent">role: <b>&quot;Agent Full-Stack&quot;</b>,</p>
              <p className="indent">experience: <strong>5+</strong>,</p>
              <p className="indent">focus: [</p>
              <p className="indent-2"><b>&quot;AI Agent&quot;</b>, <b>&quot;Realtime&quot;</b>,</p>
              <p className="indent-2"><b>&quot;Microservices&quot;</b></p>
              <p className="indent">],</p>
              <p className="indent">status: <em>&quot;READY_TO_BUILD&quot;</em></p>
              <p>{"}"}</p>
            </div>
            <div className="resume-console__footer"><TerminalSquare /> npm run create-future <span>↵</span></div>
          </div>

          <div className="resume-hero__stats">
            <div><strong>05<sup>+</sup></strong><span>年全栈研发</span></div>
            <div><strong>05</strong><span>代表性项目</span></div>
            <div><strong>03</strong><span>多端交付能力</span></div>
            <div><strong>∞</strong><span>持续学习</span></div>
          </div>
        </header>

        <div className="resume-content">
          <aside className="resume-profile">
            <div className="resume-profile__card">
              <div className="resume-avatar"><span>YW</span><i /></div>
              <p className="resume-profile__role">AGENT FULL-STACK ENGINEER</p>
              <h2>杨伟 <small>Wayne Yang</small></h2>
              <p className="resume-profile__bio">专注实时通信、AI Agent 服务与复杂跨端产品的全链路研发。</p>
              <div className="resume-profile__meta">
                <a href="tel:18244230571"><Phone />182 4423 0571</a>
                <a href="mailto:2433255732@qq.com"><Mail />2433255732@qq.com</a>
                <span><MapPin />成都 · 可到岗</span>
                <span><BriefcaseBusiness />5+ 年研发经验</span>
              </div>
              <div className="resume-profile__buttons">
                <a href="mailto:2433255732@qq.com">联系我 <ArrowUpRight /></a>
                <button onClick={() => window.print()} aria-label="打印简历"><Download /></button>
              </div>
              {isAuthenticated && (
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button className="resume-edit" variant="ghost" onClick={openEditor}>
                      <Edit3 />编辑内容
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] max-w-3xl">
                    <DialogHeader>
                      <DialogTitle>编辑简历内容</DialogTitle>
                      <DialogDescription>保存后会立即更新技能和工作经历。</DialogDescription>
                    </DialogHeader>
                    <Textarea
                      className="min-h-[50vh] font-mono text-xs"
                      onChange={(event) => setEditJson(event.target.value)}
                      value={editJson}
                    />
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setEditOpen(false)}>取消</Button>
                      <Button disabled={saving} onClick={save}>{saving ? "保存中…" : "保存"}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="resume-profile__status">
              <span><i />当前状态</span>
              <strong>寻求新的技术挑战</strong>
              <small>Agent 全栈 / Node.js 后端</small>
            </div>
          </aside>

          <main className="resume-main">
            <section className="resume-section">
              <SectionHeader index="01" eyebrow="CORE CAPABILITIES" title="把复杂系统，做成稳定产品" note="WHAT I DO" />
              <div className="resume-capabilities">
                {capabilities.map(({ icon: Icon, no, title, text, tags }) => (
                  <article key={no}>
                    <div className="resume-capability__icon"><Icon /></div>
                    <span>{no}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <div>{tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                    <ArrowUpRight className="resume-capability__arrow" />
                  </article>
                ))}
              </div>
            </section>

            <section className="resume-section resume-projects-section" id="projects">
              <SectionHeader index="02" eyebrow="SELECTED PROJECTS" title="代表项目与核心成果" note="SWIPE / CLICK" />
              <Carousel autoPlay autoPlayInterval={6500} paused={selectedProject !== null} showArrows showDots>
                {projects.map((project, index) => (
                  <ProjectCard
                    key={project.title}
                    project={project}
                    index={index}
                    onOpen={() => setSelectedProject(project)}
                  />
                ))}
              </Carousel>
              <p className="resume-carousel-hint"><span>←</span> 点击两侧卡片或滑动，切换项目 <span>→</span></p>
              <Dialog
                open={selectedProject !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedProject(null)
                }}
              >
                <DialogContent className="resume-project-dialog max-w-4xl overflow-hidden border-0 p-0">
                  {selectedProject && (
                    <>
                      <DialogHeader className="resume-project-dialog__head">
                        <div className="resume-project-dialog__code">
                          <span><i /> PROJECT ARCHIVE</span>
                          <small>{selectedProject.code}</small>
                        </div>
                        <DialogTitle>{selectedProject.title}</DialogTitle>
                        <DialogDescription>{selectedProject.intro}</DialogDescription>
                      </DialogHeader>
                      <div className="resume-project-dialog__body">
                        <section>
                          <p className="resume-project-dialog__label">CORE IMPLEMENTATION</p>
                          <div className="resume-project-dialog__points">
                            {selectedProject.points.map((point, index) => (
                              <article key={point}>
                                <span>0{index + 1}</span>
                                <p>{point}</p>
                              </article>
                            ))}
                          </div>
                        </section>
                        <aside>
                          <div className="resume-project-dialog__metric">
                            <small>{selectedProject.metric}</small>
                            <strong>{selectedProject.value}</strong>
                            <span>CORE INDICATOR</span>
                          </div>
                          <p className="resume-project-dialog__label">TECH STACK</p>
                          <div className="resume-project-dialog__tags">
                            {selectedProject.stack.map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                        </aside>
                      </div>
                      <DialogFooter className="resume-project-dialog__footer">
                        <span><BookOpen />项目详情已展开，轮播已暂停</span>
                        <Button onClick={() => setSelectedProject(null)}>关闭并继续轮播</Button>
                      </DialogFooter>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </section>

            <section className="resume-section" id="stack">
              <SectionHeader index="03" eyebrow="TECH STACK" title="技术深度与工程广度" note="TOOLKIT" />
              <div className="resume-stack">
                {(Object.entries(skills) as [keyof Skills, Skill[]][]).map(([group, items], groupIndex) => (
                  <article key={group}>
                    <div className="resume-stack__head">
                      <span>0{groupIndex + 1}</span>
                      <h3>{skillLabels[group]}</h3>
                    </div>
                    <div className="resume-stack__items">
                      {items.map((skill) => (
                        <div key={skill.name}>
                          <p><strong>{skill.name}</strong><span>{skill.level}%</span></p>
                          <div><i style={{ width: skill.level + "%" }} /></div>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="resume-toolbelt">
                <span><Braces /> TOOLBELT</span>
                <div>{otherSkills.map((skill) => <small key={skill}>{skill}</small>)}</div>
              </div>
            </section>

            <section className="resume-section" id="experience">
              <SectionHeader index="04" eyebrow="EXPERIENCE" title="工作经历与成长路径" note="2020 — NOW" />
              <div className="resume-timeline">
                {experienceHistory.map((item, index) => {
                  const learningEntry =
                    ["education", "study", "intern"].includes(item.type?.toLowerCase()) ||
                    /学院|大学|学校|学习|实习/.test(item.title)
                  return (
                    <article className={learningEntry ? "is-learning" : "is-work"} key={item.title + item.date}>
                      <div className="resume-timeline__rail"><span>0{index + 1}</span><i /></div>
                      <div className="resume-timeline__card">
                        <div className="resume-timeline__meta">
                          <time>{item.date}</time>
                          <span>{learningEntry ? <BookOpen /> : <BriefcaseBusiness />}{learningEntry ? "学习经历" : "工作经历"}</span>
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.description}</p>
                        <div>
                          {index === 0 && <><span>Node.js</span><span>Spring Boot</span><span>React</span></>}
                          {index === 1 && <><span>NestJS</span><span>Realtime</span><span>Python</span><span>Docker</span></>}
                          {index === 2 && <><span>Node.js</span><span>Vue 3</span><span>FFmpeg</span></>}
                          {index === 3 && <><span>Vue 2</span><span>ECharts</span><span>GIS</span></>}
                        </div>
                      </div>
                    </article>
                  )
                })}
                <article className="is-learning is-education-featured">
                  <div className="resume-timeline__rail">
                    <span>{String(experienceHistory.length + 1).padStart(2, "0")}</span>
                    <i />
                  </div>
                  <div className="resume-timeline__card">
                    <div className="resume-timeline__meta">
                      <time>2017.09 — 2020.06</time>
                      <span><GraduationCap />教育经历</span>
                    </div>
                    <div className="resume-education-title">
                      <div>
                        <p>SHANDONG YINGCAI UNIVERSITY</p>
                        <h3>山东英才学院</h3>
                      </div>
                      <span>计算机网络技术 <b>大专</b></span>
                    </div>
                    <div className="resume-education-detail">
                      <section>
                        <p className="resume-education-label">主修课程 / CORE COURSES</p>
                        <div className="resume-education-courses">
                          {[
                            "计算机网络技术", "C 语言", "Python", "线性代数",
                            "离散数学", "操作系统", "数据结构与算法", "SQL Server 数据库",
                          ].map((course) => <span key={course}>{course}</span>)}
                        </div>
                      </section>
                      <section>
                        <p className="resume-education-label">专业能力 / LEARNING OUTCOME</p>
                        <ul>
                          <li><Check />掌握计算机网络基础架构与网络技术基础。</li>
                          <li><Check />具备使用 C / Python 进行基础算法开发的能力。</li>
                          <li><Check />熟悉数据库管理、SQL 查询与基础性能优化。</li>
                        </ul>
                      </section>
                    </div>
                    <div className="resume-education-projects">
                      <p className="resume-education-label">在校实践 / ACADEMIC PROJECTS</p>
                      <div>
                        <article><span>01</span><p><strong>ASP.NET 医药管理系统</strong><small>实现药品库存动态管理</small></p></article>
                        <article><span>02</span><p><strong>学生数据管理系统</strong><small>完成学生信息录入与管理</small></p></article>
                        <article><span>03</span><p><strong>Python 爬虫项目</strong><small>采集千千音乐 TOP100 榜单数据</small></p></article>
                      </div>
                    </div>
                    <div className="resume-education-certificate">
                      <Award />
                      <p><small>PROFESSIONAL CERTIFICATE</small><strong>计算机及外部设备装配调试员 · 中级</strong></p>
                    </div>
                  </div>
                </article>
              </div>
            </section>

            <section className="resume-section">
              <SectionHeader index="05" eyebrow="ENGINEERING" title="不仅写代码，也负责交付" note="FULL CYCLE" />
              <div className="resume-engineering">
                <article><Cpu /><span>01</span><h3>架构与性能</h3><p>模块化、缓存、消息解耦、索引优化、实时数据渲染与服务性能排查。</p></article>
                <article><Boxes /><span>02</span><h3>交付与运维</h3><p>Docker Compose、Nginx、Linux、CI/CD、日志定位和多环境部署。</p></article>
                <article><Sparkles /><span>03</span><h3>AI 辅助研发</h3><p>熟练使用 Codex、Cursor，结合 Dify、Ollama、LangChain 落地 AI 功能。</p></article>
              </div>
            </section>

            <section className="resume-contact" id="contact">
              <div className="resume-contact__intro">
                <p>DIRECT MESSAGE / READY TO COLLABORATE</p>
                <h2>有合适的机会？<br /><em>直接给我留言。</em></h2>
                <span>填写您的真实邮箱和留言内容。发送功能接入后，消息会直接投递到我的邮箱。</span>
                <div className="resume-contact__rules">
                  <p><ShieldCheck />邮箱格式严格验证</p>
                  <p><Fingerprint />指纹、IP、邮箱三重限流</p>
                  <p><Radio />每天仅可成功发送一次</p>
                </div>
              </div>
              <form className="resume-contact__form" onSubmit={handleContactSubmit} noValidate>
                <div className="resume-contact__form-head">
                  <span><i /> MESSAGE TERMINAL</span>
                  <small>SECURE CHANNEL / TODO</small>
                </div>
                <label htmlFor="contact-email">
                  <span>您的邮箱 <b>*</b></span>
                  <Input
                    aria-invalid={contactTouched && !emailIsValid}
                    autoComplete="email"
                    id="contact-email"
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="name@example.com"
                    required
                    type="email"
                    value={contactEmail}
                  />
                  {contactTouched && !emailIsValid && <small>请输入有效的邮箱地址</small>}
                </label>
                <label htmlFor="contact-message">
                  <span>留言内容 <b>*</b><em>{contactMessage.length} / 800</em></span>
                  <Textarea
                    aria-invalid={contactTouched && !messageIsValid}
                    id="contact-message"
                    maxLength={800}
                    onChange={(event) => setContactMessage(event.target.value)}
                    placeholder="简单介绍一下机会、项目或您想交流的内容…"
                    required
                    value={contactMessage}
                  />
                  {contactTouched && !messageIsValid && <small>留言内容至少需要 10 个字符</small>}
                </label>
                <div className="resume-contact__submit">
                  <p><ShieldCheck />提交后将进行安全校验与每日额度检查</p>
                  <button type="submit">
                    发送留言
                    <Send />
                  </button>
                </div>
              </form>
              <Network className="resume-contact__icon" aria-hidden="true" />
            </section>
          </main>
        </div>

        <footer className="resume-footer">
          <p>WAYNE YANG · AGENT FULL-STACK ENGINEER</p>
          <span>DESIGNED FOR THE NEXT CHALLENGE · 2026</span>
          <a href="#top">BACK TO TOP ↑</a>
        </footer>
      </div>
    </div>
  )
}
