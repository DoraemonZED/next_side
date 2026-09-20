/**
 * A4 PDF 打印版 HTML 模板。
 *
 * 简历数据和转义、列表渲染逻辑位于 export-resume.ts；此文件只负责页面结构与样式，
 * 可以直接调整排版而不会影响数据整理与打印窗口逻辑。
 */
export interface ResumePdfTemplateData {
  title: string
  name: string
  role: string
  englishName: string
  contact: string
  summary: string
  skillRows: string
  projects: string
  workHistory: string
  educationHistory: string
}

export function createResumePdfHtml(data: ResumePdfTemplateData) {
  return `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${data.title}</title>
<style>
  @page { size: 21cm 29.7cm; margin: 1.65cm 1.7cm; }
  * { box-sizing: border-box; }
  body { color: #1f2933; font-family: "Microsoft YaHei", "PingFang SC", Arial, sans-serif; font-size: 10pt; line-height: 1.58; }
  h1, h2, h3, p { margin: 0; } h1 { color: #102a43; font-size: 25pt; letter-spacing: .04em; } h2 { margin: 20pt 0 9pt; padding-bottom: 4pt; border-bottom: .75pt solid #9fb3c8; color: #102a43; font-size: 12pt; letter-spacing: .12em; } h3 { color: #102a43; font-size: 11pt; }
  .header { padding: 0 0 12pt; border-bottom: 2pt solid #0f766e; } .header-row, .record, .record-head { width: 100%; border-collapse: collapse; } .header-row td { vertical-align: bottom; } .name-role { margin-top: 2pt; color: #486581; font-size: 10pt; } .contact { color: #486581; font-size: 9pt; line-height: 1.75; text-align: right; } .summary { margin-top: 10pt; color: #334e68; }
  .skill-table { width: 100%; border-collapse: collapse; } .skill-table td { width: 50%; padding: 3pt 16pt 3pt 0; vertical-align: top; } .skill-table b { color: #102a43; font-size: 9pt; } .skill-table span { color: #486581; font-size: 9pt; }
  .project { margin-bottom: 10pt; padding-left: 9pt; border-left: 2pt solid #0f766e; page-break-inside: avoid; } .project-head { color: #102a43; font-size: 10.5pt; font-weight: 700; } .project p { margin-top: 2pt; color: #486581; } .project small { color: #627d98; font-size: 8.5pt; }
  .page-break { page-break-before: always; } .record { margin-bottom: 10pt; page-break-inside: avoid; } .record td { padding: 0 0 10pt; border-bottom: .5pt solid #d9e2ec; vertical-align: top; } .date { width: 88pt; padding-right: 12pt !important; color: #627d98; font-size: 8.5pt; } .record-head h3 { display: inline; } .side-info { display: inline; margin-left: 8pt; color: #0f766e; font-size: 9pt; font-weight: 700; } .badge { display: inline-block; margin-left: 5pt; padding: 0 4pt; border: .5pt solid #94c7c2; color: #0f766e; font-size: 8pt; } .record-tags { margin: 2pt 0 4pt; color: #627d98; font-size: 8.5pt; } ul { margin: 0; padding-left: 15pt; } li { margin-bottom: 1pt; } .record-projects { margin-top: 5pt; color: #486581; font-size: 8.5pt; } .record-projects b { color: #334e68; } .credential { margin-top: 6pt; color: #7c5c18; font-size: 8.5pt; } .credential b { margin-right: 5pt; font-size: 8pt; letter-spacing: .05em; }
  .print-toolbar { position: fixed; z-index: 2; top: 14px; right: 18px; } .print-toolbar button { padding: 9px 14px; border: 0; border-radius: 6px; color: #fff; background: #0f766e; font: 600 14px "Microsoft YaHei", sans-serif; cursor: pointer; }
  @media print { .page-break { break-before: page; } .print-toolbar { display: none; } }
</style></head>
<body>
  <div class="print-toolbar"><button onclick="window.print()">保存为 PDF</button></div>
  <header class="header"><table class="header-row"><tr><td><h1>${data.name}</h1><p class="name-role">${data.englishName} · ${data.role}</p></td><td class="contact">${data.contact}</td></tr></table><p class="summary">${data.summary}</p></header>
  <h2>核心技能</h2><table class="skill-table">${data.skillRows}</table>
  <h2>代表项目</h2>${data.projects}
  <div class="page-break"></div><h2>工作经历</h2>${data.workHistory}
  <h2>教育经历</h2>${data.educationHistory}
</body></html>`
}
