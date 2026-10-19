/** Journal source adapter: all identities, original dates, only five rendered bodies. */
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
export const DAILY_MATH_FULL_TEXT_LIMIT = 5;
interface Item { title: string; url: string; date?: Date; description?: string; contentHtml?: string }
export function applyDailyMathWindow(items: Item[], render: (item: Item) => string) {
  items.filter(item => item.url.startsWith(prefix))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.url.localeCompare(b.url))
    .forEach((item, index) => {
      if (index < DAILY_MATH_FULL_TEXT_LIMIT) item.contentHtml = render(item);
      else delete item.contentHtml;
    });
}
const xml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
export function generateDailyMathRss(outDir: string): Item[] {
  if (!fs.existsSync(root)) return [];
  const files = fs.readdirSync(root).filter(name => /^\d{4}-\d{2}-\d{2}\.md$/.test(name)).sort().reverse();
  const items: Item[] = files.map(name => {
    const { data } = matter(fs.readFileSync(path.join(root, name), 'utf8'));
    return { title: data.title, url: `${prefix}${name.slice(0, -3)}`, date: new Date(data.date),
      description: String(data.description).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240) };
  });
  applyDailyMathWindow(items, item => {
    const { content } = matter(fs.readFileSync(path.join(root, `${item.url.slice(prefix.length)}.md`), 'utf8'));
    return md.render(content).replace(/\b(href|src)="([^"]*)"/g, (match, attr, value) => {
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(value)) return match;
      return `${attr}="${xml(new URL(value.replace(/\.md(?=#|$)/, ''), item.url).href)}"`;
    });
  });
  const body = items.map(item => `    <item>
      <title>${xml(item.title)}</title>
      <link>${xml(item.url)}</link>
      <guid isPermaLink="true">${xml(item.url.replace('/daily/math/', '/knowledge/math/daily-math/'))}</guid>
      <pubDate>${item.date!.toUTCString()}</pubDate>
      <description>${xml(item.description!)}</description>${item.contentHtml ? `\n      <content:encoded><![CDATA[${item.contentHtml.replaceAll(']]>', ']]]]><![CDATA[>')}]]></content:encoded>` : ''}
    </item>`).join('\n');
  fs.mkdirSync(path.join(outDir, 'rss'), { recursive: true });
  fs.writeFileSync(path.join(outDir, 'rss/daily-math.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
<channel><title>Develata's Space - Daily / Math</title><link>${prefix}</link>
<description>每日数学最近 5 篇全文及全部历史摘要与原文链接。</description><language>zh-CN</language>
<atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${site}/rss/daily-math.xml" rel="self" type="application/rss+xml" />
${body}
</channel></rss>\n`);
  return items;
}
