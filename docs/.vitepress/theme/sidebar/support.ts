import type { DefaultTheme } from 'vitepress';

type SidebarItem = DefaultTheme.SidebarItem;
type SidebarConfig = DefaultTheme.Config['sidebar'];

export function getSidebarItems(sidebar: SidebarConfig, relativePath: string): SidebarItem[] {
  if (!sidebar) return [];
  if (Array.isArray(sidebar)) return addBase(sidebar);

  const path = ensureStartingSlash(relativePath);
  const dir = Object.keys(sidebar)
    .sort((a, b) => b.split('/').length - a.split('/').length)
    .find((key) => path.startsWith(ensureStartingSlash(key)));

  const resolved = dir ? sidebar[dir] : [];
  if (Array.isArray(resolved)) return addBase(resolved);
  return addBase(resolved.items, resolved.base);
}

export function getSidebarGroups(items: SidebarItem[]): SidebarItem[] {
  const groups: SidebarItem[] = [];
  let lastGroupIndex = 0;

  for (const item of items) {
    if (item.items) {
      lastGroupIndex = groups.push(item);
      continue;
    }

    if (!groups[lastGroupIndex]) {
      groups.push({ items: [] });
    }

    groups[lastGroupIndex].items ??= [];
    groups[lastGroupIndex].items?.push(item);
  }

  return groups;
}

function ensureStartingSlash(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function addBase(items: SidebarItem[], inheritedBase?: string): SidebarItem[] {
  return items.map((rawItem) => {
    const item = { ...rawItem };
    const base = item.base || inheritedBase;
    if (base && item.link) item.link = `${base}${item.link}`;
    if (item.items) item.items = addBase(item.items, base);
    return item;
  });
}
