"use client"

import { useLayoutEffect, useRef, useState, type CSSProperties, type FormEvent } from "react"
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

const iconMap = { ServerCog, Radio, Layers3, CloudCog, ShieldCheck, Cpu, Boxes, Sparkles }

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

type Project = (typeof resumeData.projects)[number]

function FittedProjectTitle({ children }: { children: string }) {
  const titleRef = useRef<HTMLHeadingElement>(null)

  useLayoutEffect(() => {
    const title = titleRef.current
    if (!title) return

    const fitTitle = () => {
      title.style.fontSize = ""
      const baseSize = Number.parseFloat(window.getComputedStyle(title).fontSize)
      const scale = Math.min(1, title.clientWidth / title.scrollWidth)
      // 字号最低保留 16px；再长的标题以省略号收尾，避免影响固定卡片高度。
      title.style.fontSize = `${Math.max(16, baseSize * scale)}px`
    }

    fitTitle()
    const observer = new ResizeObserver(fitTitle)
    observer.observe(title)
    return () => observer.disconnect()
  }, [children])

  return <h3 ref={titleRef} title={children}>{children}</h3>
}

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
          <FittedProjectTitle>{project.title}</FittedProjectTitle>
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
  const { site, hero, profile, capabilities, projects, skillGroups, engineering } = resumeData
  const otherSkills = resumeData.otherSkills
  const history = resumeData.history
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

  return (
    <div className="resume-shell">
      <div className="resume-noise" />
      <div className="resume-wrap">
        <nav className="resume-nav" aria-label="简历导航">
          <a className="resume-brand" href="#top"><span>{site.brandInitials}</span><b>{site.brandName}<i>{site.brandSuffix}</i></b></a>
          <div className="resume-nav__links">
            <a href="#projects">项目</a>
            <a href="#stack">技术栈</a>
            <a href="#experience">经历</a>
            <a href="#contact">联系</a>
          </div>
          <a className="resume-nav__contact" href={`mailto:${site.contactEmail}`}>LET&apos;S TALK <ArrowUpRight /></a>
        </nav>

        <header className="resume-hero" id="top">
          <div className="resume-hero__mesh" />
          <div className="resume-hero__main">
            <div className="resume-availability"><i /> {hero.availability}</div>
            <p className="resume-hero__overline">{hero.overline}</p>
            <h1><span>{hero.name}</span>{hero.headlineLines.map((line) => <span key={line}>{line}<br /></span>)}<em>{hero.emphasisLine}</em></h1>
            <p className="resume-hero__summary">{hero.summary.map((paragraph) => <span key={paragraph}>{paragraph}</span>)}</p>
            <div className="resume-hero__actions">
              <a href="#projects">查看代表项目 <ArrowDownRight /></a>
              <button onClick={() => window.print()} type="button"><Download />下载简历</button>
            </div>
          </div>

          <div className="resume-hero__console" aria-label="个人能力概览">
            <div className="resume-console__bar"><span><i /><i /><i /></span><b>profile.ts</b><em>● LIVE</em></div>
            <div className="resume-console__code">
              {hero.code.map((line, index) => <p className={line.indent === 1 ? "indent" : line.indent === 2 ? "indent-2" : undefined} key={`${line.text}-${index}`}>
                {line.prefix && <span>{line.prefix}</span>}{line.type === "string" ? <b>{line.text}</b> : line.type === "number" ? <strong>{line.text}</strong> : line.type === "status" ? <em>{line.text}</em> : line.text}
              </p>)}
            </div>
            <div className="resume-console__footer"><TerminalSquare /> pnpm run create-future <span>↵</span></div>
          </div>

          <div className="resume-hero__stats" aria-label="职业成果概览">
            {hero.stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.note}</small></div>)}
          </div>
        </header>

        <div className="resume-content">
          <aside className="resume-profile">
            <div className="resume-profile__card">
              <div className="resume-avatar"><span>AW</span><i /></div>
              <p className="resume-profile__role">{profile.role}</p>
              <h2>{profile.name} <small>{profile.englishName}</small></h2>
              <p className="resume-profile__bio">{profile.bio}</p>
              <div className="resume-profile__meta">
                <a href={`tel:${profile.phone}`}><Phone />{profile.displayPhone}</a>
                <a href={`mailto:${site.contactEmail}`}><Mail />{site.contactEmail}</a>
                <span><MapPin />{profile.location}</span>
                <span><BriefcaseBusiness />{profile.experience}</span>
              </div>
              <div className="resume-profile__buttons">
                <a href={`mailto:${site.contactEmail}`}>联系我 <ArrowUpRight /></a>
                <button onClick={() => window.print()} aria-label="打印简历"><Download /></button>
              </div>
            </div>
            <div className="resume-profile__status">
              <span><i />当前状态</span>
              <strong>{profile.status}</strong>
              <small>{profile.statusDetail}</small>
            </div>
          </aside>

          <main className="resume-main">
            <section className="resume-section">
              <SectionHeader index="01" eyebrow="SYSTEM ENGINEERING" title="从服务架构到复杂业务交付" note="CORE EXPERTISE" />
              <div className="resume-capabilities">
                {capabilities.map(({ icon, no, title, text, tags }) => {
                  const Icon = iconMap[icon as keyof typeof iconMap]
                  return (
                  <article className={no === "01" ? "is-featured" : ""} key={no}>
                    <div className="resume-capability__icon"><Icon /></div>
                    <span>{no}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                    <div>{tags.map((tag) => <small key={tag}>{tag}</small>)}</div>
                    <ArrowUpRight className="resume-capability__arrow" />
                  </article>
                )})}
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
                <DialogContent className="resume-project-detail max-w-4xl">
                  {selectedProject && (
                    <>
                      <DialogHeader className="resume-project-detail__head">
                        <div className="resume-project-detail__code">
                          <span><i /> PROJECT ARCHIVE</span>
                          <small>{selectedProject.code}</small>
                        </div>
                        <DialogTitle>{selectedProject.title}</DialogTitle>
                        <DialogDescription>{selectedProject.intro}</DialogDescription>
                      </DialogHeader>
                      <div className="resume-project-detail__body">
                        <section>
                          <p className="resume-project-detail__label">ROLE & DELIVERY</p>
                          <p className="resume-project-detail__role">{selectedProject.role}</p>
                          <p className="resume-project-detail__label">CORE IMPLEMENTATION</p>
                          <div className="resume-project-detail__points">
                            {selectedProject.points.map((point, index) => (
                              <article key={point}>
                                <span>0{index + 1}</span>
                                <p>{point}</p>
                              </article>
                            ))}
                          </div>
                        </section>
                        <aside>
                          <div className="resume-project-detail__metric">
                            <small>{selectedProject.metric}</small>
                            <strong>{selectedProject.value}</strong>
                            <span>CORE INDICATOR</span>
                          </div>
                          <p className="resume-project-detail__label">SYSTEM DESIGN</p>
                          <div className="resume-project-detail__architecture">
                            {selectedProject.architecture.map((item, index) => <p key={item}><span>0{index + 1}</span>{item}</p>)}
                          </div>
                          <p className="resume-project-detail__label">TECH STACK</p>
                          <div className="resume-project-detail__tags">
                            {selectedProject.stack.map((tag) => <span key={tag}>{tag}</span>)}
                          </div>
                        </aside>
                      </div>
                      <div className="resume-project-detail__footer">
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
                {skillGroups.map((group, groupIndex) => (
                  <article key={group.badge}>
                    <div className="resume-stack__head">
                      <span>0{groupIndex + 1}</span>
                      <div><h3>{group.label}</h3><small>{group.note}</small></div>
                      <b>{group.badge}</b>
                    </div>
                    <div className="resume-stack__items">
                      {group.skills.map((skill) => (
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
                {history.map((item, index) => item.type === "education" ? (
                  <article className="is-learning is-education-featured" key={item.title + item.date}>
                    <div className="resume-timeline__rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                    <div className="resume-timeline__card">
                      <div className="resume-timeline__meta"><time>{item.date}</time><span><GraduationCap />教育经历</span></div>
                      <div className="resume-education-title"><div><p>{item.universityEnglish}</p><h3>{item.title}</h3></div><span>{item.major} <b>{item.degree}</b></span></div>
                      <div className="resume-education-detail">
                        <section><p className="resume-education-label">主修课程 / CORE COURSES</p><div className="resume-education-courses">{item.courses.map((course) => <span key={course}>{course}</span>)}</div></section>
                        <section><p className="resume-education-label">专业能力 / LEARNING OUTCOME</p><ul>{item.outcomes.map((outcome) => <li key={outcome}><Check />{outcome}</li>)}</ul></section>
                      </div>
                      <div className="resume-education-projects"><p className="resume-education-label">在校实践 / ACADEMIC PROJECTS</p><div>{item.projects.map((project, projectIndex) => <article key={project.name}><span>{String(projectIndex + 1).padStart(2, "0")}</span><p><strong>{project.name}</strong><small>{project.summary}</small></p></article>)}</div></div>
                      <div className="resume-education-certificate"><Award /><p><small>PROFESSIONAL CERTIFICATE</small><strong>{item.certificate}</strong></p></div>
                    </div>
                  </article>
                ) : (
                  <article className="is-work" key={item.title + item.date}>
                    <div className="resume-timeline__rail"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                    <div className="resume-timeline__card">
                      <div className="resume-timeline__meta"><time>{item.date}</time><span><BriefcaseBusiness />工作经历</span></div>
                      <div className="resume-work-title"><p>WORK EXPERIENCE</p><h3>{item.company}<span>{item.role}</span></h3></div>
                      <div className="resume-work-detail">
                        <section><p className="resume-work-label">使用技术 / TECH STACK</p><div className="resume-work-stack">{item.stack.map((technology) => <span key={technology}>{technology}</span>)}</div></section>
                        <section><p className="resume-work-label">负责内容 / KEY RESPONSIBILITIES</p><ul>{item.responsibilities.map((responsibility) => <li key={responsibility}><Check />{responsibility}</li>)}</ul></section>
                      </div>
                      <div className="resume-work-projects"><p className="resume-work-label">参与项目 / SELECTED PROJECTS</p><div>{item.projects.map((project, projectIndex) => <article key={project.name}><span>{String(projectIndex + 1).padStart(2, "0")}</span><p><strong>{project.name}</strong><small>{project.summary}</small></p></article>)}</div></div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="resume-section">
              <SectionHeader index="05" eyebrow="ENGINEERING SUMMARY" title="从业务实现到稳定运行的全栈闭环" note="FULL CYCLE" />
              <div className="resume-engineering">
                {engineering.map(({ icon, no, title, text, tags }) => {
                  const Icon = iconMap[icon as keyof typeof iconMap]
                  return <article key={no}><Icon /><span>{no}</span><h3>{title}</h3><p>{text}</p><div>{tags.map((tag) => <small key={tag}>{tag}</small>)}</div></article>
                })}
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
