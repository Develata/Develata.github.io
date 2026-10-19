/** News metadata -> category/year/month navigation; calendar grouping is shared. */
import type { DefaultTheme } from 'vitepress';
import { getNewsEntries } from './news-index';
import type { NewsEntry } from './news-types';
import { calendarSidebar } from './calendar-archive';

export function resolveNewsSidebarItems(): DefaultTheme.SidebarItem[] {
  const categories = new Map<string, NewsEntry[]>();
  for (const entry of getNewsEntries()) {
    const items = categories.get(entry.category) ?? [];
    categories.set(entry.category, items);
    items.push(entry);
  }
  return [...categories].map(([category, entries]) => ({
    text: category,
    latestLink: entries[0].url,
    collapsed: true,
    items: calendarSidebar(entries),
  }));
}
