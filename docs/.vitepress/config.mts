// --------------------------------------------------
// 导入 VitePress 工具与插件
// --------------------------------------------------
import { defineConfig } from 'vitepress';
import markdownItMathjax3 from 'markdown-it-mathjax3';
import { withMermaid } from 'vitepress-plugin-mermaid';

// --------------------------------------------------
// 导出站点配置（集成 Mermaid 支持）
// --------------------------------------------------
export default withMermaid(
  defineConfig({
    // --------------------------------------------------
    // 站点基础信息
    // --------------------------------------------------
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',

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
    // 主题配置（导航、侧栏、搜索、社交）
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
            { text: 'Math', link: '/knowledge/math/intro' },
            { text: 'Coding', link: '/knowledge/coding/setup' },
          ],
        },
        { text: 'Blog', link: '/blog/index' },
        { text: 'Books', link: '/books/index' },
        { text: 'About', link: '/about/me' },
      ],

      // --------------------------------------------------
      // 侧边栏：按路径上下文动态切换
      // --------------------------------------------------
      sidebar: {
        // --------------------------------------------------
        // Knowledge > Math 侧边栏
        // --------------------------------------------------
        '/knowledge/math/': [
          {
            text: 'Math Notes',
            items: [
              { text: 'Introduction', link: '/knowledge/math/intro' },
            ],
          },
        ],
        // --------------------------------------------------
        // Knowledge > Coding 侧边栏
        // --------------------------------------------------
        '/knowledge/coding/': [
          {
            text: 'Coding Notes',
            items: [
              { text: 'Setup', link: '/knowledge/coding/setup' },
            ],
          },
        ],
        // --------------------------------------------------
        // Blog 区域侧边栏
        // --------------------------------------------------
        '/blog/': [
          {
            text: '博客分类',
            items: [
              { text: '全部文章', link: '/blog/' },
              { text: '有用的指南', link: '/blog/tags/guide/' },
              //{ text: '生活感悟', link: '/blog/tags/life/' },
            ],
          },
          {
            text: '归档',
            items: [
              { text: '2025 年', link: '/blog/archive/' },
            ],
          },
        ],
      },

      // --------------------------------------------------
      // 内置搜索（本地索引）
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
      // 右侧大纲：显示 H1-H4
      // --------------------------------------------------
      outline: {
        level: [1, 4],
        label: '目录',
      },
    },
  }),
);