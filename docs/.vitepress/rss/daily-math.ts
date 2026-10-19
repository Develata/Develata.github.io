/** Two explicit full-text feeds; render each body once, never retain the full archive. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { boundedMath } from '../utils/bounded-math.ts';
const root = fileURLToPath(new URL('../../daily/math/', import.meta.url));
const site = 'https://develata.me';
const prefix = `${site}/daily/math/`;
const md = new MarkdownIt({ html: true, linkify: true }).use(boundedMath, { native: true });
export const DAILY_MATH_RECENT_LIMIT = 14;
interface Item { title: string; url: string; date: Date; description: string }
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');

export function writeDailyMathFeeds(outDir: string, items: Item[], render: (item: Item) => string): void {
  const sorted = [...items].sort((a, b) => b.date.getTime() - a.date.getTime() || a.url.localeCompare(b.url));
  fs.mkdirSync(path.join(outDir, 'rss'), { recursive: true });
  const feeds = [
    { name: 'daily-math.xml', label: '最近 14 期全文（默认）', limit: DAILY_MATH_RECENT_LIMIT },
    { name: 'daily-math-all.xml', label: '全部历史全文', limit: Infinity },
  ];
  const opened: number[] = [];
  try {
    for (const feed of feeds) {
      const fd = fs.openSync(path.join(outDir, 'rss', feed.name), 'w');
      opened.push(fd);
      fs.writeSync(fd, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>Develata's Space - Daily / Math - ${feed.label}</title><link>${prefix}</link>
<description>每日数学${feed.label}。</description><language>zh-CN</language>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${site}/rss/${feed.name}" rel="self" type="application/rss+xml" />
`);
    }
    for (const [index, item] of sorted.entries()) {
      // One transient rendered body/XML item. The recent feed is the exact archive prefix.
      const body = render(item);
      const entry = `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(item.url)}</link>
      <guid isPermaLink="true">${xml(item.url.replace('/daily/math/', '/knowledge/math/daily-math/'))}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      <description>${xml(item.description)}</description>
      <content:encoded><![CDATA[${body.replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>
    </item>\n`;
      feeds.forEach((feed, i) => { if (index < feed.limit) fs.writeSync(opened[i], entry); });
    }
    opened.forEach(fd => fs.writeSync(fd, '</channel></rss>\n'));
  } finally {
    opened.forEach(fd => fs.closeSync(fd));
  }
}

export function generateDailyMathRss(outDir: string): void {
  if (!fs.existsSync(root)) return;
  const files = fs.readdirSync(root).filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name));
  const items: Item[] = files.map(name => {
    const { data } = matter(fs.readFileSync(path.join(root, name), 'utf8'));
    return { title: data.title, url: `${prefix}${name.slice(0, -3)}`, date: new Date(data.date),
      description: String(data.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240) };
  });
  writeDailyMathFeeds(outDir, items, item => {
    const { content } = matter(fs.readFileSync(path.join(root, `${item.url.slice(prefix.length)}.md`), 'utf8'));
    return md.render(content).replace(/\b(href|src)="([^"]*)"/g, (match, attr, value) => {
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(value)) return match;
      return `${attr}="${xml(new URL(value.replace(/\.md(?=#|$)/, ''), item.url).href)}"`;
    });
  });
}
