import { defineConfig } from 'vitepress';
import markdownItMathjax3 from 'markdown-it-mathjax3';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    lang: 'zh-CN',
    title: "Develata's Space",
    description: 'Math & Code',
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
            { text: 'Math', link: '/knowledge/math/intro' },
            { text: 'Coding', link: '/knowledge/coding/setup' },
          ],
        },
        { text: 'Blog', link: '/blog/list' },
        { text: 'Books', link: '/books/index' },
        { text: 'About', link: '/about/me' },
      ],
      sidebar: {
        '/knowledge/math/': [
          {
            text: 'Math Notes',
            items: [
              { text: 'Introduction', link: '/knowledge/math/intro' },
            ],
          },
        ],
        '/knowledge/coding/': [
          {
            text: 'Coding Notes',
            items: [
              { text: 'Setup', link: '/knowledge/coding/setup' },
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
    },
  }),
);