/**
 * @file index.ts
 * @description RSS 构建入口与订阅链接清单。
 */
import type { SiteConfig } from 'vitepress';
import { generateAllRss } from './all';
import { generateBlogRss } from './blog';
import { generateBooksRss } from './books';
import { generateKnowledgeRss, listKnowledgeFeedLinks } from './knowledge';
import { generateNewsRss } from './news';

export interface RssFeedLink {
  title: string;
  url: string;
  description: string;
}

export function generateRssFeeds(siteConfig: SiteConfig): void {
  const outDir = siteConfig.outDir;
  const knowledge = generateKnowledgeRss(outDir);
  const blog = generateBlogRss(outDir);
  const news = generateNewsRss(outDir);
  const books = generateBooksRss(outDir);

  generateAllRss(outDir, [
    knowledge.items,
    blog,
    news,
    books,
  ]);
}

export function listRssFeeds(): RssFeedLink[] {
  return [
    {
      title: '全部更新',
      url: '/rss/all.xml',
      description: '聚合 Knowledge、Blog、News 与 Books 的全部订阅。',
    },
    ...listKnowledgeFeedLinks(),
    {
      title: 'Blog',
      url: '/rss/blog.xml',
      description: '个人博客文章更新。',
    },
    {
      title: 'News',
      url: '/rss/news.xml',
      description: '新闻日汇总更新。',
    },
    {
      title: 'Books',
      url: '/rss/books.xml',
      description: '阅读笔记与摘录更新。',
    },
  ];
}
