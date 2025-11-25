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

      const { data } = matter(fs.readFileSync(entryPath, 'utf-8'));
      const stem = entry.name.replace(/\.md$/u, '');

      items.push({
        text: data.title?.trim() || '~',
        link: path.posix.join(baseUrl, stem),
        order: typeof data.order === 'number' ? data.order : Number.POSITIVE_INFINITY,
        name: stem
      });
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
              
              // 排除首页 (layout: home) 和没有 title 的页面
              if (data.layout === 'home' || !data.title) return;
              
              // 如果正文中已经包含一级标题 (# Title)，则跳过，避免重复
              if (/^\s*#\s+.+/m.test(content)) return;

              // 在 Frontmatter 之后插入一级标题
              const match = code.match(/^(---[\s\S]*?---)/);
              if (match) {
                const frontmatterEnd = match[0].length;
                return code.slice(0, frontmatterEnd) + `\n\n# ${data.title}\n\n` + code.slice(frontmatterEnd);
              }
              
              // 无 Frontmatter 的情况（直接在头部添加）
              return `# ${data.title}\n\n${code}`;
            } catch (e) {
              return; // 解析出错则忽略
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
        { text: 'Blog', link: '/blog/' },
        { text: 'Books', link: '/books/' },
        { text: 'About', link: '/about/me' },
      ],

      sidebar: {
        '/knowledge/math/': resolveSidebarItems('knowledge/math', '/knowledge/math/'),
        '/knowledge/coding/': resolveSidebarItems('knowledge/coding', '/knowledge/coding/'),
        '/knowledge/sharing/': resolveSidebarItems('knowledge/sharing', '/knowledge/sharing/'),
        
        '/blog/': [
          {
            text: '博客分类',
            items: [
              { text: '全部文章', link: '/blog/' },
              { text: '指南', link: '/blog/tags/guide/' }, 
            ],
          },
          {
            text: '归档',
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
