/**
 * @file all.ts
 * @description 全站 RSS 聚合生成器。只聚合各板块 item，不承载扫描逻辑。
 */
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://develata.me';

interface RssItem {
  title: string;
  url: string;
  date?: Date;
  description?: string;
}

export function generateAllRss(outDir: string, groups: RssItem[][]): RssItem[] {
  const items = groups
    .flat()
    .sort(compareItems);

  writeFeed(outDir, items);
  return items;
}

function writeFeed(outDir: string, items: RssItem[]): void {
  const rssDir = path.join(outDir, 'rss');
  fs.mkdirSync(rssDir, { recursive: true });
  fs.writeFileSync(path.join(rssDir, 'all.xml'), renderFeed(items), 'utf-8');
}

function renderFeed(items: RssItem[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Develata's Space - All</title>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <description>Develata's Space 全站订阅聚合。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(absoluteUrl('/rss/all.xml'))}" rel="self" type="application/rss+xml" />
${items.map(renderItem).join('\n')}
  </channel>
</rss>
`;
}

function renderItem(item: RssItem): string {
  const pubDate = item.date ? `\n      <pubDate>${item.date.toUTCString()}</pubDate>` : '';
  const description = item.description ? `\n      <description>${escapeXml(item.description)}</description>` : '';
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid>${escapeXml(item.url)}</guid>${pubDate}${description}
    </item>`;
}

function compareItems(a: RssItem, b: RssItem): number {
  const dateDiff = (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0);
  return dateDiff || a.url.localeCompare(b.url);
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
