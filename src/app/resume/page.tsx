"use client"

import { useState, type CSSProperties, type FormEvent } from "react"
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
import { Carousel, CarouselItem } from "@/components/ui/carousel"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { useUIStore } from "@/store/useUIStore"
import { resumeData } from "./data"
import "./resume.css"

type Skill = { name: string; level: number; note: string }
type Skills = {
  backend: Skill[]
  ai: Skill[]
  devops: Skill[]
  frontend: Skill[]
}
const stackMeta = [
  { badge: "BACKEND", note: "服务端语言、框架与数据层能力" },
  { badge: "AI AGENT", note: "Agent 编排、RAG 与模型服务落地" },
  { badge: "DELIVERY", note: "部署、运维与稳定性保障" },
  { badge: "PRODUCT", note: "Web、桌面与移动端产品工程" },
]
type HistoryItem = {
  title: string
  company: string
  role: string
  date: string
  description: string
  type: string
  stack: string[]
  responsibilities: string[]
  projects: { name: string; summary: string }[]
}

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
    role: "负责 Node.js 服务编排、实时传输链路与管理端核心交互，推进从模型输出到业务工作台的端到端交付。",
    architecture: ["Agent 工作流与工具调用编排", "SSE / WebSocket 双通道实时推送", "Redis 会话状态与任务进度协调"],
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
    role: "负责 Java / Node.js 服务边界设计、核心会话链路和管理端协作，支撑多租户场景的持续迭代。",
    architecture: ["多租户会话、坐席与路由领域建模", "Redis 状态缓存与消息顺序控制", "RabbitMQ 异步分发、质检与补偿"],
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
    role: "负责实时通信服务的服务端设计与线上稳定性治理，覆盖连接生命周期、消息可靠性和性能优化。",
    architecture: ["多实例连接路由与 Redis 会话映射", "ACK / 重连 / 离线补偿状态机", "队列削峰与幂等消费保障"],
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
    role: "负责跨端技术方案与公共能力沉淀，让桌面、移动端和服务端在同一领域模型下协作演进。",
    architecture: ["共享 TypeScript 类型与 API Client", "Electron 主进程能力封装与发布链路", "REST / WebSocket 协议统一适配"],
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
    role: "负责 Node.js 服务、内容数据模型与媒体处理链路，完成面向生产运营的产品交付与性能调优。",
    architecture: ["JWT 鉴权与内容权限模型", "FFmpeg 异步转码与状态追踪", "HLS 分发、缓存策略与 SEO 优化"],
    metric: "LOAD TEST",
    value: "200 QPS",
  },
]

const capabilities = [
  { icon: ServerCog, no: "01", title: "Node.js / Java 服务架构", text: "围绕领域边界组织 Node.js 与 Spring Boot 服务，结合服务发现、配置治理、RPC 通信和故障隔离，构建可演进的业务系统。", tags: ["Spring Boot", "Node.js", "Nacos", "gRPC", "Redis"] },
  { icon: Radio, no: "02", title: "高并发与异步任务", text: "面向峰值流量设计削峰、任务编排和可靠消费链路，覆盖实时推送、幂等控制、重试补偿与背压治理。", tags: ["RabbitMQ", "Kafka", "WebSocket", "SSE"] },
  { icon: Layers3, no: "03", title: "数据性能与可观测性", text: "从数据模型、索引与缓存策略到日志、指标和链路定位，持续优化复杂业务系统的响应与稳定性。", tags: ["MySQL", "PostgreSQL", "Tracing", "Metrics"] },
  { icon: CloudCog, no: "04", title: "多端产品与工程底座", text: "复用领域模型和状态逻辑，将 Web、桌面与移动端纳入统一工程体系，并理解渲染、通信与打包链路。", tags: ["React", "Vue 3", "Electron", "React Native"] },
  { icon: ShieldCheck, no: "05", title: "安全与稳定性治理", text: "将鉴权边界、权限模型、限流降级与优雅停机纳入服务设计，兼顾业务迭代速度与生产环境的可控性。", tags: ["JWT", "RBAC", "Rate Limit", "Graceful Shutdown"] },
]

const skillLabels: Record<keyof Skills, string> = {
  backend: "后端与数据服务",
  ai: "AI Agent 工程",
  devops: "部署与运维",
  frontend: "前端与跨端产品",
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
        <span className="resume-project__signal"><i /> {project.metric} · {project.value}</span>
      </div>
      <div className="resume-project__body">
        <div>
          <p className="resume-project__eyebrow">SELECTED CASE · 0{index + 1} / NODE.JS · JAVA FULL-STACK</p>
          <h3>{project.title}</h3>
          <p className="resume-project__intro">{project.intro}</p>
          <div className="resume-project__tags">
            {project.stack.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
            {project.stack.length > 3 && <span>+{project.stack.length - 3}</span>}
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
      </div>
    </CarouselItem>
  )
}

export default function ResumePage() {
  const skills: Skills = resumeData.skills
  const otherSkills = resumeData.otherSkills
  const history: HistoryItem[] = resumeData.history
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [contactTouched, setContactTouched] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { showToast } = useUIStore()

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
          <a className="resume-brand" href="#top"><span>AW</span><b>AWEI.<i>DEV</i></b></a>
          <div className="resume-nav__links">
            <a href="#projects">项目</a>
            <a href="#stack">技术栈</a>
            <a href="#experience">经历</a>
            <a href="#contact">联系</a>
          </div>
          <a className="resume-nav__contact" href="mailto:2433255732@qq.com">LET&apos;S TALK <ArrowUpRight /></a>
        </nav>

        <header className="resume-hero" id="top">
          <div className="resume-hero__mesh" />
          <div className="resume-hero__main">
            <div className="resume-availability"><i /> OPEN TO WORK · CHENGDU</div>
            <p className="resume-hero__overline">NODE.JS / JAVA FULL-STACK ENGINEER / 2026</p>
            <h1><span>杨伟</span>交付可靠的<br /><em>全栈业务系统。</em></h1>
            <p className="resume-hero__summary">
              聚焦 Node.js / Java 全栈研发，具备从领域建模、服务治理与实时通信，到 Web / 桌面 / 移动端交付的完整工程能力。
              能够面向复杂业务独立推进架构设计、核心开发、稳定性治理与容器化上线。
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
              <p className="indent">role: <b>&quot;Node.js / Java Full-Stack&quot;</b>,</p>
              <p className="indent">experience: <strong>5+</strong>,</p>
              <p className="indent">focus: [</p>
              <p className="indent-2"><b>&quot;Node.js / Java&quot;</b>, <b>&quot;Realtime&quot;</b>,</p>
              <p className="indent-2"><b>&quot;Distributed Systems&quot;</b></p>
              <p className="indent">],</p>
              <p className="indent">status: <em>&quot;READY_TO_BUILD&quot;</em></p>
              <p>{"}"}</p>
            </div>
            <div className="resume-console__footer"><TerminalSquare /> pnpm run create-future <span>↵</span></div>
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
              <div className="resume-avatar"><span>AW</span><i /></div>
              <p className="resume-profile__role">NODE.JS / JAVA FULL-STACK ENGINEER</p>
              <h2>杨伟 <small>Wayne Yang</small></h2>
              <p className="resume-profile__bio">Node.js / Java 高级全栈工程师，擅长复杂业务建模、实时通信、AI 应用服务与跨端产品的全链路交付。</p>
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
            </div>
            <div className="resume-profile__status">
              <span><i />当前状态</span>
              <strong>寻求新的技术挑战</strong>
              <small>Node.js / Java 全栈工程</small>
            </div>
          </aside>

          <main className="resume-main">
            <section className="resume-section">
              <SectionHeader index="01" eyebrow="SYSTEM ENGINEERING" title="从服务架构到复杂业务交付" note="CORE EXPERTISE" />
              <div className="resume-capabilities">
                {capabilities.map(({ icon: Icon, no, title, text, tags }) => (
                  <article className={no === "01" ? "is-featured" : ""} key={no}>
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
                          <p className="resume-project-dialog__label">ROLE & DELIVERY</p>
                          <p className="resume-project-dialog__role">{selectedProject.role}</p>
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
                          <p className="resume-project-dialog__label">SYSTEM DESIGN</p>
                          <div className="resume-project-dialog__architecture">
                            {selectedProject.architecture.map((item, index) => <p key={item}><span>0{index + 1}</span>{item}</p>)}
                          </div>
                          <p className="resume-project-dialog__label">TECH STACK</p>
                          <div className="resume-project-dialog__tags">
                            {selectedProject.stack.map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                        </aside>
                      </div>
                      <div className="resume-project-dialog__footer">
                        <span><BookOpen />项目详情已展开，点击右上角关闭后轮播将自动继续</span>
                      </div>
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
                      <div><h3>{skillLabels[group]}</h3><small>{stackMeta[groupIndex].note}</small></div>
                      <b>{stackMeta[groupIndex].badge}</b>
                    </div>
                    <div className="resume-stack__items">
                      {items.map((skill) => (
                        <div key={skill.name} style={{ "--skill-level": `${skill.level}%` } as CSSProperties}>
                          <div className="resume-stack__skill-copy">
                            <p><strong>{skill.name}</strong></p>
                            <small>{skill.note}</small>
                          </div>
                          <div className="resume-stack__skill-progress">
                            <span>{skill.level}%</span>
                            <div><i /></div>
                          </div>
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
                        {learningEntry ? (
                          <>
                            <h3>{item.title}</h3>
                            <p>{item.description}</p>
                          </>
                        ) : (
                          <>
                            <div className="resume-work-title">
                              <p>WORK EXPERIENCE</p>
                              <h3>{item.company}<span>{item.role}</span></h3>
                            </div>
                            <div className="resume-work-detail">
                              <section>
                                <p className="resume-work-label">使用技术 / TECH STACK</p>
                                <div className="resume-work-stack">
                                  {item.stack.map((technology) => <span key={technology}>{technology}</span>)}
                                </div>
                              </section>
                              <section>
                                <p className="resume-work-label">负责内容 / KEY RESPONSIBILITIES</p>
                                <ul>
                                  {item.responsibilities.map((responsibility) => <li key={responsibility}><Check />{responsibility}</li>)}
                                </ul>
                              </section>
                            </div>
                            <div className="resume-work-projects">
                              <p className="resume-work-label">参与项目 / SELECTED PROJECTS</p>
                              <div>
                                {item.projects.map((project, projectIndex) => (
                                  <article key={project.name}>
                                    <span>{String(projectIndex + 1).padStart(2, "0")}</span>
                                    <p><strong>{project.name}</strong><small>{project.summary}</small></p>
                                  </article>
                                ))}
                              </div>
                            </div>
                          </>
                        )}
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
              <SectionHeader index="05" eyebrow="ENGINEERING SUMMARY" title="从业务实现到稳定运行的全栈闭环" note="FULL CYCLE" />
              <div className="resume-engineering">
                <article><Cpu /><span>01</span><h3>架构与性能工程</h3><p>在领域建模、缓存策略、消息解耦与索引优化之间权衡，将高并发、实时响应和可维护性落实到系统设计。</p><div><small>DOMAIN DESIGN</small><small>PERFORMANCE</small></div></article>
                <article><Boxes /><span>02</span><h3>可靠交付与运行保障</h3><p>将镜像构建、环境编排、灰度发布、日志追踪与故障回滚纳入交付闭环，让上线过程可观测、可恢复、可复用。</p><div><small>CI/CD</small><small>OBSERVABILITY</small></div></article>
                <article><Sparkles /><span>03</span><h3>AI 原生研发方法</h3><p>将 Agent 工作流、检索增强和工具调用嵌入业务研发；结合 Codex、Cursor 与本地模型持续缩短从想法到可验证版本的路径。</p><div><small>AGENT WORKFLOW</small><small>RAG</small></div></article>
              </div>
            </section>

            <section className="resume-section resume-contact-section" id="contact">
              <SectionHeader index="06" eyebrow="CONTACT" title="联系我" note="LET'S BUILD" />
              <div className="resume-contact">
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
              </div>
            </section>
          </main>
        </div>

      </div>
    </div>
  )
}
