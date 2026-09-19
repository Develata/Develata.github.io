/**
 * @file index.ts
 * @description RSS 构建入口与订阅链接清单。
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { ViteDevServer } from 'vite';
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
  generateRssFeedsToDir(siteConfig.outDir);
}

export function generateRssFeedsToDir(outDir: string): void {
  generateKnowledgeRss(outDir);
  generateBlogRss(outDir);
  generateNewsRss(outDir);
  generateBooksRss(outDir);
  generateAllRss(outDir);
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

export function rssDevServer() {
  return {
    name: 'develata-rss-dev-server',
    apply: 'serve' as const,
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        const fileName = path.posix.basename(pathname);
        if (pathname !== `/rss/${fileName}` || !fileName.endsWith('.xml')) {
          next();
          return;
        }

        const outDir = path.join(os.tmpdir(), 'develata-vitepress-rss-dev');
        generateRssFeedsToDir(outDir);

        const filePath = path.join(outDir, 'rss', fileName);
        if (!fs.existsSync(filePath)) {
          next();
          return;
        }

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
        res.end(fs.readFileSync(filePath, 'utf-8'));
      });
    },
  };
}
