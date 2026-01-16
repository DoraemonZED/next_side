'use client'

import React, { useEffect, useRef } from 'react'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import { useTheme } from 'next-themes'

let hljsLoadPromise: Promise<void> | null = null
let hljsStylePromise: Promise<void> | null = null

function loadScriptOnce(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve()

    const existing = document.getElementById(id) as HTMLScriptElement | null
    if (existing) {
      if ((existing as any).dataset.loaded === 'true') return resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = id
    script.src = src
    script.async = true
    script.addEventListener(
      'load',
      () => {
        ;(script as any).dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    script.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), { once: true })
    document.head.appendChild(script)
  })
}

function loadStyleOnce(href: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return resolve()

    const existing = document.getElementById(id) as HTMLLinkElement | null
    if (existing) {
      // href 不一致时更新（主题切换）
      if (existing.href !== new URL(href, window.location.origin).href) {
        existing.href = href
        ;(existing as any).dataset.loaded = 'false'
      }

      if ((existing as any).dataset.loaded === 'true') return resolve()
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${href}`)), { once: true })
      return
    }

    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = href
    link.addEventListener(
      'load',
      () => {
        ;(link as any).dataset.loaded = 'true'
        resolve()
      },
      { once: true },
    )
    link.addEventListener('error', () => reject(new Error(`Failed to load ${href}`)), { once: true })
    document.head.appendChild(link)
  })
}

async function ensureHljsLoaded(cdn: string) {
  if (typeof window === 'undefined') return
  // 只要我们已经启动过加载流程，就必须等待它完成（避免 hljs 已存在但语言包尚未就绪）
  if (hljsLoadPromise) {
    await hljsLoadPromise
    return
  }

  // 有些场景下可能存在“伪 hljs”（对象存在但没有高亮函数），这里必须校验关键方法
  const existing = (window as any).hljs
  if (existing && (typeof existing.highlightElement === 'function' || typeof existing.highlightAuto === 'function')) {
    return
  }

  hljsLoadPromise = (async () => {
    await loadScriptOnce(`${cdn}/dist/js/highlight.js/highlight.min.js`, 'vditor-hljs')
    // 额外语言包（否则部分语言在首次进入页面时可能不识别）
    await loadScriptOnce(`${cdn}/dist/js/highlight.js/third-languages.js`, 'vditor-hljs-langs')
  })()
  await hljsLoadPromise
}

async function ensureHljsStyleLoaded(cdn: string, theme: 'dark' | 'light') {
  if (typeof window === 'undefined') return
  const file = theme === 'dark' ? 'github-dark.min.css' : 'github.min.css'
  const href = `${cdn}/dist/js/highlight.js/styles/${file}`
  // 样式按主题切换，但仍保证“至少加载一次且就绪”
  hljsStylePromise = loadStyleOnce(href, 'vditor-hljs-style')
  await hljsStylePromise
}

function forceHighlightIn(container: HTMLElement) {
  const hljs = (window as any).hljs
  if (!hljs || (typeof hljs.highlightElement !== 'function' && typeof hljs.highlightAuto !== 'function')) return

  const codes = container.querySelectorAll('pre code')
  codes.forEach((code) => {
    const el = code as HTMLElement
    const html = el.innerHTML || ''
    // 没有生成 hljs-xxx span 的情况下，强制跑一次
    if (html.includes('hljs-')) return

    // 1) 优先走 highlightElement（最稳妥，会自动读取 language-xxx）
    if (typeof hljs.highlightElement === 'function') {
      try {
        // 避免库认为“已高亮”而跳过
        if ((el as any).dataset) {
          delete (el as any).dataset.highlighted
        }
        hljs.highlightElement(el)
      } catch {
        // ignore
      }
    }

    // 2) 如果仍然没产出 span（某些情况下 highlightElement 会 no-op），改用 highlight()/highlightAuto() 直接生成 HTML
    if ((el.innerHTML || '').includes('hljs-')) return

    const text = el.textContent ?? ''
    const langMatch = Array.from(el.classList).find((c) => c.startsWith('language-'))
    const lang = langMatch ? langMatch.replace('language-', '') : ''

    try {
      const result =
        lang && typeof hljs.getLanguage === 'function' && hljs.getLanguage(lang) && typeof hljs.highlight === 'function'
          ? hljs.highlight(text, { language: lang, ignoreIllegals: true })
          : typeof hljs.highlightAuto === 'function'
            ? hljs.highlightAuto(text)
            : null

      if (result?.value) {
        el.innerHTML = result.value
        el.classList.add('hljs')
      }
    } catch {
      // ignore
    }
  })
}

interface MarkdownRendererProps {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    let cancelled = false
    let observer: MutationObserver | null = null
    const initVditor = async () => {
      if (previewRef.current) {
        // 解决 Next.js 客户端路由跳转时，hljs 脚本未就绪导致首次无高亮的问题
        await ensureHljsLoaded('/libs/vditor')
        await ensureHljsStyleLoaded('/libs/vditor', resolvedTheme === 'dark' ? 'dark' : 'light')

        // 记录当前高度，防止内容重新加载时页面高度塌陷导致滚动条重置
        const currentHeight = previewRef.current.offsetHeight;
        if (currentHeight > 0) {
          previewRef.current.style.minHeight = `${currentHeight}px`;
        }

        await Vditor.preview(previewRef.current, content, {
          mode: resolvedTheme === 'dark' ? 'dark' : 'light',
          cdn: '/libs/vditor',
          anchor: 0,
          theme: {
            current: resolvedTheme === 'dark' ? 'dark' : 'light'
          },
          hljs: {
            // 关闭 Vditor 内置高亮：它会异步重写 code.innerHTML，且对 "language-xxx hljs" 解析会退回 plaintext，
            // 导致我们手动高亮生成的 <span class="hljs-..."> 被覆盖回纯文本。
            enable: false,
            style: resolvedTheme === 'dark' ? 'github-dark' : 'github'
          },
          after() {
            const container = previewRef.current
            if (!container) return

            const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

            const run = async () => {
              if (cancelled || !previewRef.current) return
              await ensureHljsLoaded('/libs/vditor')
              await ensureHljsStyleLoaded('/libs/vditor', theme)
              forceHighlightIn(previewRef.current)
            }

            // 1) 下一帧跑一次
            requestAnimationFrame(() => {
              void run().finally(() => {
                if (previewRef.current) previewRef.current.style.minHeight = ''
              })
            })

            // 2) 轻量重试（覆盖 DOM 异步注入/主题延迟）
            setTimeout(() => void run(), 60)
            setTimeout(() => void run(), 180)

            // 3) 监听后续 DOM 变化（直到出现 hljs- span 或超时）
            if (observer) observer.disconnect()
            const start = Date.now()
            observer = new MutationObserver(() => {
              if (!previewRef.current) return
              forceHighlightIn(previewRef.current)
              const anyHighlighted = previewRef.current.querySelector('pre code span[class^="hljs-"], pre code span.hljs-keyword')
              if (anyHighlighted || Date.now() - start > 1500) {
                observer?.disconnect()
                observer = null
              }
            })
            observer.observe(container, { childList: true, subtree: true })
          }
        })
      }
    }
    
    initVditor()
    return () => {
      cancelled = true
      observer?.disconnect()
      observer = null
    }
  }, [content, resolvedTheme])

  return (
    <div 
      ref={previewRef} 
      className="vditor-reset max-w-none break-words"
    />
  )
}
