/**
 * @file knowledge.ts
 * @description Knowledge 板块 RSS 生成器。仅在 knowledge 内部复用规则。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';

const SITE_URL = 'https://develata.me';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '../../');
const knowledgeRoot = path.join(docsRoot, 'knowledge');

export interface KnowledgeRssItem {
  title: string;
  url: string;
  date?: Date;
  description?: string;
}

interface KnowledgeSection {
  slug: string;
  title: string;
  dir: string;
}

interface KnowledgeFeed {
  title: string;
  url: string;
  description: string;
  items: KnowledgeRssItem[];
}

export interface KnowledgeFeedLink {
  title: string;
  url: string;
  description: string;
}

export interface KnowledgeRssResult {
  feeds: KnowledgeFeed[];
  items: KnowledgeRssItem[];
}

export function listKnowledgeFeedLinks(): KnowledgeFeedLink[] {
  return [
    {
      title: 'Knowledge 全部',
      url: '/rss/knowledge.xml',
      description: '数学、编程与分享笔记的更新。',
    },
    ...listSections().map((section) => ({
      title: `Knowledge / ${section.title}`,
      url: `/rss/knowledge-${section.slug}.xml`,
      description: `${section.title} 笔记更新。`,
    })),
  ];
}

export function generateKnowledgeRss(outDir: string): KnowledgeRssResult {
  const sections = listSections();
  const feeds = sections.map((section) => ({
    title: `Develata's Space - Knowledge / ${section.title}`,
    url: `/rss/knowledge-${section.slug}.xml`,
    description: `${section.title} 知识笔记更新。`,
    items: collectItems(section.dir),
  }));
  const items = feeds
    .flatMap((feed) => feed.items)
    .sort(compareDatedItems);

  const allFeed: KnowledgeFeed = {
    title: "Develata's Space - Knowledge",
    url: '/rss/knowledge.xml',
    description: 'Knowledge 板块全部更新。',
    items,
  };

  for (const feed of [allFeed, ...feeds]) {
    writeFeed(outDir, feed);
  }

  return { feeds: [allFeed, ...feeds], items };
}

function listSections(): KnowledgeSection[] {
  if (!fs.existsSync(knowledgeRoot)) return [];
  return fs.readdirSync(knowledgeRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => ({
      slug: entry.name,
      title: titleCase(entry.name),
      dir: path.join(knowledgeRoot, entry.name),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
}

function collectItems(root: string): KnowledgeRssItem[] {
  return listMarkdownFiles(root)
    .filter((file) => path.basename(file).toLowerCase() !== 'index.md')
    .map(readItem)
    .filter((item): item is KnowledgeRssItem => Boolean(item))
    .sort(compareDatedItems);
}

function readItem(file: string): KnowledgeRssItem | undefined {
  const source = fs.readFileSync(file, 'utf-8');
  const { data, content, excerpt } = matter(source, { excerpt: true });
  if (data.hideInSidebar || data.rss === false) return undefined;

  const date = parseDate(data.date);
  if (!date) return undefined;

  return {
    title: String(data.title || firstHeading(content) || stem(file)).trim(),
    url: absoluteUrl(markdownPathToUrl(file)),
    date,
    description: summarize(data.description || data.excerpt || excerpt || content),
  };
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

function writeFeed(outDir: string, feed: KnowledgeFeed): void {
  const rssDir = path.join(outDir, 'rss');
  fs.mkdirSync(rssDir, { recursive: true });
  fs.writeFileSync(path.join(rssDir, path.basename(feed.url)), renderFeed(feed), 'utf-8');
}

function renderFeed(feed: KnowledgeFeed): string {
  const items = feed.items.map(renderItem).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(feed.title)}</title>
    <link>${escapeXml(absoluteUrl('/'))}</link>
    <description>${escapeXml(feed.description)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${escapeXml(absoluteUrl(feed.url))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

function renderItem(item: KnowledgeRssItem): string {
  const pubDate = item.date ? `\n    <pubDate>${item.date.toUTCString()}</pubDate>` : '';
  const description = item.description ? `\n    <description>${escapeXml(item.description)}</description>` : '';
  return `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.url)}</link>
      <guid>${escapeXml(item.url)}</guid>${pubDate}${description}
    </item>`;
}

function markdownPathToUrl(file: string): string {
  const relative = path.relative(docsRoot, file).replace(/\\/g, '/').replace(/\.md$/u, '');
  return `/${relative}`;
}

function absoluteUrl(urlPath: string): string {
  return new URL(urlPath, SITE_URL).toString();
}

function parseDate(raw: unknown): Date | undefined {
  if (!raw) return undefined;
  const date = new Date(raw as string | number | Date);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function compareDatedItems(a: KnowledgeRssItem, b: KnowledgeRssItem): number {
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

function stem(file: string): string {
  return path.basename(file, '.md');
}

function titleCase(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
