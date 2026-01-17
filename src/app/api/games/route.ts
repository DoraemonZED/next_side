import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

interface GameInfo {
  name: string;
  title: string;
  description: string;
}

// 从 HTML 中提取 title 和可能的描述信息
function parseGameInfo(html: string, gameName: string): GameInfo {
  // 提取 title
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  let title = gameName;
  if (titleMatch) {
    title = titleMatch[1]
      .replace(/\s*-\s*游戏\s*$/i, '') // 移除 "- 游戏" 后缀
      .trim();
  }

  let description = '';

  // 1. 优先提取 meta description
  const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  if (metaDescMatch) {
    description = metaDescMatch[1].trim();
  }

  // 2. 如果没有 meta description，尝试查找自定义的 data-description 属性
  if (!description) {
    const dataDescMatch = html.match(/<html[^>]*\s+data-description=["'](.*?)["']/i) ||
                          html.match(/<body[^>]*\s+data-description=["'](.*?)["']/i) ||
                          html.match(/<div[^>]*\s+data-description=["'](.*?)["']/i);
    if (dataDescMatch) {
      description = dataDescMatch[1].trim();
    }
  }

  // 3. 尝试从 HTML body 中提取第一段有意义的文本
  if (!description) {
    // 移除 script 和 style 标签内容
    const bodyContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    
    // 查找第一个包含中文或英文的段落或 div
    const textPatterns = [
      /<p[^>]*>([^<]{20,150})<\/p>/i,
      /<div[^>]*class=["'][^"']*(?:desc|intro|about|info)[^"']*["'][^>]*>([^<]{20,150})<\/div>/i,
      /<h2[^>]*>([^<]{10,50})<\/h2>/i,
      /<h3[^>]*>([^<]{10,50})<\/h3>/i,
    ];
    
    for (const pattern of textPatterns) {
      const match = bodyContent.match(pattern);
      if (match && match[1]) {
        let text = match[1]
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .trim()
          .replace(/\s+/g, ' ');
        
        // 确保文本有意义（包含中文或足够长的英文）
        if (text.length >= 10 && (/\p{Script=Han}/u.test(text) || text.length >= 20)) {
          if (text.length > 100) {
            text = text.substring(0, 100) + '...';
          }
          description = text;
          break;
        }
      }
    }
  }

  // 4. 如果还是没有描述，根据游戏名称生成默认描述
  if (!description) {
    const defaultDescriptions: Record<string, string> = {
      '2048': '经典的数字合并游戏，通过滑动合并相同数字，挑战达到2048！',
      'snake': '怀旧风格的贪吃蛇游戏，控制小蛇吃食物，小心不要撞到自己！',
    };
    
    description = defaultDescriptions[gameName.toLowerCase()] || 
                  defaultDescriptions[title.toLowerCase()] ||
                  `经典的${title}游戏`;
  }

  return {
    name: gameName,
    title,
    description,
  };
}

export async function GET() {
  try {
    const gameDir = path.join(process.cwd(), 'content/game');
    
    // 读取游戏目录
    const entries = await fs.readdir(gameDir, { withFileTypes: true });
    
    const games: GameInfo[] = [];
    
    for (const entry of entries) {
      // 只处理目录
      if (!entry.isDirectory()) continue;
      
      const gameName = entry.name;
      const gameHtmlPath = path.join(gameDir, gameName, 'index.html');
      
      try {
        // 读取游戏的 index.html
        const html = await fs.readFile(gameHtmlPath, 'utf-8');
        const gameInfo = parseGameInfo(html, gameName);
        games.push(gameInfo);
      } catch (error) {
        console.error(`Error reading game ${gameName}:`, error);
        // 如果读取失败，仍然添加基本信息
        games.push({
          name: gameName,
          title: gameName,
          description: `游戏：${gameName}`,
        });
      }
    }
    
    // 按名称排序
    games.sort((a, b) => a.name.localeCompare(b.name));
    
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}
