'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { MDXEditor, type MDXEditorMethods, BlockTypeSelect, BoldItalicUnderlineToggles, CodeToggle, CreateLink, InsertCodeBlock, InsertTable, ListsToggle, UndoRedo, codeBlockPlugin, codeMirrorPlugin, headingsPlugin, imagePlugin, linkPlugin, listsPlugin, markdownShortcutPlugin, quotePlugin, tablePlugin, thematicBreakPlugin, toolbarPlugin } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
import { FolderOpen, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlogAssetManager, replaceRelativeAssetReferences } from '@/components/BlogAssetManager'

interface BlogEditorProps {
  initialValue: string
  onChange: (value: string) => void
  onSave: () => void
  isSaving?: boolean
  category: string
  postId: string
}

const imagePreviewUrl = (source: string, category: string, postId: string) => {
  if (!source.startsWith('./')) return source
  const filename = source.slice(2)
  if (!filename || filename.includes('/')) return source
  return `/blog/${encodeURIComponent(category)}/${encodeURIComponent(postId)}/${filename}`
}

const editorPlugins = (openAssets: () => void, category: string, postId: string) => [
  headingsPlugin(), listsPlugin(), quotePlugin(), linkPlugin(), tablePlugin(), thematicBreakPlugin(),
  imagePlugin({ imagePreviewHandler: async (source) => imagePreviewUrl(source, category, postId) }),
  codeBlockPlugin({ defaultCodeBlockLanguage: 'text' }),
  codeMirrorPlugin({ codeBlockLanguages: { text: 'Plain text', javascript: 'JavaScript', typescript: 'TypeScript', java: 'Java', json: 'JSON', bash: 'Bash', css: 'CSS', html: 'HTML', sql: 'SQL' } }),
  markdownShortcutPlugin(),
  toolbarPlugin({
    toolbarClassName: 'article-editor__toolbar',
    toolbarContents: () => <>
      <UndoRedo /> <BlockTypeSelect /> <BoldItalicUnderlineToggles /> <CodeToggle />
      <CreateLink /> <ListsToggle /> <InsertCodeBlock /> <InsertTable />
      <button type="button" className="article-editor__file-button" onClick={openAssets} title="管理文章文件" aria-label="管理文章文件"><FolderOpen className="h-4 w-4" /></button>
    </>,
  }),
]

export function BlogEditor({ initialValue, onChange, onSave, isSaving = false, category, postId }: BlogEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null)
  const latestMarkdown = useRef(initialValue)
  const [assetsOpen, setAssetsOpen] = useState(false)
  const handleChange = useCallback((markdown: string) => { latestMarkdown.current = markdown; onChange(markdown) }, [onChange])
  const insertAssetReference = useCallback((markdown: string) => editorRef.current?.insertMarkdown(markdown), [])
  const replaceAssetReferences = useCallback((from: string, to: string) => {
    const next = replaceRelativeAssetReferences(latestMarkdown.current, from, to)
    latestMarkdown.current = next
    editorRef.current?.setMarkdown(next)
    onChange(next)
  }, [onChange])
  const plugins = useMemo(() => editorPlugins(() => setAssetsOpen(true), category, postId), [category, postId])

  return (
    <section className="article-editor" aria-label="Markdown 编辑器">
      <MDXEditor
        ref={editorRef}
        markdown={initialValue}
        onChange={handleChange}
        plugins={plugins}
        contentEditableClassName="article-editor__content article-markdown"
        className="article-editor__root"
      />
      <div className="article-editor__footer">
        <span>内容将保存为 Markdown</span>
        <Button type="button" size="sm" onClick={onSave} disabled={isSaving} className="article-editor__save">
          <Save className="h-3.5 w-3.5" />
          {isSaving ? '保存中…' : '保存文章'}
        </Button>
      </div>
      <BlogAssetManager category={category} postId={postId} markdown={initialValue} open={assetsOpen} onOpenChange={setAssetsOpen} onInsert={insertAssetReference} onReplaceReferences={replaceAssetReferences} />
    </section>
  )
}
