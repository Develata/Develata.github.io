/**
 * @file sidebar.ts
 * @description 侧边栏生成工具 (Sidebar Generation Utility)
 * 职责：
 * 1. 扫描指定目录下的 Markdown 文件和子目录。
 * 2. 读取 Frontmatter 元数据 (title, order, date)。
 * 3. 按照自定义规则 (Order -> Date -> Name) 对菜单项进行排序。
 * 4. 支持 News 栏目的特殊倒序和自动展开逻辑。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { DefaultTheme } from 'vitepress';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// docs/.vitepress/utils -> docs
export const docsRoot = path.resolve(__dirname, '../../');

/**
 * 侧边栏条目接口（扩展内部属性用于排序）
 */
interface SidebarItem extends DefaultTheme.SidebarItem {
  order?: number;
  name?: string; // 用于文件名排序
  date?: number; // 用于日期排序 (时间戳)
}

interface SidebarOptions {
  isNewsRoot?: boolean;
}

/**
 * 递归生成侧边栏条目
 */
export function resolveSidebarItems(dirPath: string, baseUrl: string, options: SidebarOptions = {}): SidebarItem[] {
  const absolutePath = path.resolve(docsRoot, dirPath);
  if (!fs.existsSync(absolutePath)) return [];

  const entries = fs.readdirSync(absolutePath, { withFileTypes: true });

  const items: SidebarItem[] = [];

  for (const entry of entries) {
    // 1. 过滤系统文件和隐藏文件
    if (entry.name.startsWith('.')) continue;

    const entryPath = path.join(absolutePath, entry.name);

    // 1. 处理文件夹 (分类)
    if (entry.isDirectory()) {
      // 使用 posix.join 确保 URL 使用正斜杠
      const nextBaseUrl = path.posix.join(baseUrl, entry.name, '/');
      const children = resolveSidebarItems(path.join(dirPath, entry.name), nextBaseUrl, options);

      if (children.length === 0) continue;

      let title = entry.name;
      let order = Number.POSITIVE_INFINITY;
      let date = 0;

      // 读取文件夹下的 index.md 获取元数据
      const indexFile = path.join(entryPath, 'index.md');
      if (fs.existsSync(indexFile)) {
        const fileContent = fs.readFileSync(indexFile, 'utf-8');
        const { data, content } = matter(fileContent);

        if (data.title) {
          title = data.title;
        } else {
          // 尝试从内容中提取第一个 # 标题
          const match = content.match(/^\s*#\s+(.+)\s*$/m);
          if (match) title = match[1].trim();
        }

        if (typeof data.order === 'number') order = data.order;
        if (data.date) {
          const d = new Date(data.date);
          if (!isNaN(d.getTime())) date = d.getTime();
        }
      }

      items.push({
        text: title,
        collapsed: true,
        items: children,
        order,
        name: entry.name,
        date
      });
    }

    // 2. 处理 Markdown 文件 (文档)
    else if (entry.isFile() && entry.name.endsWith('.md')) {
      if (entry.name.toLowerCase() === 'index.md') continue;

      try {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        const { data, content } = matter(fileContent);

        // 如果 Frontmatter 中设置了 hideInSidebar: true，则跳过
        if (data.hideInSidebar) continue;

        const stem = entry.name.replace(/\.md$/u, '');

        let date = 0;
        if (data.date) {
          const d = new Date(data.date);
          if (!isNaN(d.getTime())) date = d.getTime();
        }

        // 优先使用 Frontmatter 中的 title
        let title = '';
        if (data && data.title) {
          title = String(data.title).trim();
        }

        // 如果没有 Frontmatter title，尝试从内容中提取第一个 # 标题
        if (!title) {
          const match = content.match(/^\s*#\s+(.+)\s*$/m);
          if (match) title = match[1].trim();
        }

        // 最后回退到文件名
        title = title || stem;

        items.push({
          text: title,
          link: path.posix.join(baseUrl, stem),
          order: typeof data.order === 'number' ? data.order : Number.POSITIVE_INFINITY,
          name: stem,
          date
        });
      } catch (e) {
        console.warn(`[Config] Warning: Failed to parse ${entryPath}`, e);
        // 出错时跳过该文件，而不是崩溃
      }
    }
  }

  // 排序逻辑优化：如果是 News 且包含年份文件夹，特殊处理
  const result = items.sort((a, b) => {
    // 特殊处理：Other 文件夹永远排在最后
    const isAOther = (a.name || '').toLowerCase() === 'other' || (a.text || '').toLowerCase() === 'other';
    const isBOther = (b.name || '').toLowerCase() === 'other' || (b.text || '').toLowerCase() === 'other';

    if (isAOther && !isBOther) return 1;
    if (!isAOther && isBOther) return -1;

    // News 特殊排序：如果检测到是年份文件夹（这里做一个简单的正则判断），则倒序排列
    if (options.isNewsRoot) {
      const isAYear = /^\d{4}$/.test(a.name || '');
      const isBYear = /^\d{4}$/.test(b.name || '');
      if (isAYear && isBYear) {
        return (b.name || '').localeCompare(a.name || ''); // 倒序：2026 在 2025 上面
      }
    }

    const orderA = a.order ?? Number.POSITIVE_INFINITY;
    const orderB = b.order ?? Number.POSITIVE_INFINITY;

    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 按日期倒序 (新 -> 旧)
    const dateA = a.date ?? 0;
    const dateB = b.date ?? 0;
    if (dateA !== dateB) {
      return dateB - dateA;
    }

    return (a.name ?? '').localeCompare(b.name ?? '', 'en');
  });

  // 如果启用了 News 模式，且排序后的第一项是年份文件夹，则将其展开
  if (options.isNewsRoot && result.length > 0) {
    const firstItem = result[0];
    if (/^\d{4}$/.test(firstItem.name || '')) {
      firstItem.collapsed = false;
    }
  }

  return result.map(({ order, name, date, ...rest }) => rest);
}
