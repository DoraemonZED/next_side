import fs from 'fs/promises';
import path from 'path';
import db from '@/lib/db';

const BLOG_ROOT = path.join(process.cwd(), 'content/blog');

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

// 防止重复同步的标志
let isSyncing = false;

export const blogService = {
  // 获取所有分类
  async getCategories(): Promise<Category[]> {
    try {
      const rows = db.prepare(`
        SELECT c.*, COUNT(p.id) as count 
        FROM categories c 
        LEFT JOIN posts p ON c.slug = p.category_slug 
        GROUP BY c.id 
        ORDER BY c.sort_order ASC
      `).all() as any[];

      // 如果数据库没数据且没有正在同步，尝试从目录结构同步一次
      if (rows.length === 0 && !isSyncing) {
        isSyncing = true;
        try {
          await this.syncBlogData();
          // 同步后再次查询
          const newRows = db.prepare(`
            SELECT c.*, COUNT(p.id) as count 
            FROM categories c 
            LEFT JOIN posts p ON c.slug = p.category_slug 
            GROUP BY c.id 
            ORDER BY c.sort_order ASC
          `).all() as any[];
          
          // 如果同步后仍然没有分类，创建默认分类
          if (newRows.length === 0) {
            await this.createDefaultCategory();
            // 再次查询
            const defaultRows = db.prepare(`
              SELECT c.*, COUNT(p.id) as count 
              FROM categories c 
              LEFT JOIN posts p ON c.slug = p.category_slug 
              GROUP BY c.id 
              ORDER BY c.sort_order ASC
            `).all() as any[];
            
            return defaultRows.map(row => ({
              name: row.name,
              slug: row.slug,
              description: row.description,
              count: row.count,
              order: row.sort_order
            }));
          }
          
          return newRows.map(row => ({
            name: row.name,
            slug: row.slug,
            description: row.description,
            count: row.count,
            order: row.sort_order
          }));
        } finally {
          isSyncing = false;
        }
      }

      // 如果已经有数据或者正在同步，直接返回
      return rows.map(row => ({
        name: row.name,
        slug: row.slug,
        description: row.description,
        count: row.count,
        order: row.sort_order
      }));
    } catch (error) {
      console.error('Error fetching categories:', error);
      isSyncing = false; // 确保在错误时也重置标志
      return [];
    }
  },

  // 创建分类
  async createCategory(slug: string, name: string, description: string = ''): Promise<boolean> {
    try {
      const catDir = path.join(BLOG_ROOT, slug);
      if (!(await fs.access(catDir).then(() => true).catch(() => false))) {
        await fs.mkdir(catDir, { recursive: true });
      }

      db.prepare('INSERT INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)')
        .run(slug, name, description, 0);
      return true;
    } catch (error) {
      console.error('Error creating category:', error);
      return false;
    }
  },

  // 更新分类 (支持排序、名称和路径修改)
  async updateCategory(slug: string, data: Partial<Category>): Promise<boolean> {
    try {
      const oldDir = path.join(BLOG_ROOT, slug);
      
      // 如果修改了 slug (路径)，需要同步重命名文件夹和数据库
      if (data.slug && data.slug !== slug) {
        const newDir = path.join(BLOG_ROOT, data.slug);
        if (await fs.access(newDir).then(() => true).catch(() => false)) {
          throw new Error('新的路径已存在');
        }
        if (await fs.access(oldDir).then(() => true).catch(() => false)) {
          await fs.rename(oldDir, newDir);
        }
        
        db.prepare('UPDATE categories SET slug = ? WHERE slug = ?').run(data.slug, slug);
        slug = data.slug; // 更新当前的 slug 供后续更新使用
      }

      if (data.name !== undefined || data.description !== undefined || data.order !== undefined) {
        const sets = [];
        const params = [];
        if (data.name !== undefined) { sets.push('name = ?'); params.push(data.name); }
        if (data.description !== undefined) { sets.push('description = ?'); params.push(data.description); }
        if (data.order !== undefined) { sets.push('sort_order = ?'); params.push(data.order); }
        params.push(slug);

        db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE slug = ?`).run(...params);
      }
      
      return true;
    } catch (error) {
      console.error('Error updating category:', error);
      return false;
    }
  },

  // 删除分类
  async deleteCategory(slug: string): Promise<boolean> {
    try {
      const catDir = path.join(BLOG_ROOT, slug);
      if (await fs.access(catDir).then(() => true).catch(() => false)) {
        await fs.rm(catDir, { recursive: true, force: true });
      }
      db.prepare('DELETE FROM categories WHERE slug = ?').run(slug);
      return true;
    } catch (error) {
      console.error('Error deleting category:', error);
      return false;
    }
  },

  // 删除文章
  async deletePost(category: string, id: string): Promise<boolean> {
    try {
      const postDir = path.join(BLOG_ROOT, category, id);
      if (await fs.access(postDir).then(() => true).catch(() => false)) {
        await fs.rm(postDir, { recursive: true, force: true });
      }
      db.prepare('DELETE FROM posts WHERE category_slug = ? AND slug = ?').run(category, id);
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  // 创建或更新文章
  async savePost(category: string, id: string, meta: Partial<PostMeta>, content?: string): Promise<boolean> {
    try {
      const postDir = path.join(BLOG_ROOT, category, id);
      if (!(await fs.access(postDir).then(() => true).catch(() => false))) {
        await fs.mkdir(postDir, { recursive: true });
      }

      const absoluteContentPath = path.join(postDir, 'index.md');
      if (content !== undefined) {
        await fs.writeFile(absoluteContentPath, content);
      }

      // 数据库中仅存储相对于 BLOG_ROOT 的路径 (例如: category/id/index.md)
      const relativeContentPath = path.join(category, id, 'index.md');

      // 获取现有数据以防只更新部分字段
      const existing = db.prepare('SELECT * FROM posts WHERE category_slug = ? AND slug = ?').get(category, id) as any;

      const now = new Date().toISOString();
      const title = meta.title || (existing ? existing.title : 'Untitled');
      const date = meta.date || (existing ? existing.date : now.split('T')[0]);
      const views = meta.views !== undefined ? meta.views : (existing ? existing.views : 0);
      const likes = meta.likes !== undefined ? meta.likes : (existing ? existing.likes : 0);
      const updatedAt = now; // 每次保存都更新修改时间
      const author = meta.author || (existing ? existing.author : 'Admin');
      const tags = meta.tags !== undefined ? meta.tags : (existing ? existing.tags : '');
      
      let summary = meta.summary !== undefined ? meta.summary : (existing ? existing.summary : '');
      
      // 如果简介为空且传入了正文，从正文中提取
      if ((!summary || summary.trim() === '') && content !== undefined) {
        summary = this.extractSummary(content);
      }

      db.prepare(`
        INSERT INTO posts (category_slug, slug, title, date, views, likes, updated_at, author, summary, tags, content_path)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(category_slug, slug) DO UPDATE SET
          title = excluded.title,
          date = excluded.date,
          updated_at = excluded.updated_at,
          author = excluded.author,
          summary = excluded.summary,
          tags = excluded.tags,
          content_path = excluded.content_path
      `).run(category, id, title, date, views, likes, updatedAt, author, summary, tags, relativeContentPath);

      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  },

  // 获取所有文章列表 (支持分页、搜索、排序)
  async getAllPosts(
    page: number = 1, 
    pageSize: number = 10,
    searchQuery: string = '',
    sortBy: 'date' | 'views' | 'likes' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedPosts> {
    try {
      const offset = (page - 1) * pageSize;
      const dbSortBy = sortBy === 'date' ? 'date' : sortBy;
      
      let query = `
        FROM posts p 
        JOIN categories c ON p.category_slug = c.slug
      `;
      const params: any[] = [];

      if (searchQuery) {
        query += ` WHERE (p.title LIKE ? OR p.tags LIKE ?)`;
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
      }

      const totalRow = db.prepare(`SELECT COUNT(*) as count ${query}`).get(...params) as { count: number };
      const total = totalRow.count;

      const rows = db.prepare(`
        SELECT p.*, c.name as categoryName 
        ${query} 
        ORDER BY p.${dbSortBy} ${sortOrder.toUpperCase()} 
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset) as any[];

      return {
        posts: rows.map(row => ({
          id: row.slug,
          category: row.category_slug,
          categoryName: row.categoryName,
          title: row.title,
          date: row.date,
          views: row.views,
          likes: row.likes,
          updatedAt: row.updated_at || row.date,
          author: row.author,
          summary: row.summary,
          tags: row.tags || ''
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('Error fetching all posts:', error);
      return { posts: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  // 获取特定分类下的文章列表 (支持分页、搜索、排序)
  async getPostsByCategory(
    categorySlug: string, 
    page: number = 1, 
    pageSize: number = 10,
    searchQuery: string = '',
    sortBy: 'date' | 'views' | 'likes' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedPosts> {
    try {
      const offset = (page - 1) * pageSize;
      const dbSortBy = sortBy === 'date' ? 'date' : sortBy;
      
      let query = `
        FROM posts p 
        JOIN categories c ON p.category_slug = c.slug 
        WHERE p.category_slug = ?
      `;
      const params: any[] = [categorySlug];

      if (searchQuery) {
        query += ` AND (p.title LIKE ? OR p.tags LIKE ?)`;
        params.push(`%${searchQuery}%`, `%${searchQuery}%`);
      }

      const totalRow = db.prepare(`SELECT COUNT(*) as count ${query}`).get(...params) as { count: number };
      const total = totalRow.count;

      const rows = db.prepare(`
        SELECT p.*, c.name as categoryName 
        ${query} 
        ORDER BY p.${dbSortBy} ${sortOrder.toUpperCase()} 
        LIMIT ? OFFSET ?
      `).all(...params, pageSize, offset) as any[];

      return {
        posts: rows.map(row => ({
          id: row.slug,
          category: row.category_slug,
          categoryName: row.categoryName,
          title: row.title,
          date: row.date,
          views: row.views,
          likes: row.likes,
          updatedAt: row.updated_at || row.date,
          author: row.author,
          summary: row.summary,
          tags: row.tags || ''
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return { posts: [], total: 0, page, pageSize, totalPages: 0 };
    }
  },

  // 获取文章详情
  async getPostDetail(category: string, id: string): Promise<PostDetail | null> {
    try {
      const row = db.prepare(`
        SELECT p.*, c.name as categoryName 
        FROM posts p 
        JOIN categories c ON p.category_slug = c.slug 
        WHERE p.category_slug = ? AND p.slug = ?
      `).get(category, id) as any;

      if (!row) return null;

      const absolutePath = path.join(BLOG_ROOT, row.content_path);
      const content = await fs.readFile(absolutePath, 'utf-8');
      
      return {
        id: row.slug,
        category: row.category_slug,
        categoryName: row.categoryName,
        title: row.title,
        date: row.date,
        views: row.views,
        likes: row.likes,
        updatedAt: row.updated_at || row.date,
        author: row.author,
        summary: row.summary,
        tags: row.tags || '',
        content
      };
    } catch (error) {
      console.error('Error fetching post detail:', error);
      return null;
    }
  },

  // 增加文章浏览量
  async incrementViews(category: string, id: string): Promise<number> {
    try {
      db.prepare('UPDATE posts SET views = views + 1 WHERE category_slug = ? AND slug = ?')
        .run(category, id);
      
      const row = db.prepare('SELECT views FROM posts WHERE category_slug = ? AND slug = ?')
        .get(category, id) as { views: number } | undefined;
      
      return row?.views || 0;
    } catch (error) {
      console.error('Error incrementing views:', error);
      return 0;
    }
  },

  // 提取摘要
  extractSummary(content: string): string {
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#') && !line.startsWith('!['))
      .filter(line => !line.startsWith('---')); // 过滤掉可能的 frontmatter 分隔符
    
    return lines.slice(0, 3).join(' ').substring(0, 160) + (content.length > 160 ? '...' : '');
  },

  // 创建默认分类
  async createDefaultCategory(): Promise<void> {
    const defaultSlug = 'default';
    const defaultName = '默认分类';
    const defaultDir = path.join(BLOG_ROOT, defaultSlug);
    
    try {
      // 创建默认分类目录
      await fs.mkdir(defaultDir, { recursive: true });
      
      // 插入数据库
      db.prepare(`
        INSERT INTO categories (slug, name, description, sort_order) 
        VALUES (?, ?, ?, ?) 
        ON CONFLICT(slug) DO NOTHING
      `).run(defaultSlug, defaultName, '系统默认分类', 0);
    } catch (error) {
      console.error('Error creating default category:', error);
      throw error;
    }
  },

  // 同步文件系统数据到数据库
  async syncBlogData(): Promise<{ success: boolean; message: string }> {
    try {
      if (!(await fs.access(BLOG_ROOT).then(() => true).catch(() => false))) {
        await fs.mkdir(BLOG_ROOT, { recursive: true });
      }

      const dirs = await fs.readdir(BLOG_ROOT).catch(() => []);
      
      // 如果目录为空，创建默认分类
      if (dirs.length === 0 || dirs.filter(d => !d.startsWith('.')).length === 0) {
        await this.createDefaultCategory();
        return { success: true, message: '已创建默认分类' };
      }
      
      for (const catSlug of dirs) {
        // 跳过隐藏文件和目录
        if (catSlug.startsWith('.')) continue;
        
        const catDir = path.join(BLOG_ROOT, catSlug);
        const stat = await fs.stat(catDir);
        if (!stat.isDirectory()) continue;

        // 处理分类：优先使用数据库中已有的分类名称，如果没有则使用 slug
        const existingCat = db.prepare('SELECT name, description FROM categories WHERE slug = ?').get(catSlug) as { name: string; description: string } | undefined;
        const catName = existingCat?.name || catSlug;
        const catDesc = existingCat?.description || '';

        db.prepare(`
          INSERT INTO categories (slug, name, description) 
          VALUES (?, ?, ?) 
          ON CONFLICT(slug) DO NOTHING
        `).run(catSlug, catName, catDesc);

        // 处理文章
        const postDirs = await fs.readdir(catDir);
        for (const postSlug of postDirs) {
          if (postSlug.startsWith('.')) continue;
          const postDir = path.join(catDir, postSlug);
          const postStat = await fs.stat(postDir);
          if (!postStat.isDirectory()) continue;

          const indexPath = path.join(postDir, 'index.md');
          if (!(await fs.access(indexPath).then(() => true).catch(() => false))) continue;

          const content = await fs.readFile(indexPath, 'utf-8');
          const summary = this.extractSummary(content);
          const relativePath = path.join(catSlug, postSlug, 'index.md');

          const now = new Date().toISOString();
          db.prepare(`
            INSERT INTO posts (category_slug, slug, title, date, views, likes, updated_at, author, summary, tags, content_path)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(category_slug, slug) DO UPDATE SET
              title = excluded.title,
              date = excluded.date,
              updated_at = excluded.updated_at,
              author = excluded.author,
              summary = excluded.summary,
              tags = excluded.tags,
              content_path = excluded.content_path
          `).run(
            catSlug, 
            postSlug, 
            postSlug, // 默认使用文件夹名作为标题
            now.split('T')[0],
            0,
            0,
            now,
            'Admin',
            summary,
            '', // 默认 tags 为空
            relativePath
          );
        }
      }

      return { success: true, message: '同步完成' };
    } catch (error: any) {
      console.error('Error syncing blog data:', error);
      return { success: false, message: error.message };
    }
  }
};
