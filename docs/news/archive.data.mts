/** News adapter: full metadata archive, separate from the latest-20 cards. */
import { defineLoader } from 'vitepress';
import { getNewsEntries } from '../.vitepress/utils/news-index';
import { calendarArchive } from '../.vitepress/daily/calendar';
export default defineLoader({ watch: 'news/**/*.md', load() {
  return calendarArchive(getNewsEntries().map(({ title, category, url, year, monthKey, timestamp }) => ({ title: `${category} · ${title}`, url, year, monthKey, timestamp })));
} });
export declare const data: ReturnType<typeof calendarArchive>;
