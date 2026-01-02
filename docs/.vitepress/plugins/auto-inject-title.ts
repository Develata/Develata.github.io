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
      if (!id.endsWith('.md') || id.includes('node_modules')) return;

      try {
        const { data, content } = matter(code);

        if (path.basename(id).toLowerCase() === 'index.md' || !data.title) return;

        // Simplify: Only check first 5 non-empty lines for H1
        const lines = content.split('\n');
        let h1LineIndex = -1;
        let h1Content = '';

        // Check first 5 lines (or fewer if file is short)
        const checkLimit = Math.min(lines.length, 5);
        const h1Regex = /^\s*#\s+(.*)$/;

        for (let i = 0; i < checkLimit; i++) {
          const match = h1Regex.exec(lines[i]);
          if (match) {
            h1LineIndex = i;
            h1Content = match[1];
            break;
          }
        }

        if (h1LineIndex !== -1) {
           // Found H1 within first 5 lines, replace it
           lines[h1LineIndex] = `# ${data.title}`;
           const newContent = lines.join('\n');
           return matter.stringify(newContent, data);
        } else {
           // No H1 found in first 5 lines, inject at top
           return matter.stringify(`# ${data.title}\n\n${content}`, data);
        }
      } catch (e) {
        return;
      }
    }
  };
}
