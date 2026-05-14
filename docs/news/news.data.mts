/**
 * @file news.data.mts
 * @description News 首页数据加载器。
 * 不变量：
 * 1. 首页始终只渲染最近 20 条；
 * 2. 元数据统一来自共享新闻索引模块，避免重复解析；
 * 3. 旧新闻访问入口完全交给侧边栏归档。
 */
import { defineLoader } from 'vitepress';
import { getRecentNewsCards } from '../.vitepress/utils/news-index';
import type { NewsCardItem } from '../.vitepress/utils/news-types';

declare const data: NewsCardItem[];
export { data };

export default defineLoader({
  watch: 'news/**/*.md',
  load(watchedFiles): NewsCardItem[] {
    return getRecentNewsCards(20, watchedFiles);
  },
});
