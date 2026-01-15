import fs from 'fs/promises';
import path from 'path';

const BLOG_ROOT = path.join(process.cwd(), 'content/blog');

export interface Category {
  name: string;
  slug: string;
  description?: string;
  count: number;
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

export const blogService = {
  // 获取所有分类
  async getCategories(): Promise<Category[]> {
    try {
      const categories: Category[] = [];
      const dirs = await fs.readdir(BLOG_ROOT);

      for (const slug of dirs) {
        const catDir = path.join(BLOG_ROOT, slug);
        const stat = await fs.stat(catDir);
        
        if (stat.isDirectory()) {
          const catJsonPath = path.join(catDir, 'category.json');
          const catJson = JSON.parse(await fs.readFile(catJsonPath, 'utf-8'));
          
          // 计算文章数量
          const postDirs = await fs.readdir(catDir);
          const postCount = postDirs.filter(d => !d.endsWith('.json')).length;

          categories.push({
            ...catJson,
            slug,
            count: postCount
          });
        }
      }
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // 获取特定分类下的文章列表
  async getPostsByCategory(categorySlug: string): Promise<PostMeta[]> {
    try {
      const posts: PostMeta[] = [];
      const processCategory = async (slug: string) => {
        const catDir = path.join(BLOG_ROOT, slug);
        const catJson = JSON.parse(await fs.readFile(path.join(catDir, 'category.json'), 'utf-8'));
        const items = await fs.readdir(catDir);

        for (const id of items) {
          const postDir = path.join(catDir, id);
          const stat = await fs.stat(postDir);
          if (stat.isDirectory()) {
            const metaPath = path.join(postDir, '_index.json');
            try {
              const meta = JSON.parse(await fs.readFile(metaPath, 'utf-8'));
              posts.push({
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

      return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
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
