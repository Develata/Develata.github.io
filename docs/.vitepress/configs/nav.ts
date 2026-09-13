/**
 * @file nav.ts
 * @description 顶部导航栏配置 (Navigation Configuration)
 * 职责：定义网站顶部的菜单结构 (Home, Knowledge, News, etc.)。
 */
import type { DefaultTheme } from 'vitepress';

export const nav: DefaultTheme.Config['nav'] = [
  { text: 'Home', link: '/' },
  {
    text: 'Knowledge',
    items: [
      { text: 'Math', link: '/knowledge/math/' },
      { text: 'Coding', link: '/knowledge/coding/' },
      { text: 'CLI', link: '/knowledge/cli/' },
      { text: 'Sharing', link: '/knowledge/sharing/' },
      { text: 'Repo-AI-Analy', link: 'https://develata.github.io/Repo-AI-Analysis/' },
    ],
  },
  { text: 'News', link: '/news/' },
  { text: 'Books', link: '/books/' },
  { text: 'Games', link: '/games/' },
  {
    text: 'About',
    items: [
      { text: 'Me', link: '/about/me' },
      { text: 'Blog', link: '/about/blog/' },
      { text: 'RSS', link: '/about/rss' },
    ]
  },
];
