import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { NewsCardItem, NewsEntry } from './news-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const docsRoot = path.resolve(__dirname, '../../');
const newsRoot = path.resolve(docsRoot, 'news');
let cachedFilesKey = '';
let cachedEntries: NewsEntry[] = [];
const cachedEntryMap = new Map<string, { mtimeMs: number; entry: NewsEntry }>();

export function getNewsEntries(watchedFiles?: string[]): NewsEntry[] {
  const files = resolveNewsFiles(watchedFiles);
  const filesKey = files.join('|');
  let isDirty = filesKey !== cachedFilesKey;
  pruneDeletedEntries(files);

  // Reuse cached entries for unchanged files so editing one article does not
  // trigger a full re-parse of the entire news corpus.
  const nextEntries: NewsEntry[] = [];
  for (const file of files) {
    const mtimeMs = fs.statSync(file).mtimeMs;
    const cached = cachedEntryMap.get(file);
    if (!cached || cached.mtimeMs !== mtimeMs) {
      cachedEntryMap.set(file, { mtimeMs, entry: readNewsEntry(file) });
      isDirty = true;
    }
    nextEntries.push(cachedEntryMap.get(file)!.entry);
  }

  if (!isDirty) return cachedEntries;

  cachedFilesKey = filesKey;
  cachedEntries = nextEntries.sort(compareEntries);
  return cachedEntries;
}

export function getRecentNewsCards(limit = 20, watchedFiles?: string[]): NewsCardItem[] {
  return getNewsEntries(watchedFiles).slice(0, limit).map(({ title, url, excerpt, timestamp, dateLabel, day, monthLabel }) => ({
    title,
    url,
    excerpt,
    timestamp,
    dateLabel,
    day,
    monthLabel,
  }));
}

function resolveNewsFiles(watchedFiles?: string[]): string[] {
  const files = watchedFiles?.length ? watchedFiles.map(toAbsoluteFile) : collectNewsFiles(newsRoot);
  return files
    .filter((file) => file.endsWith('.md'))
    .filter((file) => path.basename(file).toLowerCase() !== 'index.md')
    .sort();
}

function toAbsoluteFile(file: string): string {
  return path.isAbsolute(file) ? file : path.resolve(docsRoot, file);
}

function collectNewsFiles(root: string): string[] {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const entryPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectNewsFiles(entryPath));
      continue;
    }
    if (entry.isFile()) files.push(entryPath);
  }
  return files;
}

function pruneDeletedEntries(files: string[]): void {
  const activeFiles = new Set(files);
  for (const cachedFile of cachedEntryMap.keys()) {
    if (!activeFiles.has(cachedFile)) cachedEntryMap.delete(cachedFile);
  }
}

function readNewsEntry(filePath: string): NewsEntry {
  const relativePath = path.relative(docsRoot, filePath).replace(/\\/g, '/');
  const stem = path.basename(filePath, '.md');
  const { data, content } = matter(fs.readFileSync(filePath, 'utf-8'));
  const calendarDate = resolveCalendarDate(data.date, stem);
  const timestamp = Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day);

  return {
    title: resolveTitle(data.title, content, stem),
    url: `/${relativePath.replace(/\.md$/u, '')}`,
    excerpt: resolveExcerpt(data.excerpt, content),
    timestamp,
    dateLabel: formatUtcDate(timestamp, 'zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }),
    day: calendarDate.day,
    monthLabel: formatUtcDate(timestamp, 'en-US', { month: 'short' }),
    year: String(calendarDate.year),
    monthKey: `${calendarDate.year}-${String(calendarDate.month).padStart(2, '0')}`,
    category: relativePath.split('/')[1] ?? 'news',
  };
}

function resolveCalendarDate(raw: unknown, stem: string): { year: number; month: number; day: number } {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return {
      year: raw.getUTCFullYear(),
      month: raw.getUTCMonth() + 1,
      day: raw.getUTCDate(),
    };
  }

  const rawText = String(raw ?? '').trim();
  const matchedDate = rawText.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/u);
  if (matchedDate) {
    return {
      year: Number(matchedDate[1]),
      month: Number(matchedDate[2]),
      day: Number(matchedDate[3]),
    };
  }

  const parsed = new Date(rawText);
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getUTCFullYear(),
      month: parsed.getUTCMonth() + 1,
      day: parsed.getUTCDate(),
    };
  }

  const fallback = stem.match(/^(\d{4})(\d{2})(\d{2})$/u);
  if (fallback) {
    return {
      year: Number(fallback[1]),
      month: Number(fallback[2]),
      day: Number(fallback[3]),
    };
  }

  return { year: 1970, month: 1, day: 1 };
}

function formatUtcDate(timestamp: number, locale: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(timestamp);
}

function resolveTitle(rawTitle: unknown, content: string, stem: string): string {
  const title = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  if (title) return title;
  const heading = content.match(/^\s*#\s+(.+)\s*$/mu)?.[1]?.trim();
  return heading || stem;
}

function resolveExcerpt(rawExcerpt: unknown, content: string): string | undefined {
  const excerpt = typeof rawExcerpt === 'string' ? rawExcerpt.trim() : '';
  if (excerpt) return excerpt;
  const paragraph = content
    .split(/\r?\n\r?\n/u)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk && !chunk.startsWith('#'))
    .map(stripMarkdown)
    .find(Boolean);
  return paragraph ? paragraph.slice(0, 140) : undefined;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/^>\s?/gmu, '')
    .replace(/^#{1,6}\s+/gmu, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/<[^>]+>/gu, ' ')
    .replace(/[*_`~|-]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function compareEntries(a: NewsEntry, b: NewsEntry): number {
  const timeDiff = b.timestamp - a.timestamp;
  return timeDiff !== 0 ? timeDiff : b.url.localeCompare(a.url);
}
