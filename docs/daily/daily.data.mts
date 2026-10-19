/** Only latest metadata is serialized; no article modules or full archive. */
import { defineLoader } from 'vitepress';
import { journalEntries } from '../.vitepress/daily/journal';
import { getRecentNewsCards } from '../.vitepress/utils/news-index';
export default defineLoader({
  watch: ['news/**/*.md', 'daily/math/manifest.json'],
  load() { return { news: getRecentNewsCards(5).map(item => ({ title: item.displayTitle, url: item.url })), math: journalEntries().slice(0, 5) }; },
});
export declare const data: { news: { title: string; url: string }[]; math: { title: string; url: string }[] };
