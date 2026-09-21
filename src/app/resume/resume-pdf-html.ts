import { initialResumeData } from "@/lib/initData"
import type { ResumeContent } from "@/lib/resumeContent"

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;")

const textList = (items: readonly string[]) => items.map(escapeHtml).join(" · ")

const applyTemplate = (template: string, values: Record<string, string>) => Object.entries(values)
  .reduce((html, [key, value]) => html.replaceAll(`{{${key}}}`, value), template)

const renderHistory = (items: typeof initialResumeData.history) => items.map((item) => {
  const badge = item.sideInfo.badge ? ` <span class="badge">${escapeHtml(item.sideInfo.badge)}</span>` : ""
  const credential = item.credential
    ? `<div class="credential"><b>${escapeHtml(item.credential.label)}</b>${escapeHtml(item.credential.value)}</div>`
    : ""

  return `<table class="record"><tr><td class="date">${escapeHtml(item.date)}</td><td class="record-content"><div class="record-head"><h3>${escapeHtml(item.title)}</h3><p class="side-info">${escapeHtml(item.sideInfo.text)}${badge}</p></div><p class="record-tags">${textList(item.tags)}</p><ul>${item.detail.items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul><p class="record-projects"><b>${escapeHtml(item.projects.label)}：</b>${item.projects.items.map((project) => escapeHtml(project.name)).join("、")}</p>${credential}</td></tr></table>`
}).join("")

/** Fills the user-editable HTML template with safely escaped resume data. */
export function renderResumePdfHtml(template: string, data: ResumeContent = initialResumeData) {
  const { site, hero, profile, projects, skillGroups, history } = data
  const workHistory = history.filter((item) => item.type === "work")
  const educationHistory = history.filter((item) => item.type === "education")
  const skills = skillGroups.map((group) => ({ label: group.label, items: group.skills.map((skill) => skill.name) }))
  const skillRows = skills.reduce<typeof skills[]>((rows, skill, index) => {
    const rowIndex = Math.floor(index / 2)
    if (!rows[rowIndex]) rows[rowIndex] = []
    rows[rowIndex].push(skill)
    return rows
  }, [])

  return applyTemplate(template, {
    TITLE: `${escapeHtml(profile.name)}｜简历`,
    NAME: escapeHtml(profile.name),
    ROLE: escapeHtml(profile.role),
    ENGLISH_NAME: escapeHtml(profile.englishName),
    CONTACT: `${escapeHtml(profile.displayPhone)}　${escapeHtml(site.contactEmail)}<br>${escapeHtml(profile.location)}　${escapeHtml(profile.experience)}`,
    SUMMARY: hero.summary.map(escapeHtml).join(" "),
    SKILL_ROWS: skillRows.map((row) => `<tr>${row.map((group) => `<td><b>${escapeHtml(group.label)}</b><br><span>${textList(group.items)}</span></td>`).join("")}</tr>`).join(""),
    PROJECTS: projects.slice(0, 3).map((project) => `<article class="project"><p class="project-head">${escapeHtml(project.title)}</p><p>${escapeHtml(project.role)}</p><small>${textList(project.stack)}</small></article>`).join(""),
    WORK_HISTORY: renderHistory(workHistory),
    EDUCATION_HISTORY: renderHistory(educationHistory),
  })
}
