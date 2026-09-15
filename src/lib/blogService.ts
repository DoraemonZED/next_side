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
export interface PostMeta { id: string; category: string; categoryName: string; directoryId: string; title: string; date: string; views: number; likes: number; updatedAt: string; author: string; summary: string; tags: string; }
export interface PostDetail extends PostMeta { content: string; }
export interface BlogAsset { name: string; size: number; updatedAt: string; }
export interface PaginatedPosts { posts: PostMeta[]; total: number; page: number; pageSize: number; totalPages: number; }
export type PostSortField = 'date' | 'views' | 'likes'; export type PostSortOrder = 'asc' | 'desc';
export const postSortField = (v?: string): PostSortField => v === 'views' || v === 'likes' ? v : 'date';
export const postSortOrder = (v?: string): PostSortOrder => v === 'asc' ? 'asc' : 'desc';
type StoredCategory = Omit<Category, 'count'>;
type FrontMatter = Partial<Pick<PostMeta, 'title' | 'date' | 'updatedAt' | 'author' | 'summary' | 'tags'>>;
type Post = Omit<PostMeta, 'categoryName' | 'views' | 'likes'> & { content: string };
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
const findCategory = (s: Store, slug: string) => s.categories.find((c) => c.slug === slug);
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
function metric(category: string, postId: string) { return (db.prepare('SELECT views, likes FROM post_metrics WHERE category_id = ? AND post_id = ?').get(category, postId) as { views: number; likes: number } | undefined) || { views: 0, likes: 0 }; }
function metricRow(category: string, postId: string) { db.prepare('INSERT OR IGNORE INTO post_metrics (category_id, post_id, views, likes) VALUES (?, ?, 0, 0)').run(category, postId); }
async function post(c: StoredCategory, postId: string): Promise<Post | null> {
  try {
    const dir = postDir(c, postId), source = await fs.readFile(path.join(dir, 'index.md'), 'utf8'), parsed = frontMatter(source);
    const now = new Date().toISOString(), meta = { title: parsed.meta.title || titleFromId(postId), date: parsed.meta.date || now.slice(0,10), updatedAt: parsed.meta.updatedAt || now, author: parsed.meta.author || 'Admin', summary: parsed.meta.summary || summary(parsed.content), tags: parsed.meta.tags || '' };
    return { id: postId, category: c.slug, directoryId: postId, ...meta, content: parsed.content };
  } catch (e) { if (isMissing(e)) return null; throw e; }
}
async function posts(s: Store) { const result: Post[] = []; for (const c of s.categories) { try { for (const e of await fs.readdir(categoryDir(c), { withFileTypes: true })) if (e.isDirectory() && isBlogDirectoryId(e.name)) { const value = await post(c, e.name); if (value) result.push(value); } } catch (e) { if (!isMissing(e)) throw e; } } return result; }
async function mutation<T>(fn: (s: Store) => Promise<T>) { return withBlogLock(async () => { await blogGitService.pullBeforeWrite(); const result = await fn(await store()); await blogGitService.commitAndPush(); return result; }); }
const meta = (p: Post, c: StoredCategory): PostMeta => ({ ...p, categoryName: c.name, ...metric(p.category,p.id) });
function sort(list: PostMeta[], field: PostSortField, order: PostSortOrder) { const d = order === 'asc' ? 1 : -1; return list.sort((a,b) => ((field === 'date' ? Date.parse(a.date) : a[field]) === (field === 'date' ? Date.parse(b.date) : b[field]) ? a.title.localeCompare(b.title) : (field === 'date' ? Date.parse(a.date) : a[field]) < (field === 'date' ? Date.parse(b.date) : b[field]) ? -1 : 1) * d); }

export const blogService = {
  async getCategories(): Promise<Category[]> { const s = await store(), all = await posts(s); return s.categories.map((c) => ({...c,count:all.filter((p)=>p.category===c.slug).length})).sort((a,b)=>a.order-b.order); },
  async createCategory(slug: string, name: string, directoryId: string, description = '') { try { return await mutation(async(s) => { const dir=id(directoryId,'目录 ID'), safeSlug=requiredPathSegment(slug,'分类路径'); if (!name.trim() || findCategory(s,safeSlug) || findCategoryByDir(s,dir)) throw new Error('分类已存在'); const c={name:name.trim(),slug:safeSlug,directoryId:dir,description,order:s.categories.length}; await fs.mkdir(categoryDir(c),{recursive:true}); s.categories.push(c); await saveStore(s); return true; }); } catch (e) { console.error(e); return false; } },
  async updateCategory(slug: string, data: Partial<Category>) { try { return await mutation(async(s) => { const c=findCategory(s,requiredPathSegment(slug,'分类路径')); if(!c) throw new Error('分类不存在'); if(data.name!==undefined) c.name=data.name.trim(); if(!c.name) throw new Error('分类名称不能为空'); if(data.slug!==undefined) c.slug=requiredPathSegment(data.slug,'分类路径'); if(data.description!==undefined)c.description=data.description; if(data.order!==undefined)c.order=data.order; await saveStore(s); return true; }); } catch(e){console.error(e);return false;} },
  async deleteCategory(slug: string) { try { return await mutation(async(s)=>{const c=findCategory(s,requiredPathSegment(slug,'分类路径'));if(!c)return false;await fs.rm(categoryDir(c),{recursive:true,force:true});s.categories=s.categories.filter(x=>x!==c);await saveStore(s);return true;});}catch(e){console.error(e);return false;} },
  async deletePost(category: string, postId: string) { try{return await mutation(async(s)=>{const c=findCategory(s,requiredPathSegment(category,'分类路径')),safe=id(postId,'文章目录 ID');if(!c||!await post(c,safe))return false;await fs.rm(postDir(c,safe),{recursive:true,force:true});db.prepare('DELETE FROM post_metrics WHERE category_id=? AND post_id=?').run(c.slug,safe);return true;});}catch(e){console.error(e);return false;} },
  async savePost(category: string, postId: string, data: Partial<PostMeta>, content?: string, directoryId?: string) { try{return await mutation(async(s)=>{const c=findCategory(s,requiredPathSegment(category,'分类路径')),safe=id(postId,'文章目录 ID');if(!c)throw new Error('分类不存在');const old=await post(c,safe);if(!old&&!directoryId)throw new Error('目录 ID 为必填项');if(directoryId&&directoryId!==safe)throw new Error('目录 ID 不匹配');const now=new Date().toISOString(), body=content??old?.content??'', fm={title:data.title||old?.title||titleFromId(safe),date:data.date||old?.date||now.slice(0,10),updatedAt:now,author:data.author||old?.author||'Admin',summary:data.summary??old?.summary??summary(body),tags:data.tags??old?.tags??''};await fs.mkdir(postDir(c,safe),{recursive:true});await fs.writeFile(path.join(postDir(c,safe),'index.md'),markdown(fm,body));metricRow(c.slug,safe);return true;});}catch(e){console.error(e);return false;} },
  async importZip(categoryId: string, files: Array<{path:string;data:Buffer}>) { return mutation(async(s)=>{const dir=id(categoryId,'分类目录 ID');let c=findCategoryByDir(s,dir);if(!c){c={name:titleFromId(dir),slug:dir,directoryId:dir,description:'',order:s.categories.length};s.categories.push(c);}const ids=[...new Set(files.map(f=>f.path.split('/')[1]))];for(const postId of ids){id(postId,'文章目录 ID');if(await post(c,postId))throw new Error(`线上 ${c.name} 分类已存在 ${postId} 的博客，请删除后重试`);}for(const f of files){const [,postId,...rest]=f.path.split('/');const dest=path.join(postDir(c,postId),...rest);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,f.data);}for(const postId of ids){const p=await post(c,postId);if(!p||!frontMatter(await fs.readFile(path.join(postDir(c,postId),'index.md'),'utf8')).found)throw new Error(`${dir}/${postId}/index.md 缺少 Front Matter`);metricRow(c.slug,postId);}await saveStore(s);return {category:c.slug,posts:ids.length};}); },
  async getAllPosts(page=1,pageSize=10,q='',field:PostSortField='date',order:PostSortOrder='desc'){const s=await store(),query=q.trim().toLowerCase(),list=sort((await posts(s)).map(p=>meta(p,findCategory(s,p.category)!)).filter(p=>!query||p.title.toLowerCase().includes(query)||p.tags.toLowerCase().includes(query)),field,order),current=Math.max(1,page);return {posts:list.slice((current-1)*pageSize,current*pageSize),total:list.length,page:current,pageSize,totalPages:Math.ceil(list.length/pageSize)};},
  async getPostsByCategory(category:string,page=1,pageSize=10,q='',field:PostSortField='date',order:PostSortOrder='desc'){const all=await this.getAllPosts(1,Number.MAX_SAFE_INTEGER,q,field,order),list=all.posts.filter(p=>p.category===category),current=Math.max(1,page);return {posts:list.slice((current-1)*pageSize,current*pageSize),total:list.length,page:current,pageSize,totalPages:Math.ceil(list.length/pageSize)};},
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
  async incrementViews(category:string,postId:string){const safe=id(postId,'文章目录 ID');metricRow(category,safe);db.prepare('UPDATE post_metrics SET views=views+1, updated_at=CURRENT_TIMESTAMP WHERE category_id=? AND post_id=?').run(category,safe);return metric(category,safe).views;},
  extractSummary: summary,
};
