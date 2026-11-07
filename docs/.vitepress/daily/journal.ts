/** Registered journal metadata adapter. No article-body loading for navigation. */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { calendarSidebar } from './calendar.ts';
import { websiteTitle } from '../../../scripts/daily-math.mjs';

export function journalEntries() {
  const file = fileURLToPath(new URL('../../daily/math/manifest.json', import.meta.url));
  if (!fs.existsSync(file)) return [];
  const records: { date: string; title: string }[] = JSON.parse(fs.readFileSync(file, 'utf8'));
  return records.map(r => ({
    title: websiteTitle(r.date, r.title), url: `/daily/math/${r.date}`,
    timestamp: Date.parse(`${r.date}T00:00:00+08:00`),
    year: r.date.slice(0, 4), monthKey: r.date.slice(0, 7),
  })).sort((a, b) => b.timestamp - a.timestamp);
}
export function journalSidebar() { return calendarSidebar(journalEntries()); }
