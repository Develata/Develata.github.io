// --------------------------------------------------
// 导入 VitePress 工具与插件
// --------------------------------------------------
import { defineConfig, type DefaultTheme } from 'vitepress';
import markdownItMathjax3 from 'markdown-it-mathjax3';
import { withMermaid } from 'vitepress-plugin-mermaid';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '..');

/**
 * 侧边栏条目接口（扩展内部属性用于排序）
 */
interface SidebarItem extends DefaultTheme.SidebarItem {
  order?: number;
  name?: string; // 用于文件名排序
  date?: number; // 用于日期排序 (时间戳)
}

/**
 * 递归生成侧边栏条目
 */
function resolveSidebarItems(dirPath: string, baseUrl: string): SidebarItem[] {
  const absolutePath = path.resolve(docsRoot, dirPath);
  if (!fs.existsSync(absolutePath)) return [];

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

  const items: SidebarItem[] = [];

  for (const entry of entries) {
    // 1. 过滤系统文件和隐藏文件
    if (entry.name.startsWith('.')) continue; 

    const entryPath = path.join(absolutePath, entry.name);
    
    // 1. 处理文件夹 (分类)
    if (entry.isDirectory()) {
      // 使用 posix.join 确保 URL 使用正斜杠
      const nextBaseUrl = path.posix.join(baseUrl, entry.name, '/');
      const children = resolveSidebarItems(path.join(dirPath, entry.name), nextBaseUrl);

      if (children.length === 0) continue;

      let title = entry.name;
      let order = Number.POSITIVE_INFINITY;
      let date = 0;

      // 读取文件夹下的 index.md 获取元数据
      const indexFile = path.join(entryPath, 'index.md');
      if (fs.existsSync(indexFile)) {
         const fileContent = fs.readFileSync(indexFile, 'utf-8');
         const { data, content } = matter(fileContent);
         
         if (data.title) {
            title = data.title;
         } else {
            // 尝试从内容中提取第一个 # 标题
            const match = content.match(/^\s*#\s+(.+)\s*$/m);
            if (match) title = match[1].trim();
         }

         if (typeof data.order === 'number') order = data.order;
         if (data.date) {
            const d = new Date(data.date);
            if (!isNaN(d.getTime())) date = d.getTime();
         }
      }

      items.push({
        text: title,
        collapsed: true,
        items: children,
        order,
        name: entry.name,
        date
      });
    }

    // 2. 处理 Markdown 文件 (文档)
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (entry.name.toLowerCase() === 'index.md') continue;

      try {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        const { data, content } = matter(fileContent);
        
        // 如果 Frontmatter 中设置了 hideInSidebar: true，则跳过
        if (data.hideInSidebar) continue;

        const stem = entry.name.replace(/\.md$/u, '');
        
        let date = 0;
        if (data.date) {
            const d = new Date(data.date);
            if (!isNaN(d.getTime())) date = d.getTime();
        }

        // 优先使用 Frontmatter 中的 title
        let title = '';
        if (data && data.title) {
            title = String(data.title).trim();
        }

        // 如果没有 Frontmatter title，尝试从内容中提取第一个 # 标题
        if (!title) {
            const match = content.match(/^\s*#\s+(.+)\s*$/m);
            if (match) title = match[1].trim();
        }
        
        // 最后回退到文件名
        title = title || stem;

        items.push({
          text: title,
          link: path.posix.join(baseUrl, stem),
          order: typeof data.order === 'number' ? data.order : Number.POSITIVE_INFINITY,
          name: stem,
          date
        });
      } catch (e) {
        console.warn(`[Config] Warning: Failed to parse ${entryPath}`, e);
        // 出错时跳过该文件，而不是崩溃
      }
    }
  }

  // 排序：Order (小到大) -> Date (新到旧) -> Name (A-Z)
  return items.sort((a, b) => {
    // 特殊处理：Other 文件夹永远排在最后
    const isAOther = (a.name || '').toLowerCase() === 'other' || (a.text || '').toLowerCase() === 'other';
    const isBOther = (b.name || '').toLowerCase() === 'other' || (b.text || '').toLowerCase() === 'other';
    
    if (isAOther && !isBOther) return 1;
    if (!isAOther && isBOther) return -1;

    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;
    
    if (orderA !== orderB) {
        return orderA - orderB;
    }

    // 按日期倒序 (新 -> 旧)
    const dateA = a.date ?? 0;
    const dateB = b.date ?? 0;
    if (dateA !== dateB) {
        return dateB - dateA;
    }

    return (a.name ?? '').localeCompare(b.name ?? '', 'en');
  }).map(({ order, name, date, ...rest }) => rest); // 清理内部属性
}

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',
    base: '/', // 关键修改,解决上传以后排版问题
    cleanUrls: true,
    // --------------------------------------------------
    // Vite 插件配置：自动注入标题
    // --------------------------------------------------
    vite: {
      build: {
        chunkSizeWarningLimit: 2000
      },
      plugins: [
        {
          name: 'auto-inject-title',
          enforce: 'pre',
          transform(code, id) {
            // 仅处理 .md 文件，排除 node_modules
            if (!id.endsWith('.md') || id.includes('node_modules')) return;

            try {
              const { data, content } = matter(code);
              
              // 排除首页和无标题页面
              if (path.basename(id).toLowerCase() === 'index.md' || !data.title) return;
              
              // 检查是否已有 H1
              const h1Regex = /^\s*#\s+(.*)$/m;
              const hasH1 = h1Regex.test(content);

              if (hasH1) {
                // 如果已有 H1，强制替换为 Frontmatter 中的 title
                const newContent = content.replace(h1Regex, `# ${data.title}`);
                return matter.stringify(newContent, data);
              } else {
                // 如果没有 H1，自动注入
                return matter.stringify(`# ${data.title}\n\n${content}`, data);
              }
            } catch (e) {
              return; 
            }
          }
        }
      ]
    },
    
    markdown: {
      lineNumbers: true,
      config: (md) => {
        md.use(markdownItMathjax3);
      },
    },

    themeConfig: {
      nav: [
        { text: 'Home', link: '/' },
        {
          text: 'Knowledge',
          items: [
            { text: 'Math', link: '/knowledge/math/' },
            { text: 'Coding', link: '/knowledge/coding/' },
            { text: 'Sharing', link: '/knowledge/sharing/' },
          ],
        },
        { text: 'News', link: '/news/' },
        { text: 'Books', link: '/books/' },
        { text: 'Games', link: '/games/' },
        { text: 'About',
          items: [
            { text: 'Me', link: '/about/me' },
            { text: 'Blog', link: '/about/blog/' },
          ]
        },
      ],

      sidebar: {
        // 自动解析 knowledge/math,coding,sharing 目录
        '/knowledge/math/': resolveSidebarItems('knowledge/math', '/knowledge/math/'),
        '/knowledge/coding/': resolveSidebarItems('knowledge/coding', '/knowledge/coding/'),
        '/knowledge/sharing/': resolveSidebarItems('knowledge/sharing', '/knowledge/sharing/'),
        
        // 自动解析 books 目录
        '/books/': resolveSidebarItems('books', '/books/'), 

        // 自动解析 news 目录
        '/news/': resolveSidebarItems('news', '/news/'),

        // Blog 侧边栏：合并自动生成的分类 + 手动添加的归档
        '/about/blog/': [
          ...resolveSidebarItems('about/blog', '/about/blog/'),
          {
            text: '归档',
            collapsed: true,
            items: [
              { text: '2025', link: '/about/blog/archive/' },
            ],
          },
        ],
      },

      search: {
        provider: 'local',
      },

      socialLinks: [
        { icon: 'github', link: 'https://github.com/Develata' },
      ],

      outline: {
        level: [1, 4],
        label: '目录',
      },
    },
  }),
);
