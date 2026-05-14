import type { DefaultTheme } from 'vitepress';

type SidebarItem = DefaultTheme.SidebarItem;

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
    if (!containsCategoryLink(item, ctx.category)) {
      return {
        text: item.text,
        link: findLatestArticleLink(item),
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

function findLatestArticleLink(item: SidebarItem): string | undefined {
  if (item.link) return item.link;
  for (const child of item.items ?? []) {
    const link = findLatestArticleLink(child);
    if (link) return link;
  }
  return undefined;
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

function containsCategoryLink(item: SidebarItem, category: string): boolean {
  const prefix = `/news/${category}/`;
  if (item.link?.startsWith(prefix)) return true;
  return !!item.items?.some((child) => containsCategoryLink(child, category));
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
    link: articles[0].link,
    collapsed: true,
  };
}
