// --------------------------------------------------
// 导入 Node.js 核心模块 (用于文件扫描)
// --------------------------------------------------
import fs from 'fs';
import path from 'path';

// --------------------------------------------------
// 导入 VitePress 工具与插件
// --------------------------------------------------
import { defineConfig } from 'vitepress';
import markdownItMathjax3 from 'markdown-it-mathjax3';
import { withMermaid } from 'vitepress-plugin-mermaid';

// --------------------------------------------------
// 🟢 核心自动化函数：根据文件夹生成侧边栏
// --------------------------------------------------
function generateSidebar(folderPath: string) {
  // 1. 定位目标目录 (相对于当前配置文件 docs/.vitepress/ 的上级目录 docs/)
  // 注意：config.mts 在 docs/.vitepress 下，所以要退两级 (../../docs) 或者根据运行上下文
  // VitePress 运行时的 root 通常是 docs，所以这里直接拼接 docs 下的路径
  const dir = path.join(__dirname, '..', folderPath);

  // 2. 如果目录不存在，返回空数组（防止报错）
  if (!fs.existsSync(dir)) {
    console.warn(`[Sidebar Warning] Directory not found: ${dir}`);
    return [];
  }

  // 3. 扫描目录下所有 .md 文件 (排除 index.md)
  const files = fs.readdirSync(dir)
    .filter(file => file.endsWith('.md') && file.toLowerCase() !== 'index.md');

  // 4. 读取文件内容并提取元数据
  const items = files.map(file => {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');

    // 提取 title (如果没有设定，默认为 "~")
    const titleMatch = content.match(/^title:\s*(.*)$/m);
    // 去掉可能的引号，并处理默认值
    const title = titleMatch ? titleMatch[1].trim().replace(/^['"]|['"]$/g, '') : '~';

    // 提取 order (如果没有设定，默认为 9999，即排在最后)
    const orderMatch = content.match(/^order:\s*(\d+)$/m);
    const order = orderMatch ? parseInt(orderMatch[1], 10) : 9999;

    return {
      text: title,
      link: `/${folderPath}/${file.replace(/\.md$/, '')}`, // 生成链接
      order: order,
      fileName: file
    };
  });

  // 5. 排序逻辑：优先按 order 升序，order 相同则按文件名排序
  items.sort((a, b) => {
    if (a.order !== b.order) {
      return a.order - b.order; // 序数小的在前
    }
    return a.fileName.localeCompare(b.fileName); // 文件名 A-Z 排序
  });

  // 6. 返回 VitePress 需要的格式 (去掉临时属性)
  return items.map(item => ({ text: item.text, link: item.link }));
}

// --------------------------------------------------
// 导出站点配置
// --------------------------------------------------
export default withMermaid(
  defineConfig({
    // --------------------------------------------------
    // 站点基础信息
    // --------------------------------------------------
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',

    // ⚠️ 重要：请确保这个 base 和你的仓库名一致
    // 如果是 Homepage_template 仓库，保持现状
    // 如果是 Develata.github.io 主站，请改为 '/'
    base: '/',
    
    cleanUrls: true, // 开启纯净链接

    // --------------------------------------------------
    // Markdown 行号与 MathJax 支持
    // --------------------------------------------------
    markdown: {
      lineNumbers: true,
      config: (md) => {
        md.use(markdownItMathjax3);
      },
    },

    // --------------------------------------------------
    // 主题配置
    // --------------------------------------------------
    themeConfig: {
      // --------------------------------------------------
      // 顶部导航栏
      // --------------------------------------------------
      nav: [
        { text: 'Home', link: '/' },
        {
          text: 'Knowledge',
          items: [
            // 这里链接到对应文件夹下的任意一个文件，或者首页(如果有)
            // 建议每个分类下放一个 index.md 或 intro.md
            { text: 'Math', link: '/knowledge/math/' },
            { text: 'Coding', link: '/knowledge/coding/' },
            { text: 'Sharing', link: '/knowledge/sharing/' },
          ],
        },
        { text: 'Blog', link: '/blog/' },
        { text: 'Books', link: '/books/' },
        { text: 'About', link: '/about/me' },
      ],

      // --------------------------------------------------
      // 侧边栏：自动生成逻辑
      // --------------------------------------------------
      sidebar: {
        // === 数学笔记 ===
        '/knowledge/math/': [
          {
            text: 'Math Notes',
            // 调用函数，自动扫描 docs/knowledge/math 目录
            items: generateSidebar('knowledge/math')
          },
        ],

        // === 编程笔记 ===
        '/knowledge/coding/': [
          {
            text: 'Coding Notes',
            items: generateSidebar('knowledge/coding')
          },
        ],

        // === 分享笔记 ===
        '/knowledge/sharing/': [
          {
            text: 'Sharing Notes',
            items: generateSidebar('knowledge/sharing')
          },
        ],

        // === 博客侧边栏 (保持手动或分类逻辑) ===
        '/blog/': [
          {
            text: '博客分类',
            items: [
              { text: '全部文章', link: '/blog/' },
              // 确保对应文件存在，否则 404
              { text: '~', link: '/blog/tags/guide/' }, 
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

      // --------------------------------------------------
      // 搜索
      // --------------------------------------------------
      search: {
        provider: 'local',
      },

      // --------------------------------------------------
      // 社交链接
      // --------------------------------------------------
      socialLinks: [
        { icon: 'github', link: 'https://github.com/Develata' },
      ],

      // --------------------------------------------------
      // 右侧大纲
      // --------------------------------------------------
      outline: {
        level: [1, 4],
        label: '目录',
      },
    },
  }),
);
