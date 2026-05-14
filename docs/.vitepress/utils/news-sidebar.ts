import type { DefaultTheme } from 'vitepress';
import { getNewsEntries } from './news-index';
import type { NewsArchiveNode, NewsEntry } from './news-types';

interface MonthBucket {
  node: NewsArchiveNode;
}

interface YearBucket {
  node: NewsArchiveNode;
  months: Map<string, MonthBucket>;
}

interface CategoryBucket {
  node: NewsArchiveNode;
  years: Map<string, YearBucket>;
  latestMonthKey?: string;
}

export function resolveNewsSidebarItems(): DefaultTheme.SidebarItem[] {
  const categories = new Map<string, CategoryBucket>();
  for (const entry of getNewsEntries()) addEntry(categories, entry);

  return Array.from(categories.values()).map((bucket) => buildCategoryNode(bucket)).map(stripArchiveMeta);
}

function addEntry(categories: Map<string, CategoryBucket>, entry: NewsEntry): void {
  const category = categories.get(entry.category) ?? createCategoryBucket(entry);
  categories.set(entry.category, category);
  category.latestMonthKey ??= entry.monthKey;

  const year = category.years.get(entry.year) ?? createYearBucket(entry.year, entry.timestamp);
  category.years.set(entry.year, year);

  const month = year.months.get(entry.monthKey) ?? createMonthBucket(entry.monthKey, entry.timestamp);
  year.months.set(entry.monthKey, month);
  month.node.items ??= [];
  month.node.items.push({ text: entry.title, link: entry.url, timestamp: entry.timestamp });
}

function buildCategoryNode(bucket: CategoryBucket): NewsArchiveNode {
  // getNewsEntries() is already globally sorted newest-first, so insertion
  // order here already matches the desired category/year/month/article order.
  const items = Array.from(bucket.years.values()).map((yearBucket) => {
    const months = Array.from(yearBucket.months.values()).map((monthBucket) => ({
      ...monthBucket.node,
      collapsed: monthBucket.node.text !== bucket.latestMonthKey,
      items: monthBucket.node.items,
    }));

    return {
      ...yearBucket.node,
      collapsed: !months.some((month) => month.text === bucket.latestMonthKey),
      items: months,
    };
  });

  return { ...bucket.node, items };
}

function createCategoryBucket(entry: NewsEntry): CategoryBucket {
  return {
    node: { text: entry.category, collapsed: true, timestamp: entry.timestamp },
    years: new Map<string, YearBucket>(),
  };
}

function createYearBucket(year: string, timestamp: number): YearBucket {
  return {
    node: { text: year, collapsed: true, timestamp },
    months: new Map<string, MonthBucket>(),
  };
}

function createMonthBucket(monthKey: string, timestamp: number): MonthBucket {
  return {
    node: { text: monthKey, collapsed: true, timestamp, items: [] },
  };
}

function stripArchiveMeta(node: NewsArchiveNode): DefaultTheme.SidebarItem {
  return {
    text: node.text,
    link: node.link,
    collapsed: node.collapsed,
    items: node.items?.map(stripArchiveMeta),
  };
}
