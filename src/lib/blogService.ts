import fs from 'node:fs/promises';
import path from 'node:path';
import { blogGitService } from '@/lib/blogGitService';
import { withBlogLock } from '@/lib/blogLock';
import { requiredPathSegment, runtimeDataDirectory } from '@/lib/runtimePaths';

const BLOG_ROOT = runtimeDataDirectory('blog');
const CATEGORIES_PATH = path.join(BLOG_ROOT, 'categories.json');

export interface Category {
  name: string;
  slug: string;
  description?: string;
  count: number;
  order: number;
}

export interface PostMeta {
  id: string;
  category: string;
  categoryName: string;
  title: string;
  date: string;
  views: number;
  likes: number;
  updatedAt: string;
  author: string;
  summary: string;
  tags: string;
}

export interface PostDetail extends PostMeta {
  content: string;
}

export interface PaginatedPosts {
  posts: PostMeta[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type PostSortField = 'date' | 'views' | 'likes';
export type PostSortOrder = 'asc' | 'desc';

export function postSortField(value: string | undefined): PostSortField {
  return value === 'views' || value === 'likes' ? value : 'date';
}

export function postSortOrder(value: string | undefined): PostSortOrder {
  return value === 'asc' ? 'asc' : 'desc';
}

interface StoredCategory {
  name: string;
  slug: string;
  description: string;
  order: number;
}

interface StoredPost extends Omit<PostMeta, 'categoryName'> {
  contentFile: string;
}

interface CategoryStore {
  version: 1;
  categories: StoredCategory[];
}

function isMissing(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT');
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  const temporary = `${filePath}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, filePath);
}

async function ensureStore(): Promise<CategoryStore> {
  try {
    const parsed = JSON.parse(await fs.readFile(CATEGORIES_PATH, 'utf8')) as CategoryStore;
    if (parsed.version !== 1 || !Array.isArray(parsed.categories)) throw new Error('categories.json 格式无效');
    return parsed;
  } catch (error) {
    if (!isMissing(error)) throw error;
    await fs.mkdir(BLOG_ROOT, { recursive: true });
    const initial: CategoryStore = { version: 1, categories: [] };
    await writeJson(CATEGORIES_PATH, initial);
    return initial;
  }
}

function categoryDirectory(slug: string): string {
  return path.join(BLOG_ROOT, requiredPathSegment(slug, '分类路径'));
}

function postDirectory(category: string, id: string): string {
  return path.join(categoryDirectory(category), requiredPathSegment(id, '文章路径'));
}

async function readPost(category: StoredCategory, id: string): Promise<StoredPost | null> {
  try {
    const post = JSON.parse(await fs.readFile(path.join(postDirectory(category.slug, id), 'post.json'), 'utf8')) as StoredPost;
    if (!post.id || !post.title) return null;
    return { ...post, category: category.slug, contentFile: post.contentFile || 'index.md' };
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

async function listPosts(categories: StoredCategory[]): Promise<PostMeta[]> {
  const posts: PostMeta[] = [];
  for (const category of categories) {
    let entries: import('node:fs').Dirent[] = [];
    try {
      entries = await fs.readdir(categoryDirectory(category.slug), { withFileTypes: true });
    } catch (error) {
      if (!isMissing(error)) throw error;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue;
      const post = await readPost(category, entry.name);
      if (post) posts.push({ ...post, categoryName: category.name });
    }
  }
  return posts;
}

function sortPosts(posts: PostMeta[], sortBy: PostSortField, sortOrder: PostSortOrder): PostMeta[] {
  const direction = sortOrder === 'asc' ? 1 : -1;
  return posts.sort((left, right) => {
    const l = sortBy === 'date' ? Date.parse(left.date) : left[sortBy];
    const r = sortBy === 'date' ? Date.parse(right.date) : right[sortBy];
    return (l === r ? left.title.localeCompare(right.title) : l < r ? -1 : 1) * direction;
  });
}

function extractSummary(content: string): string {
  const lines = content.split('\n').map((line) => line.trim()).filter((line) => line && !line.startsWith('#') && !line.startsWith('![') && !line.startsWith('---'));
  const summary = lines.slice(0, 3).join(' ');
  return summary.substring(0, 160) + (summary.length > 160 ? '...' : '');
}

async function writeMutation<T>(operation: () => Promise<T>): Promise<T> {
  return withBlogLock(async () => {
    await blogGitService.pullBeforeWrite();
    return operation();
  });
}

export const blogService = {
  async getCategories(): Promise<Category[]> {
    const store = await ensureStore();
    const posts = await listPosts(store.categories);
    return store.categories
      .map((category) => ({ ...category, count: posts.filter((post) => post.category === category.slug).length }))
      .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  },

  async createCategory(slug: string, name: string, description = ''): Promise<boolean> {
    try {
      return await writeMutation(async () => {
        const normalizedSlug = requiredPathSegment(slug, '分类路径');
        const normalizedName = name.trim();
        if (!normalizedName) throw new Error('分类名称不能为空');
        const store = await ensureStore();
        if (store.categories.some((category) => category.slug === normalizedSlug)) throw new Error('分类已存在');
        await fs.mkdir(categoryDirectory(normalizedSlug), { recursive: true });
        store.categories.push({ name: normalizedName, slug: normalizedSlug, description, order: store.categories.length });
        await writeJson(CATEGORIES_PATH, store);
        return true;
      });
    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  },

  async updateCategory(slug: string, data: Partial<Category>): Promise<boolean> {
    try {
      return await writeMutation(async () => {
        const oldSlug = requiredPathSegment(slug, '分类路径');
        const store = await ensureStore();
        const category = store.categories.find((item) => item.slug === oldSlug);
        if (!category) throw new Error('分类不存在');
        const nextSlug = data.slug === undefined ? oldSlug : requiredPathSegment(data.slug, '分类路径');
        if (nextSlug !== oldSlug) {
          if (store.categories.some((item) => item.slug === nextSlug)) throw new Error('新的分类路径已存在');
          await fs.rename(categoryDirectory(oldSlug), categoryDirectory(nextSlug));
          category.slug = nextSlug;
        }
        if (data.name !== undefined) category.name = data.name.trim();
        if (data.description !== undefined) category.description = data.description;
        if (data.order !== undefined && Number.isFinite(data.order)) category.order = data.order;
        store.categories.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        await writeJson(CATEGORIES_PATH, store);
        return true;
      });
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  },

  async deleteCategory(slug: string): Promise<boolean> {
    try {
      return await writeMutation(async () => {
        const normalizedSlug = requiredPathSegment(slug, '分类路径');
        await fs.rm(categoryDirectory(normalizedSlug), { recursive: true, force: true });
        const store = await ensureStore();
        store.categories = store.categories.filter((category) => category.slug !== normalizedSlug);
        store.categories.forEach((category, index) => { category.order = index; });
        await writeJson(CATEGORIES_PATH, store);
        return true;
      });
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  },

  async deletePost(category: string, id: string): Promise<boolean> {
    try {
      return await writeMutation(async () => {
        await fs.rm(postDirectory(category, id), { recursive: true, force: true });
        return true;
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  async savePost(category: string, id: string, meta: Partial<PostMeta>, content?: string): Promise<boolean> {
    try {
      return await writeMutation(async () => {
        const normalizedCategory = requiredPathSegment(category, '分类路径');
        const normalizedId = requiredPathSegment(id, '文章路径');
        const store = await ensureStore();
        const storedCategory = store.categories.find((item) => item.slug === normalizedCategory);
        if (!storedCategory) throw new Error('分类不存在');
        const directory = postDirectory(normalizedCategory, normalizedId);
        await fs.mkdir(directory, { recursive: true });
        const existing = await readPost(storedCategory, normalizedId);
        const now = new Date().toISOString();
        const contentFile = existing?.contentFile || 'index.md';
        if (content !== undefined) await fs.writeFile(path.join(directory, contentFile), content, 'utf8');
        let summary = meta.summary !== undefined ? meta.summary : existing?.summary || '';
        if (!summary.trim() && content !== undefined) summary = extractSummary(content);
        const post: StoredPost = {
          id: normalizedId,
          category: normalizedCategory,
          title: meta.title || existing?.title || 'Untitled',
          date: meta.date || existing?.date || now.slice(0, 10),
          views: meta.views ?? existing?.views ?? 0,
          likes: meta.likes ?? existing?.likes ?? 0,
          updatedAt: now,
          author: meta.author || existing?.author || 'Admin',
          summary,
          tags: meta.tags ?? existing?.tags ?? '',
          contentFile,
        };
        await writeJson(path.join(directory, 'post.json'), post);
        return true;
      });
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  },

  async getAllPosts(page = 1, pageSize = 10, searchQuery = '', sortBy: PostSortField = 'date', sortOrder: PostSortOrder = 'desc'): Promise<PaginatedPosts> {
    const store = await ensureStore();
    const query = searchQuery.trim().toLocaleLowerCase();
    const posts = sortPosts((await listPosts(store.categories)).filter((post) => !query || post.title.toLocaleLowerCase().includes(query) || post.tags.toLocaleLowerCase().includes(query)), sortBy, sortOrder);
    const total = posts.length;
    const currentPage = Math.max(1, page);
    return { posts: posts.slice((currentPage - 1) * pageSize, currentPage * pageSize), total, page: currentPage, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getPostsByCategory(categorySlug: string, page = 1, pageSize = 10, searchQuery = '', sortBy: PostSortField = 'date', sortOrder: PostSortOrder = 'desc'): Promise<PaginatedPosts> {
    const all = await this.getAllPosts(1, Number.MAX_SAFE_INTEGER, searchQuery, sortBy, sortOrder);
    const posts = all.posts.filter((post) => post.category === categorySlug);
    const currentPage = Math.max(1, page);
    return { posts: posts.slice((currentPage - 1) * pageSize, currentPage * pageSize), total: posts.length, page: currentPage, pageSize, totalPages: Math.ceil(posts.length / pageSize) };
  },

  async getPostDetail(category: string, id: string): Promise<PostDetail | null> {
    try {
      const store = await ensureStore();
      const storedCategory = store.categories.find((item) => item.slug === category);
      if (!storedCategory) return null;
      const post = await readPost(storedCategory, id);
      if (!post) return null;
      const content = await fs.readFile(path.join(postDirectory(category, id), post.contentFile), 'utf8');
      return { ...post, categoryName: storedCategory.name, content };
    } catch (error) {
      console.error('Error fetching post detail:', error);
      return null;
    }
  },

  async incrementViews(category: string, id: string): Promise<number> {
    return withBlogLock(async () => {
      const store = await ensureStore();
      const storedCategory = store.categories.find((item) => item.slug === category);
      if (!storedCategory) return 0;
      const post = await readPost(storedCategory, id);
      if (!post) return 0;
      post.views += 1;
      await writeJson(path.join(postDirectory(category, id), 'post.json'), post);
      return post.views;
    });
  },

  extractSummary(content: string): string {
    return extractSummary(content);
  },

};
