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

      // 读取文件夹下的 index.md 获取元数据
      const indexFile = path.join(entryPath, 'index.md');
      if (fs.existsSync(indexFile)) {
         const { data } = matter(fs.readFileSync(indexFile, 'utf-8'));
         if (data.title) title = data.title;
         if (typeof data.order === 'number') order = data.order;
      }

      items.push({
        text: title,
        collapsed: false,
        items: children,
        order,
        name: entry.name
      });
    }

    // 2. 处理 Markdown 文件 (文档)
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (entry.name.toLowerCase() === 'index.md') continue;

      try {
        const content = fs.readFileSync(entryPath, 'utf-8');
        const { data } = matter(content);
        
        // 如果 Frontmatter 中设置了 hideInSidebar: true，则跳过
        if (data.hideInSidebar) continue;

        const stem = entry.name.replace(/\.md$/u, '');

        items.push({
          text: data.title?.trim() || stem, // 如果没有 title，回退到文件名
          link: path.posix.join(baseUrl, stem),
          order: typeof data.order === 'number' ? data.order : Number.POSITIVE_INFINITY,
          name: stem
        });
      } catch (e) {
        console.warn(`[Config] Warning: Failed to parse ${entryPath}`, e);
        // 出错时跳过该文件，而不是崩溃
      }
    }
  }

  // 排序：Order (小到大) -> Name (A-Z)
  return items.sort((a, b) => {
    const orderDiff = (a.order ?? Infinity) - (b.order ?? Infinity);
    if (orderDiff !== 0) return orderDiff;
    return (a.name ?? '').localeCompare(b.name ?? '', 'en');
  }).map(({ order, name, ...rest }) => rest); // 清理内部属性
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
              
              // 检查是否已有 H1 (排除 # 后面紧跟 # 的情况，即排除 ##, ### 等)
              // 正则含义：行首 -> 可选空白 -> # -> 必须有空白 -> 内容
              if (content.trimStart().startsWith('# ')) return;
              // 使用 gray-matter 重组文件，比正则替换更稳定
              // 这会自动处理 Frontmatter 的闭合和换行
              return matter.stringify(`# ${data.title}\n\n${content}`, data);
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
            { text: 'Blog', link: '/blog/' },
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
        '/blog/': [
          ...resolveSidebarItems('blog', '/blog/'),
          {
            text: '归档',
            collapsed: false,
            items: [
              { text: '2025', link: '/blog/archive/' },
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
