/**
 * @file auto-inject-title.ts
 * @description 自动注入标题插件 (Auto Inject Title Plugin)
 * 职责：
 * 1. 在 Vite 构建/转换阶段，读取 Markdown 文件的 Frontmatter title。
 * 2. 如果文件内容中没有 H1 标题，自动在开头插入 H1 标题。
 * 3. 如果已有 H1，强制替换为一致的标题。
 * 4. 允许自带语义标题的交互页以 `injectTitle: false` 显式退出。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import type { Plugin } from 'vite';
import { shouldInjectTitle } from '../configs/content-modules.shared';

const pluginDir = path.dirname(fileURLToPath(import.meta.url));
const docsRoot = path.resolve(pluginDir, '../..');

/**
 * 在正文（不含 frontmatter）中注入或替换 H1。
 * 规则：前 5 行内若有 H1 则替换为 `# ${title}`，否则在开头插入。
 * Markdown 块数不变或恰好 +1（插入的 H1 自成一块）；双语配对依赖两侧走同一规则。
 */
export function injectTitle(content: string, title: string): string {
  // CRLF 工作区（Windows autocrlf）下行尾带 \r，会让 H1 正则失配而重复注入标题。
  const lines = content.split(/\r?\n/);
  const h1Regex = /^\s*#\s+(.*)$/;
  const checkLimit = Math.min(lines.length, 5);

  for (let i = 0; i < checkLimit; i++) {
    if (h1Regex.test(lines[i])) {
      lines[i] = `# ${title}`;
      return lines.join('\n');
    }
  }
  return `# ${title}\n\n${content}`;
}

export function autoInjectTitle(): Plugin {
  return {
    name: 'auto-inject-title',
    enforce: 'pre',
    transform(code, id) {
      const filePath = id.split('?')[0];
      if (!filePath.endsWith('.md') || filePath.includes('node_modules')) return;

      try {
        const { data, content } = matter(code);
        const relativePath = path.relative(docsRoot, filePath);

        if (!shouldInjectTitle(relativePath) || !data.title || data.injectTitle === false) return;

        return matter.stringify(injectTitle(content, data.title), data);
      } catch (e) {
        return;
      }
    }
  };
}
