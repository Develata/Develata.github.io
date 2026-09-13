/**
 * @file all.ts
 * @description 全站 RSS 聚合生成器。读取已生成的分板块 XML 并合并 item。
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://develata.me';
const SOURCE_FEEDS = ['knowledge.xml', 'blog.xml', 'news.xml', 'books.xml'];

interface RssItem {
  xml: string;
  url: string;
  date?: Date;
}

export function generateAllRss(outDir: string): RssItem[] {
  const rssDir = path.join(outDir, 'rss');
  const items = SOURCE_FEEDS
    .flatMap((fileName) => readFeedItems(path.join(rssDir, fileName)))
    .sort(compareItems);

  fs.mkdirSync(rssDir, { recursive: true });
  fs.writeFileSync(path.join(rssDir, 'all.xml'), renderFeed(items), 'utf-8');
  return items;
}

function readFeedItems(filePath: string): RssItem[] {
  if (!fs.existsSync(filePath)) return [];
  return [...fs.readFileSync(filePath, 'utf-8').matchAll(/<item>[\s\S]*?<\/item>/g)]
    .map((match) => parseItem(match[0]));
}

function parseItem(xml: string): RssItem {
  const url = unescapeXml(xml.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? '');
  const rawDate = xml.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();
  const date = rawDate ? parseDate(rawDate) : undefined;
  return { xml, url, date };
}

function renderFeed(items: RssItem[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Develata's Space - All</title>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <description>Develata's Space 全站订阅聚合。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(absoluteUrl('/rss/all.xml'))}" rel="self" type="application/rss+xml" />
${items.map((item) => item.xml).join('\n')}
  </channel>
</rss>
`;
}

function compareItems(a: RssItem, b: RssItem): number {
  if (a.date && b.date) {
    return b.date.getTime() - a.date.getTime() || a.url.localeCompare(b.url);
  }
  if (a.date && !b.date) return -1;
  if (!a.date && b.date) return 1;
  return a.url.localeCompare(b.url);
}

function parseDate(raw: string): Date | undefined {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function absoluteUrl(urlPath: string): string {
  return new URL(urlPath, SITE_URL).toString();
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function unescapeXml(value: string): string {
  return value
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replaceAll('&gt;', '>')
    .replaceAll('&lt;', '<')
    .replaceAll('&amp;', '&');
}
