import fs from "node:fs/promises"
import path from "node:path"
import { NextResponse } from "next/server"
import { launch } from "puppeteer-core"
import { renderResumePdfHtml } from "@/app/resume/resume-pdf-html"
import { getResumeContent } from "@/lib/resumeContent"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const templatePath = path.join(process.cwd(), "public", "resume-pdf-template.html")

const chromiumPath = () => process.env.PUPPETEER_EXECUTABLE_PATH
  || (process.platform === "darwin"
    ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
    : "/usr/bin/chromium-browser")

export async function GET() {
  let browser: Awaited<ReturnType<typeof launch>> | undefined
  try {
    const template = await fs.readFile(templatePath, "utf8")
    browser = await launch({
      executablePath: chromiumPath(),
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    const page = await browser.newPage()
    await page.setContent(renderResumePdfHtml(template, getResumeContent()), { waitUntil: "load" })
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename*=UTF-8''resume.pdf",
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("Failed to generate resume PDF", error)
    return NextResponse.json({ message: "PDF 生成失败，请稍后重试" }, { status: 500 })
  } finally {
    await browser?.close()
  }
}
