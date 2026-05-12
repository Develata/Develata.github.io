/**
 * @file blog.ts
 * @description Blog 板块 RSS 生成器。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const SITE_URL = 'https://develata.me';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '../../');
const blogRoot = path.join(docsRoot, 'about/blog');

export interface BlogRssItem {
  title: string;
  url: string;
  date?: Date;
  description?: string;
}

export function generateBlogRss(outDir: string): BlogRssItem[] {
  const items = listMarkdownFiles(blogRoot)
    .filter((file) => {
      const relative = path.relative(blogRoot, file).replace(/\\/g, '/');
      return path.basename(file).toLowerCase() !== 'index.md' && !relative.startsWith('archive/');
    })
    .map(readItem)
    .filter((item): item is BlogRssItem => Boolean(item))
    .sort(compareItems);

  writeFeed(outDir, items);
  return items;
}

function readItem(file: string): BlogRssItem | undefined {
  const { data, content, excerpt } = matter(fs.readFileSync(file, 'utf-8'), { excerpt: true });
  if (data.rss === false) return undefined;
  const date = parseDate(data.date);
  if (!date) return undefined;

  return {
    title: String(data.title || firstHeading(content) || path.basename(file, '.md')).trim(),
    url: absoluteUrl(markdownPathToUrl(file)),
    date,
    description: summarize(data.description || data.excerpt || excerpt || content),
  };
}

function writeFeed(outDir: string, items: BlogRssItem[]): void {
  const rssDir = path.join(outDir, 'rss');
  fs.mkdirSync(rssDir, { recursive: true });
  fs.writeFileSync(path.join(rssDir, 'blog.xml'), renderFeed(items), 'utf-8');
}

function renderFeed(items: BlogRssItem[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Develata's Space - Blog</title>
    <link>${escapeXml(absoluteUrl('/about/blog/'))}</link>
    <description>个人博客文章更新。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(absoluteUrl('/rss/blog.xml'))}" rel="self" type="application/rss+xml" />
${items.map(renderItem).join('\n')}
  </channel>
</rss>
`;
}

function renderItem(item: BlogRssItem): string {
  const description = item.description ? `\n    <description>${escapeXml(item.description)}</description>` : '';
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid>${escapeXml(item.url)}</guid>
      <pubDate>${item.date?.toUTCString()}</pubDate>${description}
    </item>`;
}

function listMarkdownFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const result: string[] = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const next = path.join(root, entry.name);
    if (entry.isDirectory()) result.push(...listMarkdownFiles(next));
    if (entry.isFile() && entry.name.endsWith('.md')) result.push(next);
  }
  return result;
}

function markdownPathToUrl(file: string): string {
  return `/${path.relative(docsRoot, file).replace(/\\/g, '/').replace(/\.md$/u, '')}`;
}

function absoluteUrl(urlPath: string): string {
  return new URL(urlPath, SITE_URL).toString();
}

function parseDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;
  const date = new Date(raw as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function compareItems(a: BlogRssItem, b: BlogRssItem): number {
  return (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.url.localeCompare(b.url);
}

function summarize(value: unknown): string {
  return String(value)
    .replace(/^---[\s\S]*?---/u, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#\s+.+$/gm, ' ')
    .replace(/[#>*_`[\]()]|!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 240);
}

function firstHeading(content: string): string | undefined {
  return content.match(/^\s*#\s+(.+)\s*$/m)?.[1]?.trim();
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
