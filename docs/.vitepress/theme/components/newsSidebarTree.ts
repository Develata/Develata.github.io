import type { DefaultTheme } from 'vitepress';

type SidebarItem = DefaultTheme.SidebarItem;
type SidebarItemWithLatestLink = SidebarItem & { latestLink?: string };

interface NewsPageContext {
  category: string;
  year: string;
  monthKey: string;
}

export function isNewsArticlePath(relativePath: string): boolean {
  const parts = relativePath.split('/');
  return parts[0] === 'news' && parts.length >= 4 && parts.at(-1)?.toLowerCase() !== 'index.md';
}

export function buildNewsArticleSidebar(items: SidebarItem[], relativePath: string): SidebarItem[] {
  const ctx = resolveNewsPageContext(relativePath);
  if (!ctx) return items;

  return items.map((item) => {
    if (!isCurrentCategory(item, ctx.category)) {
      return {
        text: item.text,
        link: getLatestLink(item),
        collapsed: true,
      };
    }

    if (!item.items?.length) return { ...item, collapsed: false };

    return {
      text: item.text,
      collapsed: false,
      items: item.items
        .filter((yearNode) => yearNode.items?.length)
        .map((yearNode) => buildYearNode(yearNode, ctx))
        .filter(Boolean) as SidebarItem[],
    };
  });
}

function resolveNewsPageContext(relativePath: string): NewsPageContext | null {
  const parts = relativePath.split('/');
  if (!isNewsArticlePath(relativePath)) return null;

  const category = parts[1];
  const year = parts[2];
  const stem = parts.at(-1)?.replace(/\.md$/u, '') ?? '';
  const month = stem.slice(4, 6);
  if (!category || !year || !/^\d{2}$/u.test(month)) return null;

  return {
    category,
    year,
    monthKey: `${year}-${month}`,
  };
}

function isCurrentCategory(item: SidebarItem, category: string): boolean {
  const prefix = `/news/${category}/`;
  return getLatestLink(item)?.startsWith(prefix) ?? false;
}

function buildYearNode(yearNode: SidebarItem, ctx: NewsPageContext): SidebarItem | null {
  const months = yearNode.items
    ?.map((monthNode) => buildMonthNode(monthNode, ctx))
    .filter(Boolean) as SidebarItem[] | undefined;

  if (!months?.length) return null;

  return {
    text: yearNode.text,
    collapsed: yearNode.text !== ctx.year,
    items: months,
  };
}

function buildMonthNode(monthNode: SidebarItem, ctx: NewsPageContext): SidebarItem | null {
  const articles = monthNode.items?.filter((article) => article.link);
  if (!articles?.length || !monthNode.text) return null;

  if (monthNode.text === ctx.monthKey) {
    return {
      text: monthNode.text,
      collapsed: false,
      items: articles,
    };
  }

  return {
    text: monthNode.text,
    link: getLatestLink(monthNode) ?? articles[0].link,
    collapsed: true,
  };
}

function getLatestLink(item: SidebarItem): string | undefined {
  return (item as SidebarItemWithLatestLink).latestLink ?? item.link;
}
