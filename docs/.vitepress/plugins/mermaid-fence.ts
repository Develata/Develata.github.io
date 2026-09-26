/**
 * @file mermaid-fence.ts
 * @description Mermaid 代码块渲染规则 (markdown-it)。
 * 职责：把 ```mermaid / ```mmd 围栏渲染为 <MermaidDiagram>，其余围栏交还原规则。
 * 不变量：
 * 1. 这里只产出组件标签，不引用 mermaid 运行时；mermaid 由组件在客户端按需动态导入，
 *    因此不含 mermaid 围栏的页面不会加载 mermaid。
 * 2. 图源经 encodeURIComponent 编码后放入属性，不含引号，不会破坏 Vue 模板。
 */
import type MarkdownIt from 'markdown-it';

const MERMAID_LANGS = new Set(['mermaid', 'mmd']);

export function mermaidFence(md: MarkdownIt): void {
  const fallback = md.renderer.rules.fence!;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    if (!MERMAID_LANGS.has(token.info.trim())) {
      return fallback(tokens, idx, options, env, self);
    }
    return `<MermaidDiagram graph="${encodeURIComponent(token.content)}" />\n`;
  };
}
