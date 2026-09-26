/**
 * @file randomJump.data.ts
 * @description 随机跳转链接池 (VitePress build-time data loader)。
 * 职责：构建时从内容模块注册表收集可随机跳转的页面 URL，只把 URL 字符串数组交给客户端。
 * 不变量：
 * 1. 只扫描 `randomJump: true` 的模块根目录，news 等排除模块不会进入客户端包；
 * 2. 最终以 `isRandomJumpContent` 为准过滤（处理嵌套模块，例如 about/ 与 about/blog/）；
 * 3. URL 形如 `/knowledge/math/foo`，目录 index 对应 `/dir/`，不含 base（由调用方 withBase）。
 */
import path from 'node:path';
import type { SiteConfig } from 'vitepress';
import {
  contentModules,
  isRandomJumpContent,
  normalizeContentPath,
} from '../../configs/content-modules.shared';

declare const data: string[];
export { data };

const DOCS_FROM_HERE = '../../../';

export default {
  // watch 的 glob 相对本文件解析。
  watch: contentModules
    .filter((module) => module.randomJump)
    .map((module) => `${DOCS_FROM_HERE}${module.root}**/*.md`),

  load(watchedFiles: string[]): string[] {
    const { srcDir } = (globalThis as { VITEPRESS_CONFIG?: SiteConfig }).VITEPRESS_CONFIG!;
    const urls = new Set<string>();
    for (const file of watchedFiles) {
      const relativePath = normalizeContentPath(path.relative(srcDir, file));
      if (!isRandomJumpContent(relativePath)) continue;
      urls.add(`/${relativePath}`.replace(/\.md$/, '').replace(/\/index$/, '/'));
    }
    return [...urls].sort();
  },
};
