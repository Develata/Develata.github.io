/**
 * @file auto-inject-title.ts
 * @description 自动注入标题插件 (Auto Inject Title Plugin)
 * 职责：
 * 1. 在 Vite 构建/转换阶段，读取 Markdown 文件的 Frontmatter title。
 * 2. 如果文件内容中没有 H1 标题，自动在开头插入 H1 标题。
 * 3. 如果已有 H1，强制替换为一致的标题。
 */
import path from 'node:path';
import matter from 'gray-matter';
import type { Plugin } from 'vite';

export function autoInjectTitle(): Plugin {
  return {
    name: 'auto-inject-title',
    enforce: 'pre',
    transform(code, id) {
      // 仅处理 .md 文件，排除 node_modules
      if (!id.endsWith('.md') || id.includes('node_modules')) return;

      try {
        const { data, content } = matter(code);

        // 排除首页和无标题页面
        if (path.basename(id).toLowerCase() === 'index.md' || !data.title) return;

        // 检查是否已有 H1
        const h1Regex = /^\s*#\s+(.*)$/m;
        const hasH1 = h1Regex.test(content);

        if (hasH1) {
          // 如果已有 H1，强制替换为 Frontmatter 中的 title
          const newContent = content.replace(h1Regex, `# ${data.title}`);
          return matter.stringify(newContent, data);
        } else {
          // 如果没有 H1，自动注入
          return matter.stringify(`# ${data.title}\n\n${content}`, data);
        }
      } catch (e) {
        return;
      }
    }
  };
}
