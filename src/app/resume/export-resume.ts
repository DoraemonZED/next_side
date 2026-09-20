import { resumeData } from "./data"
import { createResumePdfHtml } from "./pdf-template"

const escapeHtml = (value: string) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;")

const textList = (items: readonly string[]) => items.map(escapeHtml).join(" · ")

const renderHistory = (items: typeof resumeData.history) => items.map((item) => {
  const badge = item.sideInfo.badge ? ` <span class="badge">${escapeHtml(item.sideInfo.badge)}</span>` : ""
  const credential = item.credential
    ? `<div class="credential"><b>${escapeHtml(item.credential.label)}</b>${escapeHtml(item.credential.value)}</div>`
    : ""

  return `
    <table class="record"><tr><td class="date">${escapeHtml(item.date)}</td><td class="record-content">
      <div class="record-head"><h3>${escapeHtml(item.title)}</h3><p class="side-info">${escapeHtml(item.sideInfo.text)}${badge}</p></div>
      <p class="record-tags">${textList(item.tags)}</p>
      <ul>${item.detail.items.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul>
      <p class="record-projects"><b>${escapeHtml(item.projects.label)}：</b>${item.projects.items.map((project) => escapeHtml(project.name)).join("、")}</p>
      ${credential}
    </td></tr></table>`
}).join("")

export function openResumePdfTemplate() {
  const { site, hero, profile, projects, skillGroups, history } = resumeData
  const workHistory = history.filter((item) => item.type === "work")
  const educationHistory = history.filter((item) => item.type === "education")
  const skills = skillGroups.map((group) => ({ label: group.label, items: group.skills.map((skill) => skill.name) }))
  const skillRows = skills.reduce<typeof skills[]>((rows, skill, index) => {
    const rowIndex = Math.floor(index / 2)
    if (!rows[rowIndex]) rows[rowIndex] = []
    rows[rowIndex].push(skill)
    return rows
  }, [])

  const documentHtml = createResumePdfHtml({
    title: `${escapeHtml(profile.name)}｜简历`,
    name: escapeHtml(profile.name),
    role: escapeHtml(profile.role),
    englishName: escapeHtml(profile.englishName),
    contact: `${escapeHtml(profile.displayPhone)}　${escapeHtml(site.contactEmail)}<br>${escapeHtml(profile.location)}　${escapeHtml(profile.experience)}`,
    summary: hero.summary.map(escapeHtml).join(" "),
    skillRows: skillRows.map((row) => `<tr>${row.map((group) => `<td><b>${escapeHtml(group.label)}</b><br><span>${textList(group.items)}</span></td>`).join("")}</tr>`).join(""),
    projects: projects.slice(0, 3).map((project) => `<article class="project"><p class="project-head">${escapeHtml(project.title)}</p><p>${escapeHtml(project.role)}</p><small>${textList(project.stack)}</small></article>`).join(""),
    workHistory: renderHistory(workHistory),
    educationHistory: renderHistory(educationHistory),
  })

  const printWindow = window.open("", "_blank", "popup,width=920,height=760")
  if (!printWindow) return false

  printWindow.document.write(documentHtml)
  printWindow.document.close()
  window.setTimeout(() => {
    if (!printWindow.closed) {
      printWindow.focus()
      printWindow.print()
    }
  }, 350)
  return true
}
