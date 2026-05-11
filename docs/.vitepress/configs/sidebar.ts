/**
 * @file sidebar.ts
 * @description 侧边栏配置 (Sidebar Configuration)
 * 职责：定义不同路径下的侧边栏结构，主要通过调用 utils 中的生成函数来实现自动化构建。
 */
import type { DefaultTheme } from 'vitepress';
import { contentModules } from './content-modules.shared';
import { resolveSidebarItems } from '../utils/sidebar';

const sidebarEntries = contentModules.flatMap((module) => {
  if (!module.sidebar) return [];

  const dirPath = module.root.replace(/\/$/u, '');
  const generatedItems = resolveSidebarItems(dirPath, module.baseUrl, {
    sortMode: module.sidebar.sortMode,
  });
  const items = module.sidebar.appendItems
    ? [...generatedItems, ...module.sidebar.appendItems]
    : generatedItems;

  return [[module.baseUrl, items] as const];
});

export const sidebar: DefaultTheme.Config['sidebar'] = Object.fromEntries(sidebarEntries);
