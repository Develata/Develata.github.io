/**
 * @file content-modules.shared.ts
 * @description 内容模块共享注册表。只能放纯数据与纯函数，供构建配置和客户端组件共同使用。
 */
export type SidebarSortMode = 'default' | 'news';

export interface SidebarItemConfig {
  text: string;
  link?: string;
  collapsed?: boolean;
  items?: SidebarItemConfig[];
}

export interface ContentModule {
  id: string;
  root: string;
  baseUrl: string;
  search: boolean;
  randomJump: boolean;
  titleInject: boolean;
  sidebar?: {
    sortMode?: SidebarSortMode;
    appendItems?: SidebarItemConfig[];
  };
}

const blogArchiveItem: SidebarItemConfig = {
  text: '归档',
  collapsed: true,
  items: [
    { text: '2025', link: '/about/blog/archive/' },
  ],
};

export const contentModules: ContentModule[] = [
  {
    id: 'knowledge-math',
    root: 'knowledge/math/',
    baseUrl: '/knowledge/math/',
    search: true,
    randomJump: true,
    titleInject: true,
    sidebar: {},
  },
  {
    id: 'knowledge-coding',
    root: 'knowledge/coding/',
    baseUrl: '/knowledge/coding/',
    search: true,
    randomJump: true,
    titleInject: true,
    sidebar: {},
  },
  {
    id: 'knowledge-sharing',
    root: 'knowledge/sharing/',
    baseUrl: '/knowledge/sharing/',
    search: true,
    randomJump: true,
    titleInject: true,
    sidebar: {},
  },
  {
    id: 'about',
    root: 'about/',
    baseUrl: '/about/',
    search: true,
    randomJump: true,
    titleInject: true,
  },
  {
    id: 'about-blog',
    root: 'about/blog/',
    baseUrl: '/about/blog/',
    search: true,
    randomJump: true,
    titleInject: true,
    sidebar: { appendItems: [blogArchiveItem] },
  },
  {
    id: 'books',
    root: 'books/',
    baseUrl: '/books/',
    search: true,
    randomJump: true,
    titleInject: true,
    sidebar: {},
  },
  {
    id: 'games',
    root: 'games/',
    baseUrl: '/games/',
    search: true,
    randomJump: true,
    titleInject: true,
  },
  {
    id: 'news',
    root: 'news/',
    baseUrl: '/news/',
    search: false,
    randomJump: true,
    titleInject: true,
    sidebar: { sortMode: 'news' },
  },
];

export function normalizeContentPath(relativePath: string): string {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

export function findContentModule(relativePath: string): ContentModule | undefined {
  const normalizedPath = normalizeContentPath(relativePath);
  return contentModules
    .filter((module) => normalizedPath.startsWith(module.root))
    .sort((a, b) => b.root.length - a.root.length)[0];
}

export function isSearchableContent(relativePath: string): boolean {
  const normalizedPath = normalizeContentPath(relativePath);
  if (normalizedPath === 'index.md') return true;
  return findContentModule(normalizedPath)?.search ?? false;
}

export function shouldInjectTitle(relativePath: string): boolean {
  const normalizedPath = normalizeContentPath(relativePath);
  if (normalizedPath.split('/').pop()?.toLowerCase() === 'index.md') return false;
  return findContentModule(normalizedPath)?.titleInject ?? false;
}

export function isRandomJumpContent(relativePath: string): boolean {
  const normalizedPath = normalizeContentPath(relativePath);
  if (normalizedPath === 'index.md') return false;
  return findContentModule(normalizedPath)?.randomJump ?? false;
}
