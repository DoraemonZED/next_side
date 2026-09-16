import fs from 'node:fs/promises';
import path from 'node:path';
import db from '@/lib/db';
import { blogGitService } from '@/lib/blogGitService';
import { withBlogLock } from '@/lib/blogLock';
import { requiredPathSegment, runtimeDataDirectory } from '@/lib/runtimePaths';

const root = runtimeDataDirectory('blog');
const categoriesPath = path.join(root, 'categories.json');
const isMissing = (e: unknown) => Boolean(e && typeof e === 'object' && 'code' in e && (e as NodeJS.ErrnoException).code === 'ENOENT');
export const isBlogDirectoryId = (v: unknown): v is string => typeof v === 'string' && /^[a-z]+(?:-[a-z]+)*$/.test(v);
const id = (v: unknown, label: string) => { if (!isBlogDirectoryId(v)) throw new Error(`${label}只能包含小写英文字母和连字符`); return v; };
const json = async (p: string, v: unknown) => { const tmp = `${p}.${process.pid}.tmp`; await fs.writeFile(tmp, `${JSON.stringify(v, null, 2)}\n`); await fs.rename(tmp, p); };

export interface Category { name: string; slug: string; directoryId: string; description?: string; count: number; order: number; }
export interface PostMeta { id: string; category: string; categoryName: string; directoryId: string; title: string; date: string; views: number; likes: number; shares: number; updatedAt: string; author: string; summary: string; tags: string; }
export interface PostDetail extends PostMeta { content: string; }
export interface BlogAsset { name: string; size: number; updatedAt: string; }
export interface PaginatedPosts { posts: PostMeta[]; total: number; page: number; pageSize: number; totalPages: number; }
export type PostSortField = 'date' | 'views' | 'likes'; export type PostSortOrder = 'asc' | 'desc';
export const postSortField = (v?: string): PostSortField => v === 'views' || v === 'likes' ? v : 'date';
export const postSortOrder = (v?: string): PostSortOrder => v === 'asc' ? 'asc' : 'desc';
type StoredCategory = Omit<Category, 'count'>;
type FrontMatter = Partial<Pick<PostMeta, 'title' | 'date' | 'updatedAt' | 'author' | 'summary' | 'tags'>>;
type Post = Omit<PostMeta, 'categoryName' | 'views' | 'likes' | 'shares'> & { content: string };
type Store = { version: 2; categories: StoredCategory[] };

async function store(): Promise<Store> {
  try {
    const value = JSON.parse(await fs.readFile(categoriesPath, 'utf8')) as Store | { version: 1; categories: Array<Omit<StoredCategory, 'directoryId'>> };
    if (value.version === 2) return value;
    if (value.version === 1) return { version: 2, categories: value.categories.map((c) => ({ ...c, directoryId: c.slug, description: c.description || '' })) };
    throw new Error('categories.json 格式无效');
  } catch (e) { if (!isMissing(e)) throw e; await fs.mkdir(root, { recursive: true }); return { version: 2, categories: [] }; }
}
const saveStore = async (s: Store) => { await fs.mkdir(root, { recursive: true }); await json(categoriesPath, s); };
const categoryDir = (c: StoredCategory) => path.join(root, id(c.directoryId, '分类目录 ID'));
const postDir = (c: StoredCategory, postId: string) => path.join(categoryDir(c), id(postId, '文章目录 ID'));
const assetName = (value: unknown) => {
  const name = requiredPathSegment(String(value || ''), '文件名');
  if (name === 'index.md') throw new Error('index.md 是文章正文，不能通过文件管理器操作');
  return name;
};
const regex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const replaceAssetReferences = (source: string, from: string, to: string) => source
  .replace(new RegExp(`\\.\\/${regex(from)}(?=[)\\s>])`, 'g'), `./${to}`)
  .replace(new RegExp(`\\.\\/${regex(encodeURIComponent(from))}(?=[)\\s>])`, 'g'), `./${encodeURIComponent(to)}`);
// Public routes and API calls use the on-disk directory ID. `slug` remains only
// as a legacy metric key for existing installations that predate this scheme.
const findCategory = (s: Store, directoryId: string) => s.categories.find((c) => c.directoryId === directoryId) ?? s.categories.find((c) => c.slug === directoryId);
const findCategoryByDir = (s: Store, dir: string) => s.categories.find((c) => c.directoryId === dir);
const summary = (content: string) => { const v = content.split('\n').map((x) => x.trim()).filter((x) => x && !x.startsWith('#') && !x.startsWith('![')).slice(0, 3).join(' '); return v.slice(0, 160) + (v.length > 160 ? '...' : ''); };
const titleFromId = (v: string) => v.split('-').map((x) => x[0]?.toUpperCase() + x.slice(1)).join(' ');
function frontMatter(source: string): { meta: FrontMatter; content: string; found: boolean } {
  const m = source.replace(/^\uFEFF/, '').match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return { meta: {}, content: source, found: false };
  const meta: FrontMatter = {};
  for (const line of m[1].split(/\r?\n/)) { const pair = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/); if (!pair || !['title','date','updatedAt','author','summary','tags'].includes(pair[1])) continue; try { (meta as Record<string,string>)[pair[1]] = JSON.parse(pair[2]); } catch { (meta as Record<string,string>)[pair[1]] = pair[2].replace(/^['"]|['"]$/g, ''); } }
  return { meta, content: source.slice(m[0].length), found: true };
}
function markdown(meta: Required<FrontMatter>, content: string) { return `---\ntitle: ${JSON.stringify(meta.title)}\ndate: ${JSON.stringify(meta.date)}\nupdatedAt: ${JSON.stringify(meta.updatedAt)}\nauthor: ${JSON.stringify(meta.author)}\nsummary: ${JSON.stringify(meta.summary)}\ntags: ${JSON.stringify(meta.tags)}\n---\n\n${content.replace(/^\s+/, '')}`; }
function validDate(value: string | undefined, fallback: string): string { return value && !Number.isNaN(Date.parse(value)) ? value : fallback; }
function normalizedMarkdown(postId: string, source: string, now = new Date()): { source: string; metadataAdded: boolean } {
  const parsed = frontMatter(source);
  const fallbackDate = now.toISOString().slice(0, 10);
  const fallbackUpdatedAt = now.toISOString();
  const heading = parsed.content.match(/^\s*#\s+(.+?)\s*$/m)?.[1]?.trim();
  const metadata: Required<FrontMatter> = {
    title: parsed.meta.title?.trim() || heading || titleFromId(postId),
    date: validDate(parsed.meta.date, fallbackDate),
    updatedAt: validDate(parsed.meta.updatedAt, fallbackUpdatedAt),
    author: parsed.meta.author?.trim() || 'Admin',
    summary: parsed.meta.summary?.trim() || summary(parsed.content),
    tags: parsed.meta.tags?.trim() || '',
  };
  return { source: markdown(metadata, parsed.content), metadataAdded: !parsed.found };
}
function metric(category: string, postId: string) { return (db.prepare('SELECT views, likes, shares FROM post_metrics WHERE category_id = ? AND post_id = ?').get(category, postId) as { views: number; likes: number; shares: number } | undefined) || { views: 0, likes: 0, shares: 0 }; }
function metricRow(category: string, postId: string) { db.prepare('INSERT OR IGNORE INTO post_metrics (category_id, post_id, views, likes, shares) VALUES (?, ?, 0, 0, 0)').run(category, postId); }
async function post(c: StoredCategory, postId: string): Promise<Post | null> {
  try {
    const dir = postDir(c, postId), source = await fs.readFile(path.join(dir, 'index.md'), 'utf8'), parsed = frontMatter(source);
    const now = new Date().toISOString(), meta = { title: parsed.meta.title || titleFromId(postId), date: parsed.meta.date || now.slice(0,10), updatedAt: parsed.meta.updatedAt || now, author: parsed.meta.author || 'Admin', summary: parsed.meta.summary || summary(parsed.content), tags: parsed.meta.tags || '' };
    return { id: postId, category: c.directoryId, directoryId: postId, ...meta, content: parsed.content };
  } catch (e) { if (isMissing(e)) return null; throw e; }
}
async function posts(s: Store) { const result: Post[] = []; for (const c of s.categories) { try { for (const e of await fs.readdir(categoryDir(c), { withFileTypes: true })) if (e.isDirectory() && isBlogDirectoryId(e.name)) { const value = await post(c, e.name); if (value) result.push(value); } } catch (e) { if (!isMissing(e)) throw e; } } return result; }
async function mutation<T>(fn: (s: Store) => Promise<T>) { return withBlogLock(async () => { await blogGitService.pullBeforeWrite(); const result = await fn(await store()); await blogGitService.commitAndPush(); return result; }); }
const meta = (p: Post, c: StoredCategory): PostMeta => ({ ...p, categoryName: c.name, ...metric(c.slug,p.id) });
function sort(list: PostMeta[], field: PostSortField, order: PostSortOrder) { const d = order === 'asc' ? 1 : -1; return list.sort((a,b) => ((field === 'date' ? Date.parse(a.date) : a[field]) === (field === 'date' ? Date.parse(b.date) : b[field]) ? a.title.localeCompare(b.title) : (field === 'date' ? Date.parse(a.date) : a[field]) < (field === 'date' ? Date.parse(b.date) : b[field]) ? -1 : 1) * d); }

export const blogService = {
  /** Removes metric rows whose category/article file no longer exists on disk. */
  async cleanupMissingPostMetrics(): Promise<number> {
    const s = await store();
    const existing = new Set((await posts(s)).map((item) => `${findCategory(s, item.category)?.slug}\u0000${item.id}`));
    const rows = db.prepare('SELECT category_id, post_id FROM post_metrics').all() as Array<{ category_id: string; post_id: string }>;
    const stale = rows.filter((row) => !existing.has(`${row.category_id}\u0000${row.post_id}`));
    if (stale.length === 0) return 0;

    const remove = db.prepare('DELETE FROM post_metrics WHERE category_id = ? AND post_id = ?');
    db.transaction((items: typeof stale) => {
      for (const item of items) remove.run(item.category_id, item.post_id);
    })(stale);
    return stale.length;
  },
  async getCategories(): Promise<Category[]> { const s = await store(), all = await posts(s); return s.categories.map((c) => ({...c,count:all.filter((p)=>p.category===c.directoryId).length})).sort((a,b)=>a.order-b.order); },
  async createCategory(name: string, directoryId: string, description = '') { try { return await mutation(async(s) => { const dir=id(directoryId,'目录 ID'); if (!name.trim() || findCategory(s,dir)) throw new Error('分类已存在'); const c={name:name.trim(),slug:dir,directoryId:dir,description,order:s.categories.length}; await fs.mkdir(categoryDir(c),{recursive:true}); s.categories.push(c); await saveStore(s); return true; }); } catch (e) { console.error(e); return false; } },
  async updateCategory(categoryId: string, data: Partial<Category>) { try { return await mutation(async(s) => { const c=findCategory(s,id(categoryId,'分类目录 ID')); if(!c) throw new Error('分类不存在'); if(data.name!==undefined) c.name=data.name.trim(); if(!c.name) throw new Error('分类名称不能为空'); if(data.description!==undefined)c.description=data.description; if(data.order!==undefined)c.order=data.order; await saveStore(s); return true; }); } catch(e){console.error(e);return false;} },
  async deleteCategory(categoryId: string) { try { return await mutation(async(s)=>{const c=findCategory(s,id(categoryId,'分类目录 ID'));if(!c)return false;await fs.rm(categoryDir(c),{recursive:true,force:true});s.categories=s.categories.filter(x=>x!==c);await saveStore(s);return true;});}catch(e){console.error(e);return false;} },
  async deletePost(category: string, postId: string) { try{return await mutation(async(s)=>{const c=findCategory(s,id(category,'分类目录 ID')),safe=id(postId,'文章目录 ID');if(!c||!await post(c,safe))return false;await fs.rm(postDir(c,safe),{recursive:true,force:true});db.prepare('DELETE FROM post_metrics WHERE category_id=? AND post_id=?').run(c.slug,safe);return true;});}catch(e){console.error(e);return false;} },
  async savePost(category: string, postId: string, data: Partial<PostMeta>, content?: string, directoryId?: string) { try{return await mutation(async(s)=>{const c=findCategory(s,id(category,'分类目录 ID')),safe=id(postId,'文章目录 ID');if(!c)throw new Error('分类不存在');const old=await post(c,safe);if(!old&&!directoryId)throw new Error('目录 ID 为必填项');if(directoryId&&directoryId!==safe)throw new Error('目录 ID 不匹配');const now=new Date().toISOString(), body=content??old?.content??'', fm={title:data.title||old?.title||titleFromId(safe),date:data.date||old?.date||now.slice(0,10),updatedAt:now,author:data.author||old?.author||'Admin',summary:data.summary??old?.summary??summary(body),tags:data.tags??old?.tags??''};await fs.mkdir(postDir(c,safe),{recursive:true});await fs.writeFile(path.join(postDir(c,safe),'index.md'),markdown(fm,body));metricRow(c.slug,safe);return true;});}catch(e){console.error(e);return false;} },
  async importZip(categoryId: string, files: Array<{path:string;data:Buffer}>) {
    return mutation(async (s) => {
      const dir = id(categoryId, '分类目录 ID');
      const ids = [...new Set(files.map((file) => file.path.split('/')[1]))];
      let c = findCategoryByDir(s, dir);
      const isNewCategory = !c;
      if (!c) c = { name: titleFromId(dir), slug: dir, directoryId: dir, description: '', order: s.categories.length };

      // Validate the full archive before touching persistent blog files.
      for (const postId of ids) {
        id(postId, '文章目录 ID');
        if (await post(c, postId)) throw new Error(`线上 ${c.name} 分类已存在 ${postId} 的博客，请删除后重试`);
      }
      const normalized = new Map<string, Buffer>();
      let normalizedPosts = 0;
      for (const postId of ids) {
        const markdownFile = files.find((file) => file.path === `${dir}/${postId}/index.md`);
        if (!markdownFile) throw new Error(`${dir}/${postId} 缺少 index.md`);
        let source: string;
        try { source = new TextDecoder('utf-8', { fatal: true }).decode(markdownFile.data); } catch { throw new Error(`${dir}/${postId}/index.md 不是有效的 UTF-8 Markdown 文件`); }
        const normalizedPost = normalizedMarkdown(postId, source);
        if (normalizedPost.metadataAdded) normalizedPosts += 1;
        normalized.set(markdownFile.path, Buffer.from(normalizedPost.source, 'utf8'));
      }

      const stage = path.join(root, `.import-${process.pid}-${Date.now()}`);
      try {
        // Stage every article first. Renames make individual article publication atomic.
        for (const file of files) {
          const [category, postId, filename] = file.path.split('/');
          if (category !== dir || !postId || !filename || file.path.split('/').length !== 3) throw new Error('ZIP 文件路径无效');
          const target = path.join(stage, postId, filename);
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, normalized.get(file.path) ?? file.data);
        }
        await fs.mkdir(categoryDir(c), { recursive: true });
        for (const postId of ids) await fs.rename(path.join(stage, postId), postDir(c, postId));
      } finally {
        await fs.rm(stage, { recursive: true, force: true });
      }

      if (isNewCategory) s.categories.push(c);
      await saveStore(s);
      db.transaction((postIds: string[]) => { for (const postId of postIds) metricRow(c.slug, postId); })(ids);
      return { category: c.directoryId, posts: ids.length, normalizedPosts, metricsInitialized: ids.length };
    });
  },
  async getAllPosts(page=1,pageSize=10,q='',field:PostSortField='date',order:PostSortOrder='desc'){const s=await store(),query=q.trim().toLowerCase(),list=sort((await posts(s)).map(p=>meta(p,findCategory(s,p.category)!)).filter(p=>!query||p.title.toLowerCase().includes(query)||p.tags.toLowerCase().includes(query)),field,order),current=Math.max(1,page);return {posts:list.slice((current-1)*pageSize,current*pageSize),total:list.length,page:current,pageSize,totalPages:Math.ceil(list.length/pageSize)};},
  async getPostsByCategory(category:string,page=1,pageSize=10,q='',field:PostSortField='date',order:PostSortOrder='desc'){const s=await store(),resolved=findCategory(s,category)?.directoryId??category,all=await this.getAllPosts(1,Number.MAX_SAFE_INTEGER,q,field,order),list=all.posts.filter(p=>p.category===resolved),current=Math.max(1,page);return {posts:list.slice((current-1)*pageSize,current*pageSize),total:list.length,page:current,pageSize,totalPages:Math.ceil(list.length/pageSize)};},
  async getPostDetail(category:string,postId:string):Promise<PostDetail|null>{try{const s=await store(),c=findCategory(s,category);if(!c)return null;const p=await post(c,id(postId,'文章目录 ID'));return p?{...meta(p,c),content:p.content}:null;}catch(e){console.error(e);return null;}},
  async listAssets(category: string, postId: string): Promise<BlogAsset[]> {
    const s = await store(), c = findCategory(s, requiredPathSegment(category, '分类路径'));
    if (!c || !await post(c, id(postId, '文章目录 ID'))) throw new Error('文章不存在');
    const dir = postDir(c, postId);
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return Promise.all(entries.filter((entry) => entry.isFile() && entry.name !== 'index.md').map(async (entry) => {
      const stat = await fs.stat(path.join(dir, entry.name));
      return { name: entry.name, size: stat.size, updatedAt: stat.mtime.toISOString() };
    })).then((assets) => assets.sort((a, b) => a.name.localeCompare(b.name)));
  },
  async addAsset(category: string, postId: string, name: string, data: Buffer) {
    if (!data.length) throw new Error('不能上传空文件');
    if (data.length > 10 * 1024 * 1024) throw new Error('单个文件不能超过 10 MB');
    return mutation(async (s) => {
      const c = findCategory(s, requiredPathSegment(category, '分类路径'));
      const safePostId = id(postId, '文章目录 ID'), safeName = assetName(name);
      if (!c || !await post(c, safePostId)) throw new Error('文章不存在');
      const target = path.join(postDir(c, safePostId), safeName);
      try { await fs.access(target); throw new Error('已存在同名文件，请先重命名或删除旧文件'); } catch (e) { if (!isMissing(e)) throw e; }
      await fs.writeFile(target, data);
      return true;
    });
  },
  async renameAsset(category: string, postId: string, name: string, nextName: string) {
    return mutation(async (s) => {
      const c = findCategory(s, requiredPathSegment(category, '分类路径'));
      const safePostId = id(postId, '文章目录 ID'), from = assetName(name), to = assetName(nextName);
      if (!c || !await post(c, safePostId)) throw new Error('文章不存在');
      if (from === to) return true;
      const dir = postDir(c, safePostId), source = path.join(dir, from), target = path.join(dir, to);
      try { await fs.access(target); throw new Error('目标文件名已存在'); } catch (e) { if (!isMissing(e)) throw e; }
      await fs.rename(source, target);
      const markdownPath = path.join(dir, 'index.md'), current = await fs.readFile(markdownPath, 'utf8');
      const updated = replaceAssetReferences(current, from, to);
      if (updated !== current) await fs.writeFile(markdownPath, updated);
      return true;
    });
  },
  async deleteAsset(category: string, postId: string, name: string) {
    return mutation(async (s) => {
      const c = findCategory(s, requiredPathSegment(category, '分类路径'));
      const safePostId = id(postId, '文章目录 ID'), safeName = assetName(name);
      if (!c || !await post(c, safePostId)) throw new Error('文章不存在');
      await fs.unlink(path.join(postDir(c, safePostId), safeName));
      return true;
    });
  },
  async readAsset(category:string,postId:string,file:string){try{const s=await store(),c=findCategory(s,category);return c?await fs.readFile(path.join(postDir(c,id(postId,'文章目录 ID')),requiredPathSegment(file,'资源文件名'))):null;}catch{return null;}},
  async incrementViews(category:string,postId:string){const safe=id(postId,'文章目录 ID'),c=findCategory(await store(),id(category,'分类目录 ID'));if(!c)return 0;metricRow(c.slug,safe);db.prepare('UPDATE post_metrics SET views=views+1, updated_at=CURRENT_TIMESTAMP WHERE category_id=? AND post_id=?').run(c.slug,safe);return metric(c.slug,safe).views;},
  async incrementLikes(category:string,postId:string){const safe=id(postId,'文章目录 ID'),c=findCategory(await store(),id(category,'分类目录 ID'));if(!c)return 0;metricRow(c.slug,safe);db.prepare('UPDATE post_metrics SET likes=likes+1, updated_at=CURRENT_TIMESTAMP WHERE category_id=? AND post_id=?').run(c.slug,safe);return metric(c.slug,safe).likes;},
  async incrementShares(category:string,postId:string){const safe=id(postId,'文章目录 ID'),c=findCategory(await store(),id(category,'分类目录 ID'));if(!c)return 0;metricRow(c.slug,safe);db.prepare('UPDATE post_metrics SET shares=shares+1, updated_at=CURRENT_TIMESTAMP WHERE category_id=? AND post_id=?').run(c.slug,safe);return metric(c.slug,safe).shares;},
  extractSummary: summary,
};
