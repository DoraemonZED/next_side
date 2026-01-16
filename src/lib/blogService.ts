import fs from 'fs/promises';
import path from 'path';

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
  readTime: string;
  author: string;
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

export const blogService = {
  // 获取所有分类
  async getCategories(): Promise<Category[]> {
    try {
      if (!(await fs.access(BLOG_ROOT).then(() => true).catch(() => false))) {
        await fs.mkdir(BLOG_ROOT, { recursive: true });
      }

      const categories: Category[] = [];
      const dirs = await fs.readdir(BLOG_ROOT);

      for (const slug of dirs) {
        const catDir = path.join(BLOG_ROOT, slug);
        const stat = await fs.stat(catDir);
        
        if (stat.isDirectory()) {
          const catJsonPath = path.join(catDir, 'category.json');
          if (!(await fs.access(catJsonPath).then(() => true).catch(() => false))) continue;
          
          const catJson = JSON.parse(await fs.readFile(catJsonPath, 'utf-8'));
          
          // 计算文章数量
          const postDirs = await fs.readdir(catDir);
          let postCount = 0;
          for (const d of postDirs) {
            if (d === 'category.json' || d.startsWith('.')) continue;
            const fullPath = path.join(catDir, d);
            const s = await fs.stat(fullPath);
            if (s.isDirectory()) postCount++;
          }

          categories.push({
            ...catJson,
            slug,
            count: postCount,
            order: catJson.order || 0
          });
        }
      }

      // 如果没有任何分类，默认创建一个
      if (categories.length === 0) {
        await this.createCategory('default', '未分类', '默认分类');
        return [{
          name: '未分类',
          slug: 'default',
          description: '默认分类',
          count: 0,
          order: 0
        }];
      }

      return categories.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // 创建分类
  async createCategory(slug: string, name: string, description: string = ''): Promise<boolean> {
    try {
      const catDir = path.join(BLOG_ROOT, slug);
      await fs.mkdir(catDir, { recursive: true });
      const catJson = { name, description };
      await fs.writeFile(path.join(catDir, 'category.json'), JSON.stringify(catJson, null, 2));
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
      let currentDir = oldDir;

      // 如果修改了 slug (路径)，需要重命名文件夹
      if (data.slug && data.slug !== slug) {
        const newDir = path.join(BLOG_ROOT, data.slug);
        if (await fs.access(newDir).then(() => true).catch(() => false)) {
          throw new Error('新的路径已存在');
        }
        await fs.rename(oldDir, newDir);
        currentDir = newDir;
      }

      const catJsonPath = path.join(currentDir, 'category.json');
      const existingJson = JSON.parse(await fs.readFile(catJsonPath, 'utf-8'));
      
      // 合并数据，排除 count 和 slug (slug 已经通过文件夹重命名处理)
      const { count, slug: _, ...updateData } = data as any;
      const updatedJson = { ...existingJson, ...updateData };
      
      await fs.writeFile(catJsonPath, JSON.stringify(updatedJson, null, 2));
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
      // 使用 rm -rf 递归删除分类及其下的所有文章
      await fs.rm(catDir, { recursive: true, force: true });
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
      await fs.rm(postDir, { recursive: true, force: true });
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  },

  // 创建或更新文章
  async savePost(category: string, id: string, meta: Partial<PostMeta>, content: string): Promise<boolean> {
    try {
      const postDir = path.join(BLOG_ROOT, category, id);
      await fs.mkdir(postDir, { recursive: true });

      // 如果是新文章，需要完整的 meta
      let existingMeta = {};
      try {
        existingMeta = JSON.parse(await fs.readFile(path.join(postDir, '_index.json'), 'utf-8'));
      } catch (e) {
        // 新文章
        existingMeta = {
          title: meta.title || 'Untitled',
          date: meta.date || new Date().toISOString().split('T')[0],
          views: 0,
          likes: 0,
          readTime: meta.readTime || '5 min read',
          author: meta.author || 'Admin'
        };
      }

      const finalMeta = { ...existingMeta, ...meta };
      delete (finalMeta as any).id;
      delete (finalMeta as any).category;
      delete (finalMeta as any).categoryName;

      await fs.writeFile(path.join(postDir, '_index.json'), JSON.stringify(finalMeta, null, 2));
      await fs.writeFile(path.join(postDir, 'index.md'), content);
      return true;
    } catch (error) {
      console.error('Error saving post:', error);
      return false;
    }
  },

  // 获取特定分类下的文章列表 (支持分页、搜索、排序)
  async getPostsByCategory(
    categorySlug: string, 
    page: number = 1, 
    pageSize: number = 15,
    searchQuery: string = '',
    sortBy: 'date' | 'views' | 'likes' = 'date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<PaginatedPosts> {
    try {
      const allPosts: PostMeta[] = [];
      const processCategory = async (slug: string) => {
        const catDir = path.join(BLOG_ROOT, slug);
        if (!(await fs.access(catDir).then(() => true).catch(() => false))) return;
        
        const catJson = JSON.parse(await fs.readFile(path.join(catDir, 'category.json'), 'utf-8'));
        const items = await fs.readdir(catDir);

        for (const id of items) {
          if (id === 'category.json' || id.startsWith('.')) continue;
          const postDir = path.join(catDir, id);
          const stat = await fs.stat(postDir);
          if (stat.isDirectory()) {
            const metaPath = path.join(postDir, '_index.json');
            try {
              const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
              
              // 搜索过滤
              if (searchQuery && !meta.title.toLowerCase().includes(searchQuery.toLowerCase())) {
                continue;
              }

              allPosts.push({
                ...meta,
                id,
                category: slug,
                categoryName: catJson.name
              });
            } catch (e) {
              // 跳过没有元数据的目录
            }
          }
        }
      };

      await processCategory(categorySlug);

      // 排序
      allPosts.sort((a, b) => {
        let valA: any = a[sortBy];
        let valB: any = b[sortBy];

        if (sortBy === 'date') {
          valA = new Date(valA).getTime();
          valB = new Date(valB).getTime();
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });

      // 分页截取
      const total = allPosts.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const paginatedPosts = allPosts.slice(start, start + pageSize);

      return {
        posts: paginatedPosts,
        total,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('Error fetching posts:', error);
      return {
        posts: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      };
    }
  },

  // 获取文章详情
  async getPostDetail(category: string, id: string): Promise<PostDetail | null> {
    try {
      const postDir = path.join(BLOG_ROOT, category, id);
      const meta = JSON.parse(await fs.readFile(path.join(postDir, '_index.json'), 'utf-8'));
      let content = await fs.readFile(path.join(postDir, 'index.md'), 'utf-8');
      const catJson = JSON.parse(await fs.readFile(path.join(BLOG_ROOT, category, 'category.json'), 'utf-8'));

      // 处理 Markdown 中的图片路径
      // 注意：这里不再进行硬编码替换，而是保持原始路径（如 ./test.svg）
      // 这样在编辑时就能看到原始内容，而在渲染时由前端 MarkdownRenderer 根据当前文章上下文动态转换
      
      return {
        ...meta,
        id,
        category,
        categoryName: catJson.name,
        content
      };
    } catch (error) {
      console.error('Error fetching post detail:', error);
      return null;
    }
  }
};
