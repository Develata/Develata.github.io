/**
 * @file sidebar.ts
 * @description 侧边栏配置 (Sidebar Configuration)
 * 职责：定义不同路径下的侧边栏结构，主要通过调用 utils 中的生成函数来实现自动化构建。
 */
import type { DefaultTheme } from 'vitepress';
import { resolveSidebarItems } from '../utils/sidebar';

export const sidebar: DefaultTheme.Config['sidebar'] = {
  // 自动解析 knowledge/math,coding,sharing 目录
  '/knowledge/math/': resolveSidebarItems('knowledge/math', '/knowledge/math/'),
  '/knowledge/coding/': resolveSidebarItems('knowledge/coding', '/knowledge/coding/'),
  '/knowledge/sharing/': resolveSidebarItems('knowledge/sharing', '/knowledge/sharing/'),

  // 自动解析 books 目录
  '/books/': resolveSidebarItems('books', '/books/'),

  // 自动解析 news 目录
  '/news/': resolveSidebarItems('news', '/news/', { isNewsRoot: true }),

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
};
