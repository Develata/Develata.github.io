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
            { text: 'Math', link: '/knowledge/math/' },
            { text: 'Coding', link: '/knowledge/coding/' },
          ],
        },
        { text: 'Blog', link: '/blog/' },
        { text: 'Books', link: '/books/' },
        { text: 'About', link: '/about/' },
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
        { icon: 'github', link: 'https://github.com/placeholder' },
      ],
    },
  }),
);